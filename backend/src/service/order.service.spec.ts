import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { MealStatus, Role } from "shared";
import type { PrismaService } from "../../prisma/prisma.service.js";
import { OrderService } from "./order.service.js";
import type { SseService } from "./sse.service.js";

const order = {
    id: 12,
    tableNumber: 4,
    waiter: { name: "Alice", matricule: "A001" },
    meals: [
        {
            status: MealStatus.IN_PROGRESS,
            createdAt: new Date("2026-01-01T12:00:00.000Z"),
            quantity: 2,
            price: 12.5,
            name: "Pizza",
            comment: null,
        },
    ],
};

describe("OrderService", () => {
    it("rejects an unknown role before querying the order", async () => {
        const prisma = { order: { findFirst: vi.fn() } } as unknown as PrismaService;
        const sseService = { emitMany: vi.fn() } as unknown as SseService;
        const service = new OrderService(prisma, sseService);

        await expect(service.advanceStatus(12, "UNKNOWN" as Role, "PARIS")).rejects.toBeInstanceOf(
            ForbiddenException,
        );
        expect(prisma.order.findFirst).not.toHaveBeenCalled();
    });

    it("advances meals and notifies the next roles", async () => {
        const updatedOrder = {
            ...order,
            meals: [{ ...order.meals[0], status: MealStatus.READY }],
        };
        const tx = {
            meal: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
            order: { findUniqueOrThrow: vi.fn().mockResolvedValue(updatedOrder) },
        };
        const prisma = {
            order: { findFirst: vi.fn().mockResolvedValue({ id: 12 }) },
            $transaction: vi.fn((callback: (transaction: typeof tx) => unknown) => callback(tx)),
        } as unknown as PrismaService;
        const sseService = { emitMany: vi.fn() } as unknown as SseService;
        const service = new OrderService(prisma, sseService);

        await expect(service.advanceStatus(12, Role.COOK, "PARIS")).resolves.toMatchObject({
            id: 12,
            table: 4,
            meals: [{ status: MealStatus.READY, price: 12.5 }],
        });
        expect(tx.meal.updateMany).toHaveBeenCalledWith({
            where: { orderId: 12, status: MealStatus.IN_PROGRESS },
            data: { status: MealStatus.READY },
        });
        expect(sseService.emitMany).toHaveBeenCalledWith(
            [Role.WAITER, Role.MANAGER],
            "PARIS",
            expect.objectContaining({ id: 12 }),
        );
    });

    it("reports a missing order", async () => {
        const prisma = {
            order: { findFirst: vi.fn().mockResolvedValue(null) },
        } as unknown as PrismaService;
        const service = new OrderService(prisma, { emitMany: vi.fn() } as unknown as SseService);

        await expect(service.advanceStatus(99, Role.MANAGER, "PARIS")).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it("reports when no meal can be advanced", async () => {
        const tx = {
            meal: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
            order: { findUniqueOrThrow: vi.fn() },
        };
        const prisma = {
            order: { findFirst: vi.fn().mockResolvedValue({ id: 12 }) },
            $transaction: vi.fn((callback: (transaction: typeof tx) => unknown) => callback(tx)),
        } as unknown as PrismaService;
        const service = new OrderService(prisma, { emitMany: vi.fn() } as unknown as SseService);

        await expect(service.advanceStatus(12, Role.COOK, "PARIS")).rejects.toBeInstanceOf(
            ConflictException,
        );
        expect(tx.order.findUniqueOrThrow).not.toHaveBeenCalled();
    });
});
