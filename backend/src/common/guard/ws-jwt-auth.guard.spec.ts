import { describe, expect, it } from "vitest";
import type { ExecutionContext } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { WsJwtAuthGuard } from "./ws-jwt-auth.guard.js";

const contextFor = (user: unknown) => ({
    switchToWs: () => ({
        getClient: () => ({ data: { user } }),
    }),
}) as ExecutionContext;

describe("WsJwtAuthGuard", () => {
    it("allows an authenticated websocket client", () => {
        expect(new WsJwtAuthGuard().canActivate(contextFor({ id: 1 }))).toBe(true);
    });

    it("rejects an unauthenticated websocket client", () => {
        expect(() => new WsJwtAuthGuard().canActivate(contextFor(undefined))).toThrow(WsException);
    });
});
