import { describe, expect, it, vi } from "vitest";
import type { UserInputRegistrationType, UserInputType, UserOutputType } from "shared";
import { AuthService } from "./auth.service.js";
import type { UserService } from "./user.service.js";
import type { JwtService } from "@nestjs/jwt";

describe("AuthService", () => {
    const registeredUser: UserOutputType = {
        id: 1,
        matricule: "A001",
        name: "Alice",
        role: "WAITER",
        restaurantCode: "PARIS",
        restaurantName: "Paris",
    };

    it("registers the user and returns an access token", async () => {
        const userService = {
            register: vi.fn().mockResolvedValue(registeredUser),
        } as unknown as UserService;
        const jwtService = {
            signAsync: vi.fn().mockResolvedValue("register-token"),
        } as unknown as JwtService;
        const service = new AuthService(userService, jwtService);
        const input = {
            name: "Alice",
            matricule: "A001",
            password: "password",
            role: "WAITER",
            restaurantCode: "PARIS",
        } as UserInputRegistrationType;

        await expect(service.register(input)).resolves.toEqual({
            access_token: "register-token",
            userRegister: registeredUser,
        });
        expect(userService.register).toHaveBeenCalledWith(input);
        expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 1 });
    });

    it("logs in the user and signs a token with the user id", async () => {
        const userService = {
            login: vi.fn().mockResolvedValue(registeredUser),
        } as unknown as UserService;
        const jwtService = {
            signAsync: vi.fn().mockResolvedValue("login-token"),
        } as unknown as JwtService;
        const service = new AuthService(userService, jwtService);
        const input = {
            matricule: "A001",
            password: "password",
            restaurantCode: "PARIS",
        } as UserInputType;

        await expect(service.login(input)).resolves.toEqual({
            access_token: "login-token",
            userLogin: registeredUser,
        });
        expect(userService.login).toHaveBeenCalledWith(input);
    });
});
