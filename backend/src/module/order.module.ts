import { Module } from "@nestjs/common";
import { OrderService } from "../service/order.service.js";
import {OrdersController} from "../controller/orders.js";
import {SseService} from "../service/sse.service.js";
import {SseController} from "../controller/sse.js";

@Module({
    controllers: [OrdersController, SseController],
    providers: [OrderService, SseService],
})
export class OrderModule {}