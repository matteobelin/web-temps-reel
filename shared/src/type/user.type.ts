import {Role} from "../enums/role.enum.js";

export type SafeUser = {
    id: number;
    name: string;
    role: Role;
    restaurant: number;
};