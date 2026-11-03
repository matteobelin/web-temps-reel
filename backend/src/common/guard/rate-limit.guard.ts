import { CanActivate, ExecutionContext, HttpException, Injectable, Optional } from "@nestjs/common";
import { RedisService } from "../../service/redis.service.js";

@Injectable()
export class RateLimitGuard implements CanActivate {
    private readonly entries = new Map<string, { count: number; resetAt: number }>();
    private readonly windowMs = 60_000;
    private readonly maxRequests = 10;

    constructor(@Optional() private readonly redis?: RedisService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        const request = context.switchToHttp().getRequest<{ ip?: string; path?: string }>();
        const key = `${request.ip ?? "unknown"}:${request.path ?? "unknown"}`;
        if (!this.redis) {
            const now = Date.now();
            const current = this.entries.get(key);
            const entry = !current || current.resetAt <= now
                ? { count: 1, resetAt: now + this.windowMs }
                : { count: current.count + 1, resetAt: current.resetAt };
            this.entries.set(key, entry);
            if (entry.count > this.maxRequests) throw new HttpException("Too many requests", 429);
            return true;
        }
        const allowed = this.redis?.consume(key, this.maxRequests, this.windowMs);
        if (allowed === undefined || typeof allowed === "boolean") {
            if (allowed === false) throw new HttpException("Too many requests", 429);
            return true;
        }
        return allowed.then((result) => {
            if (!result) throw new HttpException("Too many requests", 429);
            return true;
        });
    }
}
