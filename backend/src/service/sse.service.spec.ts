import { describe, expect, it } from "vitest";
import { Role, type OrderOutputType } from "shared";
import { SseService } from "./sse.service.js";

describe("SseService", () => {
    it("emits events to the subscribed role channel", () => {
        const service = new SseService();
        const payload: OrderOutputType = {
            id: 3,
            table: 12,
            waiterName: "Alice",
            waiterMatricule: "A001",
            meals: [{
                status: "READY",
                createdAt: new Date("2026-01-01T12:00:00.000Z"),
                name: "Pizza",
                quantity: 2,
                price: 15,
                comment: "extra cheese",
            }],
        };

        const received: OrderOutputType[] = [];
        const subscription = service.stream(Role.WAITER, "PARIS").subscribe({
            next: (value) => {
                if ("data" in value) {
                    received.push(value.data);
                }
            },
        });

        service.emit(Role.WAITER, "PARIS", payload);

        expect(received).toEqual([payload]);
        subscription.unsubscribe();
    });

    it("broadcasts the same payload to multiple roles", () => {
        const service = new SseService();
        const payload: OrderOutputType = {
            id: 4,
            table: 7,
            waiterName: "Bob",
            waiterMatricule: "B002",
            meals: [{
                status: "IN_PROGRESS",
                createdAt: new Date("2026-01-01T13:00:00.000Z"),
                name: "Burger",
                quantity: 1,
                price: 10,
            }],
        };

        const cookReceived: OrderOutputType[] = [];
        const managerReceived: OrderOutputType[] = [];

        const cookSub = service.stream(Role.COOK, "PARIS").subscribe({
            next: (value) => {
                if ("data" in value) {
                    cookReceived.push(value.data);
                }
            },
        });
        const managerSub = service.stream(Role.MANAGER, "PARIS").subscribe({
            next: (value) => {
                if ("data" in value) {
                    managerReceived.push(value.data);
                }
            },
        });

        service.emitMany([Role.COOK, Role.MANAGER], "PARIS", payload);

        expect(cookReceived).toEqual([payload]);
        expect(managerReceived).toEqual([payload]);

        cookSub.unsubscribe();
        managerSub.unsubscribe();
    });
});
