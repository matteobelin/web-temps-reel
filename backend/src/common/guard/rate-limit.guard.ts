import { CanActivate, ExecutionContext, HttpException, Injectable } from "@nestjs/common";

type Entry = { count: number; resetAt: number };

@Injectable()
export class RateLimitGuard implements CanActivate {
    private readonly entries = new Map<string, Entry>();
    private readonly windowMs = 60_000;
    private readonly maxRequests = 10;

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<{ ip?: string; path?: string }>();
        const key = `${request.ip ?? "unknown"}:${request.path ?? "unknown"}`;
        const now = Date.now();
        const current = this.entries.get(key);
        const entry = !current || current.resetAt <= now
            ? { count: 1, resetAt: now + this.windowMs }
            : { count: current.count + 1, resetAt: current.resetAt };

        this.entries.set(key, entry);
        if (entry.count > this.maxRequests) {
            throw new HttpException("Too many requests", 429);
        }
        return true;
    }
}
