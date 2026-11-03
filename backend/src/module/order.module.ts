import { Module } from "@nestjs/common";
import { OrderService } from "../service/order.service.js";
import {OrdersController} from "../controller/orders.js";
import {SseService} from "../service/sse.service.js";
import {SseController} from "../controller/sse.js";
import {AuthModule} from "./auth.module.js";
import {OutboxWorker} from "../service/outbox.worker.js";

@Module({
    imports: [AuthModule],
    controllers: [OrdersController, SseController],
    providers: [OrderService, SseService, OutboxWorker],
})
export class OrderModule {}