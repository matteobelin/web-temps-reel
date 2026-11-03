import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { MetricsService } from "../service/metrics.service.js";

@Controller("health")
export class HealthController {
    constructor(private readonly prisma: PrismaService, private readonly metrics: MetricsService) {}

    @Get("live")
    live() {
        return { status: "ok" };
    }

    @Get("ready")
    async ready() {
        await this.prisma.$queryRaw`SELECT 1`;
        return { status: "ok" };
    }

    @Get("metrics")
    metricsEndpoint() {
        return this.metrics.prometheus();
    }
}
