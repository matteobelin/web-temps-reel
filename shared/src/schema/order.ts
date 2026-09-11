import {z} from "zod";
import {MealStatus} from "../enums/mealStatus.enum.js";


const Meal = z.object({
    status: z.enum(Object.values(MealStatus) as [string, ...string[]]),
    date: z.coerce.date(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    comment: z.string()
});

export const OrderSchema = z.object({
    meals: z.array(Meal),
    table: z.number().int().positive(),
    waiter: z.string().nonempty(),
    restaurant: z.string().nonempty(),
});

export type Order = z.infer<typeof OrderSchema>;


