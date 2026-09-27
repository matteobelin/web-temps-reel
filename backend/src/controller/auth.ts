import {Controller, Post, Res, UseGuards} from "@nestjs/common";
import {UserInput, UserInputRegistration, type UserInputRegistrationType, type UserInputType} from "shared";
import {AuthService} from "../service/auth.service.js";
import express, {CookieOptions} from "express";
import {JwtAuthGuard} from "../common/guard/jwt-auth.guard.js";
import {ZodBody} from "../common/decorator/zod.decorator.js";
import {ACCESS_TOKEN_COOKIE} from "../common/constants.js";

const secureCookies = process.env.COOKIE_SECURE === "true"
    || (process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production");

const CLEAR_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "strict",
};

const COOKIE_OPTIONS: CookieOptions = {
    ...CLEAR_COOKIE_OPTIONS,
    maxAge: 24 * 60 * 60 * 1000,
};

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

    @Post("register")
    async register(@ZodBody(UserInputRegistration) userDto: UserInputRegistrationType, @Res({passthrough: true}) res: express.Response) {
        const { access_token, userRegister } = await this.authService.register(userDto);
        res.cookie(ACCESS_TOKEN_COOKIE, access_token, COOKIE_OPTIONS);
        return userRegister;
    }

    @Post("login")
    async login(@ZodBody(UserInput) userDto: UserInputType, @Res({passthrough: true}) res: express.Response) {
        const { access_token, userLogin } = await this.authService.login(userDto);
        res.cookie(ACCESS_TOKEN_COOKIE, access_token, COOKIE_OPTIONS);
        return userLogin;
    }

    @UseGuards(JwtAuthGuard)
    @Post("logout")
    logout(@Res({ passthrough: true }) res: express.Response) {
        res.clearCookie(ACCESS_TOKEN_COOKIE, CLEAR_COOKIE_OPTIONS);
        return { message: "Logout successful" };
    }
}