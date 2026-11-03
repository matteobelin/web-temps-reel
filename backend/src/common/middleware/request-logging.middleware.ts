import { Injectable, type NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const REQUEST_ID = "x-request-id";

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
    use(request: Request, response: Response, next: NextFunction) {
        const supplied = request.header(REQUEST_ID);
        const requestId = supplied && /^[A-Za-z0-9._:-]{1,128}$/.test(supplied)
            ? supplied
            : randomUUID();

        request.headers[REQUEST_ID] = requestId;
        response.setHeader(REQUEST_ID, requestId);
        const startedAt = Date.now();

        response.on("finish", () => {
            console.log(JSON.stringify({
                level: "info",
                event: "http.request",
                requestId,
                method: request.method,
                path: request.route?.path ?? request.path,
                status: response.statusCode,
                durationMs: Date.now() - startedAt,
                ip: request.ip,
            }));
        });
        next();
    }
}

export { REQUEST_ID };
