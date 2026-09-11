export const MealStatus = {
    VALIDATION: "VALIDATION",
    IN_PROGRESS: "IN_PROGRESS",
    READY: "READY",
    SERVED: "SERVED",
    CANCELED: "CANCELED",
} as const;

export type MealStatus = typeof MealStatus[keyof typeof MealStatus];