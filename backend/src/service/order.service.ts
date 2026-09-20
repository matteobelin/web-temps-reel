import {ConflictException, ForbiddenException, Injectable, NotFoundException} from "@nestjs/common";
import {MealStatus, type OrderInputType, type OrderOutputType, Role} from "shared";
import {PrismaService} from "../../prisma/prisma.service.js";
import {SseService} from "./sse.service.js";


type Transition = {
    from: MealStatus;
    to: MealStatus;
    notify: Role[];
};

const TRANSITIONS: Partial<Record<Role, Transition>> = {
    [Role.MANAGER]: { from: MealStatus.VALIDATION,  to: MealStatus.IN_PROGRESS, notify: [Role.COOK, Role.MANAGER] },
    [Role.COOK]:    { from: MealStatus.IN_PROGRESS, to: MealStatus.READY,       notify: [Role.WAITER, Role.MANAGER] },
    [Role.WAITER]:  { from: MealStatus.READY,       to: MealStatus.SERVED,      notify: [Role.WAITER] },
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

    async findAll(role:Role, restaurantCode:string): Promise<OrderOutputType[]> {
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
                ...(filterStatus && { meals: { some: { status: filterStatus } } }),
            },
            include: {
                waiter: { select: { matricule: true, name: true } },
                meals: filterStatus ? { where: { status: filterStatus } } : true,
            },
        });

        return orders.map(order => this.mapOrder(order));
    }

    async create(order:OrderInputType, userMatricule:string ,restaurantCode:string){
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

        const data = await this.prisma.order.create({
            data: {
                tableNumber: order.table,
                restaurant: { connect: { code: restaurantCode } },
                waiter: { connect: { id: user.id } },
                meals: {
                    create: order.meals.map(({ quantity, price, comment }) => ({
                        status: MealStatus.VALIDATION,
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

        const orderCreated:OrderOutputType = this.mapOrder(data);
        this.sseService.emitMany([Role.COOK, Role.MANAGER], restaurantCode, orderCreated);
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

        const { count } = await this.prisma.meal.updateMany({
            where: { orderId, status: transition.from },
            data: { status: transition.to },
        });
        if (count === 0) {
            throw new ConflictException("No meal to advance in this order");
        }

        const order = await this.prisma.order.findUniqueOrThrow({
            where: { id: orderId },
            include: {
                waiter: { select: { matricule: true, name: true } },
                meals: true,
            },
        });

        const orderUpdate:OrderOutputType = this.mapOrder(order);

        this.sseService.emitMany(transition.notify, restaurantCode, orderUpdate)
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

        const { count } = await this.prisma.meal.updateMany({
            where: { orderId, status: { in: CANCELABLE } },
            data: { status: MealStatus.CANCELED },
        });
        if (count === 0) {
            throw new ConflictException("Order status changed, please retry");
        }

        const updated = await this.prisma.order.findUniqueOrThrow({
            where: { id: orderId },
            include: {
                waiter: { select: { matricule: true, name: true } },
                meals: true,
            },
        });
        const orderUpdate:OrderOutputType = this.mapOrder(updated);
        this.sseService.emitMany(notify, restaurantCode ,orderUpdate)
    }

    private mapOrder(order: {
        id: number;
        tableNumber: number;
        waiter: { name: string; matricule: string };
        meals: {
            status: MealStatus;
            createdAt: Date;
            quantity: number;
            price: number;
            comment: string | null;
        }[];
    }): OrderOutputType {
        return {
            id: order.id,
            table: order.tableNumber,
            waiterName: order.waiter.name,
            waiterMatricule: order.waiter.matricule,
            meals: order.meals.map(({ status, createdAt, quantity, price, comment }) => ({
                status,
                createdAt,
                quantity,
                price,
                comment: comment ?? undefined,
            })),
        };
    }
}