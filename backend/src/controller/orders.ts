import { Controller, Get, Headers, Param, ParseIntPipe, Patch, Post, UseGuards} from "@nestjs/common";
import {OrderService} from "../service/order.service.js";
import {type OrderInputType, type OrderOutputType, OrderSchemaInput, Role} from "shared";
import {Roles} from "../common/decorator/roles.decorator.js";
import {JwtAuthGuard} from "../common/guard/jwt-auth.guard.js";
import {RolesGuard} from "../common/guard/role.guard.js";
import {CurrentUser} from "../common/decorator/currentUser.decorator.js";
import {ZodBody, ZodQuery} from "../common/decorator/zod.decorator.js";
import { z } from "zod";

const OrdersQuery = z.object({
    before: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(100),
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("orders")
export class OrdersController{
    constructor(private readonly orderService:OrderService) {}

    @Get()
    @Roles(Role.WAITER, Role.COOK, Role.MANAGER)
    async getOrders(
        @ZodQuery(OrdersQuery) query: z.infer<typeof OrdersQuery>,
        @CurrentUser() user: { role: Role, restaurantCode: string },
    ): Promise<OrderOutputType[]> {
        return await this.orderService.findAll(user.role, user.restaurantCode, query.before, query.limit);
    }

    @Roles(Role.WAITER)
    @Post("create")
    async createOrder(@ZodBody(OrderSchemaInput) orderDto: OrderInputType,
                      @CurrentUser() user: { matricule: string, restaurantCode: string },
                      @Headers("idempotency-key") idempotencyKey?: string) {
        return this.orderService.create(orderDto, user.matricule, user.restaurantCode, idempotencyKey);
    }

    @Patch(":id/advance")
    @Roles(Role.WAITER, Role.COOK, Role.MANAGER)
    async advanceStatus(
        @Param("id", ParseIntPipe) id: number,
        @CurrentUser() user: { role: Role, restaurantCode: string }
    ) {
        return this.orderService.advanceStatus(id, user.role, user.restaurantCode);
    }

    @Patch(":id/cancel")
    @Roles(Role.WAITER, Role.COOK, Role.MANAGER)
    async canceledStatus(
        @Param("id", ParseIntPipe) id: number,
        @CurrentUser() user: { restaurantCode: string }
    ){
        return this.orderService.cancelStatus(id, user.restaurantCode);
    }
}