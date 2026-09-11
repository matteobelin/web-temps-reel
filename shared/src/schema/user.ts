import {z} from "zod";

export const BaseUser = z.object({
    name: z.string().nonempty(),
    password: z.string().min(8)
});

export const User = BaseUser.extend({
    role: z.enum(["MANAGER", "WAITER", "COOK"]),
});

export type BaseUserType = z.infer<typeof BaseUser>;
export type UserType = z.infer<typeof User>;