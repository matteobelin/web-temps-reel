import { ForbiddenException, Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { configuredOrigins } from "../security/origin.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function originOf(request: Request): string | undefined {
    const forwardedProto = request.header("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = forwardedProto || request.protocol;
    return `${protocol}://${request.get("host")}`;
}

function isAllowedOrigin(request: Request, origin: string): boolean {
    const sameOrigin = originOf(request);
    const localDevelopment = /^(https?:\/\/)(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin);

    return configuredOrigins().includes(origin) || origin === sameOrigin || localDevelopment;
}

/**
 * Cookie-authenticated mutating requests must come from an allowed browser
 * origin. Requests without an Origin header are retained for non-browser
 * clients (and same-origin server-to-server calls).
 */
@Injectable()
export class CsrfOriginMiddleware implements NestMiddleware {
    use(request: Request, _response: Response, next: NextFunction) {
        if (MUTATING_METHODS.has(request.method)) {
            const origin = request.header("origin");
            if (origin && (origin === "null" || !isAllowedOrigin(request, origin))) {
                throw new ForbiddenException("Invalid request origin");
            }
        }
        next();
    }
}
