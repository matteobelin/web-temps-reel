import { describe, expect, it } from "vitest";
import { MetricsService } from "./metrics.service.js";

describe("MetricsService", () => {
    it("aggregates requests by method, route and status", () => {
        const service = new MetricsService();

        service.recordRequest("GET", "/health/live", 200);
        service.recordRequest("GET", "/health/live", 200);
        service.recordRequest("GET", "/health/live", 503);

        expect(service.snapshot()).toEqual([
            { method: "GET", route: "/health/live", status: 200, count: 2 },
            { method: "GET", route: "/health/live", status: 503, count: 1 },
        ]);
    });

    it("escapes Prometheus label values", () => {
        const service = new MetricsService();
        service.recordRequest('GET"', "/line\nbreak", 200);

        expect(service.prometheus()).toContain(
            'http_requests_total{method="GET\\"",route="/line\\nbreak",status="200"} 1',
        );
    });
});
