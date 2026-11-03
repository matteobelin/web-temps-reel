import { Controller, Get, Header } from "@nestjs/common";
import { MetricsService } from "../service/metrics.service.js";

@Controller("metrics")
export class MetricsController {
    constructor(private readonly metrics: MetricsService) {}

    @Get()
    @Header("Content-Type", "text/plain; version=0.0.4")
    getMetrics() {
        return this.metrics.prometheus();
    }
}
