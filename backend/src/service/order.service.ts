import {ConflictException, ForbiddenException, Injectable, NotFoundException} from "@nestjs/common";
import {MealStatus, type OrderInputType, type OrderOutputType, Role} from "shared";
import {PrismaService} from "../../prisma/prisma.service.js";
import {SseService} from "./sse.service.js";
import { Prisma } from "../../generated/prisma/client.js";


type Transition = {
    from: MealStatus;
    to: MealStatus;
    notify: Role[];
};

const TRANSITIONS: Partial<Record<Role, Transition>> = {
    [Role.MANAGER]: { from: MealStatus.VALIDATION,  to: MealStatus.IN_PROGRESS, notify: [Role.COOK, Role.MANAGER] },
    [Role.COOK]:    { from: MealStatus.IN_PROGRESS, to: MealStatus.READY,       notify: [Role.WAITER, Role.MANAGER] },
    [Role.WAITER]:  { from: MealStatus.READY,       to: MealStatus.SERVED,      notify: [Role.WAITER, Role.MANAGER] },
};

const CANCEL_NOTIFY: Partial<Record<MealStatus, Role[]>> = {
    [MealStatus.VALIDATION]:  [Role.MANAGER],
    [MealStatus.IN_PROGRESS]: [Role.COOK, Role.MANAGER],
    [MealStatus.READY]:       [Role.WAITER, Role.MANAGER],
};

const CANCELABLE = Object.keys(CANCEL_NOTIFY) as MealStatus[];

@Injectable()
export class OrderService {
    constructor(private readonly prisma: PrismaService, private readonly sseService : SseService){}

    async findAll(role:Role, restaurantCode:string, before?: number, limit = 100): Promise<OrderOutputType[]> {
        let filterStatus: MealStatus | undefined
        switch (role) {
            case Role.WAITER:
                filterStatus = MealStatus.READY
                break;
            case Role.COOK:
                filterStatus = MealStatus.IN_PROGRESS
                break;
            default:
                filterStatus = undefined;
                break;
        }
        const orders = await this.prisma.order.findMany({
            where: {
                restaurant: { code: restaurantCode },
                ...(before && { id: { lt: before } }),
                ...(filterStatus && { meals: { some: { status: filterStatus } } }),
            },
            orderBy: { id: "desc" },
            take: limit,
            include: {
                waiter: { select: { matricule: true, name: true } },
                meals: filterStatus ? { where: { status: filterStatus } } : true,
            },
        });

        return orders.map(order => this.mapOrder(order));
    }

    async create(order:OrderInputType, userMatricule:string ,restaurantCode:string, idempotencyKey?: string): Promise<OrderOutputType>{
        const user = await this.prisma.user.findFirst({
            where: {
                matricule: userMatricule,
                restaurant: { code: restaurantCode },
            },
            select: { id: true },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        const key = idempotencyKey?.trim();
        if (key) {
            if (key.length > 255) throw new ConflictException("Idempotency-Key is too long");
            const existing = await this.prisma.order.findFirst({
                where: { idempotencyKey: key, waiterId: user.id, restaurant: { code: restaurantCode } },
                include: { waiter: { select: { matricule: true, name: true } }, meals: true },
            });
            if (existing) return this.mapOrder(existing);
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                const data = await tx.order.create({
                    data: {
                        tableNumber: order.table,
                        ...(key ? { idempotencyKey: key } : {}),
                        restaurant: { connect: { code: restaurantCode } },
                        waiter: { connect: { id: user.id } },
                        meals: {
                            create: order.meals.map(({ name, quantity, price, comment }) => ({
                                status: MealStatus.VALIDATION,
                                name,
                                quantity,
                                price,
                                comment,
                            })),
                        },
                    },
                    include: {
                        waiter: { select: { matricule: true, name: true } },
                        meals: true,
                    },
                });
                const orderCreated = this.mapOrder(data);
                await tx.outboxEvent.create({
                    data: this.outboxData(orderCreated, restaurantCode, [Role.COOK, Role.MANAGER], data.id),
                });
                return orderCreated;
            });
        } catch (error) {
            if (key && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                const existing = await this.prisma.order.findFirst({
                    where: { idempotencyKey: key, waiterId: user.id, restaurant: { code: restaurantCode } },
                    include: { waiter: { select: { matricule: true, name: true } }, meals: true },
                });
                if (existing) return this.mapOrder(existing);
                throw new ConflictException("Idempotency-Key is already in use");
            }
            throw error;
        }
    }

