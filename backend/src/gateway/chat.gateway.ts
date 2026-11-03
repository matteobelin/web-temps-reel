import {
    MessageBody,
    OnGatewayConnection,
    ConnectedSocket,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
    type OnGatewayInit,
} from "@nestjs/websockets";
import { OnModuleDestroy, UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { Namespace, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient, type RedisClientType } from "redis";
import { z } from "zod";
import { ChatMessageInput } from "shared";
import { CurrentUser } from "../common/decorator/currentUser.decorator.js";
import type { AuthUser } from "../common/strategy/jwt.strategy.js";
import { WsJwtAuthGuard } from "../common/guard/ws-jwt-auth.guard.js";
import { ChatService } from "../service/chat.service.js";
import {wsAuthMiddleware} from "../middleware/ws.middleware.js";
import { RedisService } from "../service/redis.service.js";

const room = (restaurantCode: string) => `restaurant:${restaurantCode}`;
const MESSAGE_WINDOW_MS = 10_000;
const MAX_MESSAGES_PER_WINDOW = 30;

@UseGuards(WsJwtAuthGuard)
@WebSocketGateway({
    namespace: "chat",
    cors: { origin: process.env.FRONTEND_URL ?? "http://localhost:4200", credentials: true },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnModuleDestroy {
    @WebSocketServer() server!: Namespace;
    private redisPub?: RedisClientType;
    private redisSub?: RedisClientType;

    constructor(
        private readonly jwt: JwtService,
        private readonly prisma: PrismaService,
        private readonly chat: ChatService,
        private readonly redis: RedisService,
    ) {}

    async afterInit(server: Namespace) {
        server.use(wsAuthMiddleware(this.jwt, this.prisma));
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) return;

        try {
            this.redisPub = createClient({ url: redisUrl });
            this.redisSub = this.redisPub.duplicate();
            this.redisPub.on("error", (error) => console.error(JSON.stringify({
                level: "error",
                event: "socket.redis_error",
                error: error.message,
            })));
            this.redisSub.on("error", (error) => console.error(JSON.stringify({
                level: "error",
                event: "socket.redis_subscriber_error",
                error: error.message,
            })));
            await Promise.all([this.redisPub.connect(), this.redisSub.connect()]);
            server.server.adapter(createAdapter(this.redisPub, this.redisSub));
        } catch (error) {
            console.error(JSON.stringify({
                level: "error",
                event: "socket.redis_adapter_failed",
                error: error instanceof Error ? error.message : String(error),
            }));
        }
    }

    async handleConnection(client: Socket) {
        await client.join(room(client.data.user.restaurantCode));
    }

    async onModuleDestroy() {
        await Promise.all([
            this.redisPub?.isOpen ? this.redisPub.quit() : Promise.resolve(),
            this.redisSub?.isOpen ? this.redisSub.quit() : Promise.resolve(),
        ]);
    }

    @SubscribeMessage("message:send")
    async onMessage(
        @CurrentUser() user: AuthUser,
        @MessageBody() body: unknown,
        @ConnectedSocket() client: Socket,
    ) {
        const key = `${user.restaurantCode}:${user.matricule}:${client.handshake.address}`;
        const allowed = await this.redis.consume(key, MAX_MESSAGES_PER_WINDOW, MESSAGE_WINDOW_MS);
        if (!allowed) {
            throw new WsException("Too many messages");
        }

        const parsed = ChatMessageInput.safeParse(body);
        if (!parsed.success) {
            throw new WsException(z.flattenError(parsed.error));
        }

        const message = await this.chat.create(parsed.data.content, user.matricule, user.restaurantCode);
        this.server.to(room(user.restaurantCode)).emit("message:new", message);
        return { ok: true, message };
    }
}