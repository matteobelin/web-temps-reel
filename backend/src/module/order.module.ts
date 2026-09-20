import { Module } from "@nestjs/common";
import { OrderService } from "../service/order.service.js";
import {OrdersController} from "../controller/orders.js";
import {SseService} from "../service/sse.service.js";

@Module({
    controllers: [OrdersController],
    providers: [OrderService, SseService],
})
export class OrderModule {}