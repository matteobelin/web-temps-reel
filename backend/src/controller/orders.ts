import {Controller, Get} from "@nestjs/common";
import {OrderService} from "../service/order.service.js";
import { Order } from "shared";

@Controller("orders")
export class OrdersController{
    constructor(private readonly orderService:OrderService) {}

    @Get()
    async getOrders(): Promise<Order[]> {
        return await this.orderService.findAll();
    }
}