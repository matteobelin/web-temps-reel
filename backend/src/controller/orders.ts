import { Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards} from "@nestjs/common";
import {OrderService} from "../service/order.service.js";
import {type OrderInputType, type OrderOutputType, OrderSchemaInput, Role} from "shared";
import {Roles} from "../common/decorator/roles.decorator.js";
import {JwtAuthGuard} from "../common/guard/jwt-auth.guard.js";
import {RolesGuard} from "../common/guard/role.guard.js";
import {CurrentUser} from "../common/decorator/currentUser.decorator.js";
import {ZodBody} from "../common/decorator/zod.decorator.js";

@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController{
    constructor(private readonly orderService:OrderService) {}

    @Get()
    @Roles(Role.WAITER, Role.COOK, Role.MANAGER)
    async getOrders(@CurrentUser() user: { role: Role, restaurant: string }): Promise<OrderOutputType[]> {
        return await this.orderService.findAll(user.role, user.restaurant);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.WAITER)
    @Post("create")
    async createOrder(@ZodBody(OrderSchemaInput) orderDto: OrderInputType,
                      @CurrentUser() user: { matricule: string, restaurant: string }){
        await this.orderService.create(orderDto, user.matricule, user.restaurant)
    }

    @Patch(":id/advance")
    @Roles(Role.WAITER, Role.COOK, Role.MANAGER)
    async advanceStatus(
        @Param("id", ParseIntPipe) id: number,
        @CurrentUser() user: { role: Role, restaurant: string }
    ) {
        return this.orderService.advanceStatus(id, user.role, user.restaurant);
    }

    @Patch(":id/cancel")
    @Roles(Role.WAITER, Role.COOK, Role.MANAGER)
    async canceledStatus(
        @Param("id", ParseIntPipe) id: number,
        @CurrentUser() user: { restaurant: string }
    ){
        return this.orderService.cancelStatus(id, user.restaurant)
    }
}