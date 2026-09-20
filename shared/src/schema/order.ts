import { z } from "zod";
import { MealStatus } from "../enums/mealStatus.enum.js";

const MealFields = z.object({
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    comment: z.string().trim().optional(),
});

export const MealInput = MealFields;

export const MealOutput = MealFields.extend({
    status: z.enum(MealStatus),
    createdAt: z.coerce.date(),
});

export const OrderSchemaInput = z.object({
    meals: z.array(MealInput).min(1),
    table: z.number().int().positive(),
});

export const OrderSchemaOutput = z.object({
    id: z.number().int().positive(),
    table: z.number().int().positive(),
    waiterName: z.string().min(1),
    waiterMatricule: z.string().min(1),
    meals: z.array(MealOutput),
});

export type OrderInputType = z.infer<typeof OrderSchemaInput>;
export type OrderOutputType = z.infer<typeof OrderSchemaOutput>;