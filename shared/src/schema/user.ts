import { z } from "zod";
import { Role } from "../enums/role.enum.js";

const matricule = z.string().trim().min(1).max(50);
const password = z.string().min(8);
const restaurantCode = z.string().trim().toUpperCase().min(1).max(20);
const name = z.string().trim().min(2).max(100);
const role = z.enum(Role);


export const UserInput = z.object({
    matricule,
    password,
    restaurantCode,
});

export const UserInputRegistration = UserInput.extend({
    role,
    name,
});

export const UserOutput = z.object({
    id: z.number().int().positive(),
    matricule,
    name,
    role,
    restaurantCode,
    restaurantName: z.string().min(1),
});

export type UserInputType = z.infer<typeof UserInput>;
export type UserInputRegistrationType = z.infer<typeof UserInputRegistration>;
export type UserOutputType = z.infer<typeof UserOutput>;