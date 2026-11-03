import type { JwtService } from "@nestjs/jwt";
import type { Socket } from "socket.io";
import { parseCookie } from "cookie";

import {ACCESS_TOKEN_COOKIE} from "../common/constants.js";
import {JwtPayload, toAuthUser} from "../common/strategy/jwt.strategy.js";
import { PrismaService } from "../../prisma/prisma.service.js";

export const wsAuthMiddleware = (jwt: JwtService, prisma: PrismaService) =>
    async (socket: Socket, next: (err?: Error) => void) => {
        try {
            const token = parseCookie(socket.handshake.headers.cookie ?? "")[ACCESS_TOKEN_COOKIE];
            if (!token) return next(new Error("Unauthorized"));

            const payload = await jwt.verifyAsync<JwtPayload>(token);
            if (!Number.isInteger(payload.sub) || payload.sub <= 0) {
                return next(new Error("Unauthorized"));
            }
            const user = await prisma.user.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    matricule: true,
                    name: true,
                    role: true,
                    restaurant: { select: { code: true, name: true } },
                },
            });
            if (!user) return next(new Error("Unauthorized"));
            socket.data.user = toAuthUser(user);
            next();
        } catch {
            next(new Error("Unauthorized"));
        }
    };