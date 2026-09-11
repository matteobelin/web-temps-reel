export const Role = {
    MANAGER: "MANAGER",
    WAITER: "WAITER",
    COOK: "COOK",
} as const;

export type Role = typeof Role[keyof typeof Role];