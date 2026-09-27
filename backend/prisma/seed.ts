import { PrismaService } from "./prisma.service.js";

const required = (name: string, fallback?: string) => {
    const value = process.env[name] ?? fallback;
    if (!value) {
        throw new Error(`Missing required seed variable: ${name}`);
    }
    return value;
};

const prisma = new PrismaService();

try {
    await prisma.$connect();

    const restaurant = await prisma.restaurant.upsert({
        where: { code: required("SEED_RESTAURANT_CODE", "DEMO") },
        update: { name: required("SEED_RESTAURANT_NAME", "Restaurant de demonstration") },
        create: {
            name: required("SEED_RESTAURANT_NAME", "Restaurant de demonstration"),
            code: required("SEED_RESTAURANT_CODE", "DEMO"),
        },
    });

    console.log(`Database initialized for restaurant ${restaurant.code}; no user account was created.`);
} finally {
    await prisma.$disconnect();
}
