import { Module } from "@nestjs/common";
import { OrderService } from "../service/order.service.js";
import {OrdersController} from "../controller/orders.js";

@Module({
    controllers: [OrdersController],
    providers: [OrderService],
})
export class OrderModule {}