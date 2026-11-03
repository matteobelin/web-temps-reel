import { describe, expect, it, vi } from "vitest";
import { HealthController } from "./health.js";

describe("HealthController", () => {
    it("returns a successful liveness response", () => {
        const controller = new HealthController({} as never, {} as never);

        expect(controller.live()).toEqual({ status: "ok" });
    });

    it("checks the database before reporting readiness", async () => {
        const queryRaw = vi.fn().mockResolvedValue([{ "?column?": 1 }]);
        const controller = new HealthController({ $queryRaw: queryRaw } as never, {} as never);

        await expect(controller.ready()).resolves.toEqual({ status: "ok" });
        expect(queryRaw).toHaveBeenCalledOnce();
    });

    it("delegates metrics to MetricsService", () => {
        const prometheus = vi.fn().mockReturnValue("metrics\n");
        const controller = new HealthController({} as never, { prometheus } as never);

        expect(controller.metricsEndpoint()).toBe("metrics\n");
        expect(prometheus).toHaveBeenCalledOnce();
    });
});
