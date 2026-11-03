import { ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "shared";
import * as bcrypt from "bcrypt";
import { Prisma } from "../../generated/prisma/client.js";
import { UserService } from "./user.service.js";

vi.mock("bcrypt", () => ({
    hash: vi.fn(),
    compare: vi.fn(),
}));

describe("UserService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("registers a user with a hashed password", async () => {
        vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password");

        const prisma = {
            restaurant: {
                findUnique: vi.fn().mockResolvedValue({ id: 1, code: "PARIS", name: "Paris" }),
            },
            user: {
                create: vi.fn().mockResolvedValue({
                    id: 42,
                    matricule: "A001",
                    name: "Alice",
                    role: Role.WAITER,
                }),
            },
        };

        const service = new UserService(prisma as any);

        await expect(service.register({
            name: " Alice ",
            matricule: " A001 ",
            password: "password123",
            role: Role.WAITER,
            restaurantCode: " paris ",
        })).resolves.toEqual({
            id: 42,
            matricule: "A001",
            name: "Alice",
            role: Role.WAITER,
            restaurantCode: "PARIS",
            restaurantName: "Paris",
        });

        expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
            where: { code: "PARIS" },
        });
        expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    });

    it("throws when the restaurant does not exist", async () => {
        const prisma = {
            restaurant: { findUnique: vi.fn().mockResolvedValue(null) },
        };

        const service = new UserService(prisma as any);

        await expect(service.register({
            name: "Alice",
            matricule: "A001",
            password: "password123",
            role: Role.WAITER,
            restaurantCode: "PARIS",
        })).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws a conflict when the matricule already exists", async () => {
        vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password");

        const prisma = {
            restaurant: {
                findUnique: vi.fn().mockResolvedValue({ id: 1, code: "PARIS", name: "Paris" }),
            },
            user: {
                create: vi.fn().mockRejectedValue(
                    new Prisma.PrismaClientKnownRequestError("duplicate", {
                        code: "P2002",
                        clientVersion: "test",
                    } as any),
                ),
            },
        };

        const service = new UserService(prisma as any);

        await expect(service.register({
            name: "Alice",
            matricule: "A001",
            password: "password123",
            role: Role.WAITER,
            restaurantCode: "PARIS",
        })).rejects.toBeInstanceOf(ConflictException);
    });

    it("logs in a valid user and maps the restaurant info", async () => {
        vi.mocked(bcrypt.compare).mockResolvedValue(true);

        const prisma = {
            user: {
                findFirst: vi.fn().mockResolvedValue({
                    id: 7,
                    matricule: "A777",
                    name: "Bob",
                    role: Role.COOK,
                    password: "hashed-password",
                    restaurant: { code: "PARIS", name: "Paris" },
                }),
            },
        };

        const service = new UserService(prisma as any);

        await expect(service.login({
            matricule: " A777 ",
            password: "password123",
            restaurantCode: " paris ",
        })).resolves.toEqual({
            id: 7,
            matricule: "A777",
            name: "Bob",
            role: Role.COOK,
            restaurantCode: "PARIS",
            restaurantName: "Paris",
        });

        expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashed-password");
    });

    it("rejects invalid credentials", async () => {
        vi.mocked(bcrypt.compare).mockResolvedValue(false);

        const prisma = {
            user: {
                findFirst: vi.fn().mockResolvedValue(null),
            },
        };

        const service = new UserService(prisma as any);

        await expect(service.login({
            matricule: "A777",
            password: "wrong",
            restaurantCode: "PARIS",
        })).rejects.toBeInstanceOf(UnauthorizedException);
    });
});
