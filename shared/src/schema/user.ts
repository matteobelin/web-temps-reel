import {z} from "zod";
import {Role} from "../enums/role.enum.js";

export const BaseUser = z.object({
    name: z.string().nonempty(),
    password: z.string().min(8),
    restaurant: z.string().nonempty()
});

export const User = BaseUser.extend({
    role: z.enum(Object.values(Role) as [string, ...string[]]),
});

export type BaseUserType = z.infer<typeof BaseUser>;
export type UserType = z.infer<typeof User>;