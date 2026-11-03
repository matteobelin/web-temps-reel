import { describe, expect, it, vi } from "vitest";
import { RequestLoggingMiddleware } from "./request-logging.middleware.js";

describe("RequestLoggingMiddleware", () => {
    it("preserves a valid request id and forwards it to the response", () => {
        const setHeader = vi.fn();
        const on = vi.fn();
        const next = vi.fn();
        const request = {
            method: "GET",
            originalUrl: "/health/live",
            ip: "127.0.0.1",
            header: vi.fn().mockReturnValue("request-123"),
            headers: {},
        } as never;

        new RequestLoggingMiddleware().use(request, { setHeader, on, statusCode: 200 } as never, next);

        expect(request.headers["x-request-id"]).toBe("request-123");
        expect(setHeader).toHaveBeenCalledWith("x-request-id", "request-123");
        expect(on).toHaveBeenCalledWith("finish", expect.any(Function));
        expect(next).toHaveBeenCalledOnce();
    });

    it("replaces an invalid request id", () => {
        const request = {
            method: "GET",
            header: vi.fn().mockReturnValue("invalid id"),
            headers: {},
        } as never;

        new RequestLoggingMiddleware().use(request, { setHeader: vi.fn(), on: vi.fn() } as never, vi.fn());

        expect(request.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
    });
});
