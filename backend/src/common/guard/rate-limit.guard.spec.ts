import { describe, expect, it } from "vitest";
import type { ExecutionContext } from "@nestjs/common";
import { RateLimitGuard } from "./rate-limit.guard.js";

const contextFor = (ip = "127.0.0.1", path = "/auth/login") => ({
    switchToHttp: () => ({
        getRequest: () => ({ ip, path }),
    }),
}) as ExecutionContext;

describe("RateLimitGuard", () => {
    it("allows the first ten requests for a key", () => {
        const guard = new RateLimitGuard();
        const context = contextFor();

        for (let index = 0; index < 10; index++) {
            expect(guard.canActivate(context)).toBe(true);
        }
    });

    it("rejects the eleventh request for the same key", () => {
        const guard = new RateLimitGuard();
        const context = contextFor();

        for (let index = 0; index < 10; index++) {
            guard.canActivate(context);
        }

        expect(() => guard.canActivate(context)).toThrow("Too many requests");
    });

    it("tracks different IP and path keys independently", () => {
        const guard = new RateLimitGuard();
        const firstIp = contextFor("127.0.0.1");
        const secondIp = contextFor("127.0.0.2");

        for (let index = 0; index < 10; index++) {
            guard.canActivate(firstIp);
        }

        expect(guard.canActivate(secondIp)).toBe(true);
    });
});
