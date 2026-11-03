import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi, afterEach } from "vitest";
import { CsrfOriginMiddleware } from "./csrf-origin.middleware.js";

const request = (method: string, origin?: string) => ({
    method,
    protocol: "http",
    header: (name: string) => name === "origin" ? origin : undefined,
    get: (name: string) => name === "host" ? "localhost:3000" : undefined,
}) as never;

describe("CsrfOriginMiddleware", () => {
    afterEach(() => {
        delete process.env.FRONTEND_URL;
    });

    it("allows configured origins and non-mutating requests", () => {
        const next = vi.fn();
        const middleware = new CsrfOriginMiddleware();
        process.env.FRONTEND_URL = "https://app.example";

        middleware.use(request("POST", "https://app.example"), {} as never, next);
        middleware.use(request("GET", "https://evil.example"), {} as never, next);

        expect(next).toHaveBeenCalledTimes(2);
    });

    it("rejects an invalid mutating request origin", () => {
        const middleware = new CsrfOriginMiddleware();

        expect(() => middleware.use(request("POST", "https://evil.example"), {} as never, vi.fn()))
            .toThrow(ForbiddenException);
    });

    it("allows same-origin and local development origins", () => {
        const next = vi.fn();
        const middleware = new CsrfOriginMiddleware();

        middleware.use(request("PATCH", "http://localhost:3000"), {} as never, next);
        middleware.use(request("DELETE", "http://localhost:4200"), {} as never, next);

        expect(next).toHaveBeenCalledTimes(2);
    });
});
