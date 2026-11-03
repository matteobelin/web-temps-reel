import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";

type LocalEntry = { count: number; resetAt: number };

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly client?: Redis;
    private readonly local = new Map<string, LocalEntry>();
    private localFallbackLogged = false;

    constructor() {
        const url = process.env.REDIS_URL;
        if (url) {
            this.client = new Redis(url, {
                lazyConnect: true,
                maxRetriesPerRequest: 1,
                enableOfflineQueue: false,
            });
            this.client.on("error", () => undefined);
        }
    }

    consume(key: string, limit: number, windowMs: number): Promise<boolean> | boolean {
        if (!this.client) {
            return this.consumeLocally(key, limit, windowMs);
        }
        return this.client.eval(
            "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]); end; return count",
            1,
            `ratelimit:${key}`,
            windowMs,
        ).then((count: unknown) => Number(count) <= limit).catch((error) => {
            this.logLocalFallback(error);
            return this.consumeLocally(key, limit, windowMs);
        });
    }

    async publish(channel: string, message: string): Promise<boolean> {
        if (!this.client) return false;
        try {
            const receivers = await this.client.publish(channel, message);
            return receivers > 0;
        } catch (error) {
            this.logLocalFallback(error);
            return false;
        }
    }

    async subscribe(channel: string, handler: (message: string) => void): Promise<(() => Promise<void>) | undefined> {
        if (!this.client) return undefined;
        const subscriber = this.client.duplicate();
        subscriber.on("error", () => undefined);
        try {
            if (subscriber.status === "wait") {
                await subscriber.connect();
            }
            await subscriber.subscribe(channel);
            subscriber.on("message", (_channel: string, message: string) => handler(message));
            return async () => subscriber.disconnect();
        } catch (error) {
            subscriber.disconnect();
            console.error(JSON.stringify({
                level: "warn",
                event: "redis.subscribe_failed",
                channel,
                error: error instanceof Error ? error.message : String(error),
            }));
            return undefined;
        }
    }

    async onModuleDestroy() {
        this.client?.disconnect();
    }

    private consumeLocally(key: string, limit: number, windowMs: number) {
        const now = Date.now();
        const current = this.local.get(key);
        const entry = !current || current.resetAt <= now
            ? { count: 1, resetAt: now + windowMs }
            : { count: current.count + 1, resetAt: current.resetAt };
        this.local.set(key, entry);
        if (this.local.size > 10_000) {
            for (const [entryKey, value] of this.local) {
                if (value.resetAt <= now) this.local.delete(entryKey);
            }
        }
        return entry.count <= limit;
    }

    private logLocalFallback(error: unknown) {
        if (this.localFallbackLogged) return;
        this.localFallbackLogged = true;
        console.error(JSON.stringify({
            level: "error",
            event: "redis.degraded",
            message: "Redis unavailable; using process-local fallback",
            error: error instanceof Error ? error.message : String(error),
        }));
    }
}
