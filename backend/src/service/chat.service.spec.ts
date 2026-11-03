import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../prisma/prisma.service.js";
import { ChatService } from "./chat.service.js";

describe("ChatService", () => {
    it("creates a message and maps its author", async () => {
        const createdAt = new Date("2026-01-01T12:00:00.000Z");
        const prisma = {
            user: {
                findFirst: vi.fn().mockResolvedValue({ id: 8 }),
            },
            message: {
                create: vi.fn().mockResolvedValue({
                    id: 3,
                    content: "Bonjour",
                    createdAt,
                    author: { name: "Alice", matricule: "A001" },
                }),
            },
        } as unknown as PrismaService;
        const service = new ChatService(prisma);

        await expect(service.create("Bonjour", "A001", "PARIS")).resolves.toEqual({
            id: 3,
            content: "Bonjour",
            createdAt,
            authorName: "Alice",
            authorMatricule: "A001",
        });
        expect(prisma.message.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                content: "Bonjour",
                author: { connect: { id: 8 } },
                restaurant: { connect: { code: "PARIS" } },
            }),
        }));
    });

    it("rejects messages from unknown users", async () => {
        const prisma = {
            user: { findFirst: vi.fn().mockResolvedValue(null) },
            message: { create: vi.fn() },
        } as unknown as PrismaService;
        const service = new ChatService(prisma);

        await expect(service.create("Bonjour", "UNKNOWN", "PARIS")).rejects.toBeInstanceOf(
            NotFoundException,
        );
        expect(prisma.message.create).not.toHaveBeenCalled();
    });

    it("returns history in chronological order", async () => {
        const first = {
            id: 1,
            content: "Premier",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
            author: { name: "Alice", matricule: "A001" },
        };
        const second = {
            id: 2,
            content: "Second",
            createdAt: new Date("2026-01-01T11:00:00.000Z"),
            author: { name: "Bob", matricule: "B002" },
        };
        const prisma = {
            message: {
                findMany: vi.fn().mockResolvedValue([second, first]),
            },
        } as unknown as PrismaService;
        const service = new ChatService(prisma);

        await expect(service.history("PARIS", 10, 2)).resolves.toEqual([
            expect.objectContaining({ id: 1, content: "Premier" }),
            expect.objectContaining({ id: 2, content: "Second" }),
        ]);
        expect(prisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { restaurant: { code: "PARIS" }, id: { lt: 10 } },
            orderBy: { id: "desc" },
            take: 2,
        }));
    });
});
