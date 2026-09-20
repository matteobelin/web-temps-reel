import { Module } from "@nestjs/common";
import { AuthModule } from "./auth.module.js";
import { ChatGateway } from "../gateway/chat.gateway.js";
import { ChatService } from "../service/chat.service.js";
import {ChatController} from "../controller/chat.js";

@Module({
    imports: [AuthModule],
    controllers: [ChatController],
    providers: [ChatGateway, ChatService],
})
export class ChatModule {}