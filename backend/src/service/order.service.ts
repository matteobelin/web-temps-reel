import {Injectable} from "@nestjs/common";
import {MealStatus, Order, Role} from "shared";
import {PrismaService} from "../../prisma/prisma.service.js";
import {SseService} from "./sse.service.js";

@Injectable()
export class OrderService {
    constructor(private readonly prisma: PrismaService, private readonly sseService : SseService){}

    async findAll(role:Role, restaurantId:number): Promise<Order[]> {
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
            where: { restaurantId },
            include: {
                waiter: true,
                restaurant: true,
                meals: filterStatus
                    ? { where: { status: filterStatus } }
                    : true,
            },
        });

        return orders.map(order => this.mapOrder(order));
    }

    async create(order:Order, restaurantId:number){
        order.meals.forEach(meal => {
            if(meal.status !== MealStatus.VALIDATION){
                meal.status = MealStatus.VALIDATION
            }
        })

        const user = await this.prisma.user.findFirst({
            where: {
                name: order.waiter,
                restaurantId: restaurantId,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const data = await this.prisma.order.create({
            data: {
                table: order.table,
                restaurantId,
                waiterId: user.id,

                meals: {
                    create: order.meals.map((meal) => ({
                        status: MealStatus.VALIDATION,
                        date: meal.date,
                        quantity: meal.quantity,
                        price: meal.price,
                        comment: meal.comment,
                    })),
                },
            },

            include: {
                restaurant: true,
                waiter: true,
                meals: true,
            },
        });

        const orderCreated:Order = this.mapOrder(data);
        this.sseService.emitMany([Role.COOK, Role.MANAGER], restaurantId, orderCreated);
    }

    async advanceStatus(id:number, role: Role, restaurantId: number){
        let nextStatus: MealStatus
        let roles: Role[]
        switch (role) {
            case Role.WAITER:
                nextStatus = MealStatus.SERVED
                roles = [Role.WAITER]
                break;
            case Role.COOK:
                nextStatus = MealStatus.READY
                roles = [Role.WAITER, Role.MANAGER]
                break;
            case Role.MANAGER:
                nextStatus = MealStatus.IN_PROGRESS
                roles = [Role.COOK, Role.MANAGER]
                break;
            default:
                throw new Error("Invalid role");
        }

        const data = await this.prisma.meal.update({
            where: { id },
            data: { status: nextStatus },

            include: {
                order: {
                    include: {
                        waiter: true,
                        restaurant: true,
                        meals: true,
                    },
                },
            },
        });
        const orderUpdate:Order = this.mapOrder(data);

        this.sseService.emitMany(roles, restaurantId, orderUpdate)
    }

    async cancelStatus(id:number, restaurantId:number) {
        let data = await this.prisma.meal.findUnique({
            where: {
                id: id,
            },
        });

        if(data == null){
            throw new Error("Data not found");
        }

        const previousStatus = data.status;

        data = await this.prisma.meal.update({
            where: { id },
            data: { status: MealStatus.CANCELED },

            include: {
                order: {
                    include: {
                        waiter: true,
                        restaurant: true,
                        meals: true,
                    },
                },
            },
        });
        let roles:Role[];
        switch (previousStatus) {
            case MealStatus.READY:
                roles = [Role.WAITER, Role.MANAGER]
                break;
            case MealStatus.IN_PROGRESS:
                roles = [Role.COOK, Role.MANAGER]
                break;
            default:
                roles = [Role.MANAGER]
                break;
        }

        const orderUpdate:Order = this.mapOrder(data);
        this.sseService.emitMany(roles, restaurantId ,orderUpdate)
    }

    private mapOrder(order: any) {
        return {
            table: order.table,

            waiter: order.waiter.name,
            restaurant: order.restaurant.name,

            meals: order.meals.map((meal: any) => ({
                status: meal.status,
                date: meal.date,
                quantity: meal.quantity,
                price: meal.price,
                comment: meal.comment,
            })),
        };
    }
}