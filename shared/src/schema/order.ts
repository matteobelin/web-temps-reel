import {z} from "zod";


const Meal = z.object({
    status: z.enum(["VALIDATION", "IN_PROGRESS", "READY", "SERVED", "CANCELED"]),
    date: z.coerce.date(),
    quantity: z.number().int().positive().min(0),
    price: z.number().positive(),
    comment: z.string()
});

export const OrderSchema = z.object({
    meals: z.array(Meal),
    table: z.number().int().positive().min(0),
    waiter: z.string().nonempty()
});

export type Order = z.infer<typeof OrderSchema>;


