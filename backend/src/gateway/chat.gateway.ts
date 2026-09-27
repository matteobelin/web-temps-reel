import {
    MessageBody,
    OnGatewayConnection,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
    type OnGatewayInit,
} from "@nestjs/websockets";
import { UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Namespace, Socket } from "socket.io";
import { z } from "zod";
import { ChatMessageInput } from "shared";
import { CurrentUser } from "../common/decorator/currentUser.decorator.js";
import type { AuthUser } from "../common/strategy/jwt.strategy.js";
import { WsJwtAuthGuard } from "../common/guard/ws-jwt-auth.guard.js";
import { ChatService } from "../service/chat.service.js";
import {wsAuthMiddleware} from "../middleware/ws.middleware.js";

const room = (restaurantCode: string) => `restaurant:${restaurantCode}`;

@UseGuards(WsJwtAuthGuard)
@WebSocketGateway({
    namespace: "chat",
    cors: { origin: process.env.FRONTEND_URL ?? "http://localhost:4200", credentials: true },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
    @WebSocketServer() server!: Namespace;

    constructor(
        private readonly jwt: JwtService,
        private readonly chat: ChatService,
    ) {}

    afterInit(server: Namespace) {
        server.use(wsAuthMiddleware(this.jwt));
    }

    async handleConnection(client: Socket) {
        await client.join(room(client.data.user.restaurantCode));
    }

    @SubscribeMessage("message:send")
    async onMessage(@CurrentUser() user: AuthUser, @MessageBody() body: unknown) {
        const parsed = ChatMessageInput.safeParse(body);
        if (!parsed.success) {
            throw new WsException(z.flattenError(parsed.error));
        }

        const message = await this.chat.create(parsed.data.content, user.matricule, user.restaurantCode);
        this.server.to(room(user.restaurantCode)).emit("message:new", message);
    }
}