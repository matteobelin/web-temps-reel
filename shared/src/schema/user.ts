import { z } from "zod";
import { Role } from "../enums/role.enum.js";

const matricule = z.string().min(1);
const password = z.string().min(8);
const restaurantCode = z.string().min(1);
const name = z.string().min(1);
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
    matricule,
    name,
    role,
    restaurantCode,
    restaurantName: z.string().min(1),
});

export type UserInputType = z.infer<typeof UserInput>;
export type UserInputRegistrationType = z.infer<typeof UserInputRegistration>;
export type UserOutputType = z.infer<typeof UserOutput>;