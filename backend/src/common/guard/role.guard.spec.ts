import { describe, expect, it, vi } from "vitest";
import { Reflector } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";
import { RolesGuard } from "./role.guard.js";

const contextFor = (user: unknown) => ({
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
}) as unknown as ExecutionContext;

describe("RolesGuard", () => {
    it("allows routes without role metadata", () => {
        const reflector = { getAllAndOverride: vi.fn().mockReturnValue(undefined) } as unknown as Reflector;

        expect(new RolesGuard(reflector).canActivate(contextFor({ role: "COOK" }))).toBe(true);
    });

    it("allows a user with a required role", () => {
        const reflector = { getAllAndOverride: vi.fn().mockReturnValue(["MANAGER", "COOK"]) } as unknown as Reflector;

        expect(new RolesGuard(reflector).canActivate(contextFor({ role: "COOK" }))).toBe(true);
    });

    it("denies a user without a required role", () => {
        const reflector = { getAllAndOverride: vi.fn().mockReturnValue(["MANAGER"]) } as unknown as Reflector;

        expect(new RolesGuard(reflector).canActivate(contextFor({ role: "WAITER" }))).toBe(false);
    });
});
