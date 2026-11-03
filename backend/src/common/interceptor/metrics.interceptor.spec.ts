import { describe, expect, it, vi } from "vitest";
import { of, throwError, firstValueFrom } from "rxjs";
import { MetricsInterceptor } from "./metrics.interceptor.js";

describe("MetricsInterceptor", () => {
    it("records successful responses using the route path", async () => {
        const recordRequest = vi.fn();
        const interceptor = new MetricsInterceptor({ recordRequest } as never);
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({ method: "GET", route: { path: "/orders" } }),
                getResponse: () => ({ statusCode: 200 }),
            }),
        } as never;

        await firstValueFrom(interceptor.intercept(context, { handle: () => of({}) } as never));

        expect(recordRequest).toHaveBeenCalledWith("GET", "/orders", 200);
    });

    it("records errors using the request path", async () => {
        const recordRequest = vi.fn();
        const interceptor = new MetricsInterceptor({ recordRequest } as never);
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({ method: "POST", path: "/fallback" }),
                getResponse: () => ({ statusCode: 500 }),
            }),
        } as never;

        await expect(firstValueFrom(interceptor.intercept(
            context,
            { handle: () => throwError(() => new Error("failed")) } as never,
        ))).rejects.toThrow("failed");

        expect(recordRequest).toHaveBeenCalledWith("POST", "/fallback", 500);
    });
});
