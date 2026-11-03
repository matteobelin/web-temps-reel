import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Role, type OrderOutputType } from "shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "./redis.service.js";
import { SseService } from "./sse.service.js";

const CHANNEL = "orders:events";
const OUTBOX_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

type PublishedEvent = {
    id: number;
    restaurantCode: string;
    roles: Role[];
    payload: OrderOutputType;
};

@Injectable()
export class OutboxWorker implements OnModuleInit, OnModuleDestroy {
    private timer?: ReturnType<typeof setInterval>;
    private unsubscribe?: () => Promise<void>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly sse: SseService,
    ) {}

    async onModuleInit() {
        this.unsubscribe = await this.redis.subscribe(CHANNEL, (message) => {
            try {
                const event = JSON.parse(message) as PublishedEvent;
                this.sse.emitMany(event.roles, event.restaurantCode, event.payload, String(event.id));
            } catch {
                console.error(JSON.stringify({ level: "warn", event: "outbox.invalid_message" }));
            }
        });
        this.timer = setInterval(() => void this.publishPending(), 1000);
        void this.publishPending();
    }

    async onModuleDestroy() {
        if (this.timer) clearInterval(this.timer);
        await this.unsubscribe?.();
    }

    private async publishPending() {
        try {
            const events = await this.prisma.outboxEvent.findMany({
                where: {
                    publishedAt: null,
                    OR: [
                        { claimedAt: null },
                        { claimedAt: { lt: new Date(Date.now() - 60_000) } },
                    ],
                },
                orderBy: { id: "asc" },
                take: 50,
            });

            for (const event of events) {
                const claimed = await this.prisma.outboxEvent.updateMany({
                    where: {
                        id: event.id,
                        publishedAt: null,
                        OR: [
                            { claimedAt: null },
                            { claimedAt: { lt: new Date(Date.now() - 60_000) } },
                        ],
                    },
                    data: { attempts: { increment: 1 }, claimedAt: new Date() },
                });
                if (claimed.count !== 1) continue;

                const message: PublishedEvent = {
                    id: event.id,
                    restaurantCode: event.restaurantCode,
                    roles: Array.isArray(event.roles) ? event.roles as Role[] : [],
                    payload: event.payload as unknown as OrderOutputType,
                };
                const published = await this.redis.publish(CHANNEL, JSON.stringify(message));
                if (!published) {
                    this.sse.emitMany(message.roles, message.restaurantCode, message.payload, String(message.id));
                }
                await this.prisma.outboxEvent.update({
                    where: { id: event.id },
                    data: { publishedAt: new Date(), claimedAt: null, lastError: null },
                });
            }

            await this.prisma.outboxEvent.deleteMany({
                where: {
                    publishedAt: { lt: new Date(Date.now() - OUTBOX_RETENTION_MS) },
                },
            });
        } catch (error) {
            console.error(JSON.stringify({
                level: "error",
                event: "outbox.publish_failed",
                error: error instanceof Error ? error.message : String(error),
            }));
        }
    }
}
