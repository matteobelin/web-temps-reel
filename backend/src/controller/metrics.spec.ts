import { describe, expect, it, vi } from "vitest";
import { MetricsController } from "./metrics.js";

describe("MetricsController", () => {
    it("returns the Prometheus exposition", () => {
        const prometheus = vi.fn().mockReturnValue("# TYPE http_requests_total counter\n");
        const controller = new MetricsController({ prometheus } as never);

        expect(controller.getMetrics()).toBe("# TYPE http_requests_total counter\n");
        expect(prometheus).toHaveBeenCalledOnce();
    });
});
