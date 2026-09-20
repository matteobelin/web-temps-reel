import type { JwtService } from "@nestjs/jwt";
import type { Socket } from "socket.io";
import { parseCookie } from "cookie";

import {ACCESS_TOKEN_COOKIE} from "../common/constants.js";
import {JwtPayload, toAuthUser} from "../common/strategy/jwt.strategy.js";

export const wsAuthMiddleware = (jwt: JwtService) =>
    async (socket: Socket, next: (err?: Error) => void) => {
        try {
            const token = parseCookie(socket.handshake.headers.cookie ?? "")[ACCESS_TOKEN_COOKIE];
            if (!token) return next(new Error("Unauthorized"));

            const payload = await jwt.verifyAsync<JwtPayload>(token);
            socket.data.user = toAuthUser(payload);
            next();
        } catch {
            next(new Error("Unauthorized"));
        }
    };