    async advanceStatus(orderId:number, role: Role, restaurantCode: string){
        const transition = TRANSITIONS[role];
        if (!transition) {
            throw new ForbiddenException("Role not allowed to advance a meal");
        }

        const exists = await this.prisma.order.findFirst({
            where: { id: orderId, restaurant: { code: restaurantCode } },
            select: { id: true },
        });
        if (!exists) {
            throw new NotFoundException("Order not found");
        }

        const order = await this.prisma.$transaction(async (tx) => {
            const { count } = await tx.meal.updateMany({
                where: { orderId, status: transition.from },
                data: { status: transition.to },
            });
            if (count === 0) {
                throw new ConflictException("No meal to advance in this order");
            }
            const updated = await tx.order.findUniqueOrThrow({
                where: { id: orderId },
                include: {
                    waiter: { select: { matricule: true, name: true } },
                    meals: true,
                },
            });
            if (tx.outboxEvent?.create) {
                await tx.outboxEvent.create({
                    data: this.outboxData(this.mapOrder(updated), restaurantCode, transition.notify, orderId),
                });
            } else {
                this.sseService.emitMany(transition.notify, restaurantCode, this.mapOrder(updated));
            }
            return updated;
        });

        const orderUpdate:OrderOutputType = this.mapOrder(order);

        return orderUpdate;
    }

    async cancelStatus(orderId:number, restaurantCode:string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, restaurant: { code: restaurantCode } },
            select: {
                meals: {
                    where: { status: { in: CANCELABLE } },
                    select: { id: true, status: true },
                },
            },
        });
        if (!order) {
            throw new NotFoundException("Order not found");
        }
        if (order.meals.length === 0) {
            throw new ConflictException("No meal can be canceled in this order");
        }

        const notify = [...new Set(order.meals.flatMap((m) => CANCEL_NOTIFY[m.status] ?? []))];

        const updated = await this.prisma.$transaction(async (tx) => {
            const { count } = await tx.meal.updateMany({
                where: { orderId, status: { in: CANCELABLE } },
                data: { status: MealStatus.CANCELED },
            });
            if (count === 0) {
                throw new ConflictException("Order status changed, please retry");
            }
            const updated = await tx.order.findUniqueOrThrow({
                where: { id: orderId },
                include: {
                    waiter: { select: { matricule: true, name: true } },
                    meals: true,
                },
            });
            if (tx.outboxEvent?.create) {
                await tx.outboxEvent.create({
                    data: this.outboxData(this.mapOrder(updated), restaurantCode, notify, orderId),
                });
            } else {
                this.sseService.emitMany(notify, restaurantCode, this.mapOrder(updated));
            }
            return updated;
        });
        const orderUpdate:OrderOutputType = this.mapOrder(updated);
        return orderUpdate;
    }

    private outboxData(order: OrderOutputType, restaurantCode: string, roles: Role[], orderId: number) {
        return {
            type: "order.updated",
            restaurantCode,
            roles,
            payload: JSON.parse(JSON.stringify(order)) as Prisma.InputJsonValue,
            orderId,
        };
    }

    private mapOrder(order: {
        id: number;
        tableNumber: number;
        waiter: { name: string; matricule: string };
        meals: {
            status: MealStatus;
            createdAt: Date;
            quantity: number;
            price: number | Prisma.Decimal;
            name: string;
            comment: string | null;
        }[];
    }): OrderOutputType {
        return {
            id: order.id,
            table: order.tableNumber,
            waiterName: order.waiter.name,
            waiterMatricule: order.waiter.matricule,
            meals: order.meals.map(({ status, createdAt, name, quantity, price, comment }) => ({
                status,
                createdAt,
                name,
                quantity,
                price: typeof price === "number" ? price.toFixed(2) : price.toFixed(2),
                comment: comment ?? undefined,
            })),
        };
    }
}