import { Module } from "@nestjs/common";
import { OrderService } from "../service/order.service.js";
import {OrdersController} from "../controller/orders.js";
import {SseService} from "../service/sse.service.js";
import {SseController} from "../controller/sse.js";
import {AuthModule} from "./auth.module.js";

@Module({
    imports: [AuthModule],
    controllers: [OrdersController, SseController],
    providers: [OrderService, SseService],
})
export class OrderModule {}