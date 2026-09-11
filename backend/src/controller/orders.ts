import {Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards} from "@nestjs/common";
import {OrderService} from "../service/order.service.js";
import {Order, OrderSchema, Role} from "shared";
import {Roles} from "../decorator/roles.decorator.js";
import {JwtAuthGuard} from "../guard/jwt-auth.guard.js";
import {RolesGuard} from "../guard/role.guard.js";
import {CurrentUser} from "../decorator/currentUser.decorator.js";

@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController{
    constructor(private readonly orderService:OrderService) {}

    @Get()
    @Roles(Role.WAITER, Role.COOK, Role.MANAGER)
    async getOrders(@CurrentUser() user: { role: Role, restaurant: number }): Promise<Order[]> {
        return await this.orderService.findAll(user.role, user.restaurant);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.WAITER)
    @Post("create")
    async createOrder(@Body() dto: any,
                      @CurrentUser() user: { restaurant: number }){
        const order = OrderSchema.parse(dto)
        await this.orderService.create(order, user.restaurant)
    }

    @Patch(":id/advance")
    @Roles(Role.WAITER, Role.COOK, Role.MANAGER)
    async advanceStatus(
        @Param("id", ParseIntPipe) id: number,
        @CurrentUser() user: { role: Role, restaurant: number }
    ) {
        return this.orderService.advanceStatus(id, user.role, user.restaurant);
    }

    @Patch(":id/cancel")
    @Roles(Role.WAITER, Role.COOK, Role.MANAGER)
    async canceledStatus(
        @Param("id", ParseIntPipe) id: number,
        @CurrentUser() user: { restaurant: number }
    ){
        return this.orderService.cancelStatus(id, user.restaurant)
    }
}