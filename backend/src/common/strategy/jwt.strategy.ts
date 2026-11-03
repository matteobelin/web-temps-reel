import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import type { Request } from "express";
import type { Role } from "shared";
import { parseCookie } from "cookie";
import { ACCESS_TOKEN_COOKIE } from "../constants.js";
import { PrismaService } from "../../../prisma/prisma.service.js";

export type JwtPayload = {
    sub: number;
};

export const toAuthUser = (user: {
    id: number;
    matricule: string;
    name: string;
    role: Role;
    restaurant: { code: string; name: string };
}) => ({
    id: user.id,
    matricule: user.matricule,
    name: user.name,
    role: user.role,
    restaurantCode: user.restaurant.code,
    restaurantName: user.restaurant.name,
});

export type AuthUser = ReturnType<typeof toAuthUser>;

function cookieExtractor(req: Request): string | null {
    return parseCookie(req.headers.cookie ?? "")[ACCESS_TOKEN_COOKIE] ?? null;
}


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly prisma: PrismaService) {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret || jwtSecret.length < 32) {
            throw new Error("JWT_SECRET must be at least 32 characters");
        }

        super({
            jwtFromRequest: cookieExtractor,
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
        });
    }

    async validate(payload: JwtPayload): Promise<AuthUser> {
        if (!Number.isInteger(payload.sub) || payload.sub <= 0) {
            throw new UnauthorizedException("Invalid token");
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                matricule: true,
                name: true,
                role: true,
                restaurant: { select: { code: true, name: true } },
            },
        });
        if (!user) {
            throw new UnauthorizedException("Invalid token");
        }
        return toAuthUser(user);
    }
}