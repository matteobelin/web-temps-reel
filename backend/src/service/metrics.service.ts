import { Injectable } from "@nestjs/common";

@Injectable()
export class MetricsService {
    private readonly requests = new Map<string, number>();

    recordRequest(method: string, route: string, status: number) {
        const key = `${method}|${normalizeRoute(route)}|${status}`;
        this.requests.set(key, (this.requests.get(key) ?? 0) + 1);
    }

    snapshot() {
        return [...this.requests.entries()].map(([key, count]) => {
            const [method, route, status] = key.split("|");
            return { method, route, status: Number(status), count };
        });
    }

    prometheus() {
        const lines = [
            "# HELP http_requests_total Total HTTP requests handled by status.",
            "# TYPE http_requests_total counter",
            ...this.snapshot().map(({ method, route, status, count }) =>
                `http_requests_total{method="${escapeLabel(method)}",route="${escapeLabel(route)}",status="${status}"} ${count}`),
        ];
        return `${lines.join("\n")}\n`;
    }
}

function normalizeRoute(route: string) {
    return route
        .replace(/\/\d+(?=\/|$)/g, "/:id")
        .replace(/\/[a-f0-9-]{16,}(?=\/|$)/gi, "/:id");
}

function escapeLabel(value: string) {
    return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n");
}
