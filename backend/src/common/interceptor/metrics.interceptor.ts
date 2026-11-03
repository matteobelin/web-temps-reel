import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { tap } from "rxjs";
import { MetricsService } from "../../service/metrics.service.js";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    constructor(private readonly metrics: MetricsService) {}

    intercept(context: ExecutionContext, next: CallHandler) {
        const request = context.switchToHttp().getRequest<{ method: string; route?: { path?: string }; path?: string }>();
        const response = context.switchToHttp().getResponse<{ statusCode: number }>();
        return next.handle().pipe(
            tap({
                next: () => this.record(request, response),
                error: () => this.record(request, response),
            }),
        );
    }

    private record(request: { method: string; route?: { path?: string }; path?: string }, response: { statusCode: number }) {
        this.metrics.recordRequest(request.method, request.route?.path ?? request.path ?? "unknown", response.statusCode);
    }
}
