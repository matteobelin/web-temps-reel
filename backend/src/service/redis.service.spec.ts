import { describe, expect, it, vi } from "vitest";
import { RedisService } from "./redis.service.js";

describe("RedisService", () => {
    it("enforces the local rate limit and resets the window", () => {
        vi.useFakeTimers();
        const service = new RedisService();

        expect(service.consume("user-1", 2, 1000)).toBe(true);
        expect(service.consume("user-1", 2, 1000)).toBe(true);
        expect(service.consume("user-1", 2, 1000)).toBe(false);

        vi.advanceTimersByTime(1001);
        expect(service.consume("user-1", 2, 1000)).toBe(true);
        vi.useRealTimers();
    });

    it("returns false when Redis is not configured", async () => {
        const service = new RedisService();

        await expect(service.publish("orders", "message")).resolves.toBe(false);
        await expect(service.subscribe("orders", () => undefined)).resolves.toBeUndefined();
    });
});
