import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ZodValidationPipe } from "./zod-validation.pipe.js";

describe("ZodValidationPipe", () => {
    const schema = z.object({
        name: z.string().min(1),
        quantity: z.number().int().positive(),
    });

    it("returns parsed data for a valid value", () => {
        const pipe = new ZodValidationPipe(schema);

        expect(pipe.transform({ name: "Pizza", quantity: 2 })).toEqual({
            name: "Pizza",
            quantity: 2,
        });
    });

    it("throws a bad request exception for an invalid value", () => {
        const pipe = new ZodValidationPipe(schema);

        expect(() => pipe.transform({ name: "", quantity: 0 })).toThrow(BadRequestException);
    });
});
