import {Body, Controller, Post, Res, UseGuards} from "@nestjs/common";
import { User, BaseUser } from "shared";
import {AuthService} from "../service/auth.service.js";
import express from "express";
import {JwtAuthGuard} from "../guard/jwt-auth.guard.js";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

    @Post("register")
    async register(@Body() dto: any, @Res({passthrough: true}) res: express.Response) {
        const user = User.parse(dto);
        const { access_token } = await this.authService.register(user);
        res.cookie("access_token", access_token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
        });
        return { message: "Registration successful" };
    }

    @Post("login")
    async login(@Body() dto: any, @Res({passthrough: true}) res: express.Response) {
        const user = BaseUser.parse(dto);
        const { access_token } = await this.authService.login(user);
        res.cookie("access_token", access_token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
        });
        return { message: "Login successful" };
    }

    @UseGuards(JwtAuthGuard)
    @Post("logout")
    logout(@Res({ passthrough: true }) res: express.Response) {
        res.clearCookie("access_token", {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
        });
        return { message: "Logout successful" };
    }
}