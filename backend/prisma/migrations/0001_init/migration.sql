CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Role" AS ENUM ('MANAGER', 'WAITER', 'COOK');
CREATE TYPE "MealStatus" AS ENUM ('VALIDATION', 'IN_PROGRESS', 'READY', 'SERVED', 'CANCELED');

CREATE TABLE "Restaurant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "role" "Role" NOT NULL,
    "name" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "tableNumber" INTEGER NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "waiterId" INTEGER NOT NULL,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Meal" (
    "id" SERIAL NOT NULL,
    "status" "MealStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "orderId" INTEGER NOT NULL,
    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restaurantId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Restaurant_code_key" ON "Restaurant"("code");
CREATE UNIQUE INDEX "User_matricule_restaurantId_key" ON "User"("matricule", "restaurantId");
CREATE INDEX "Message_restaurantId_id_idx" ON "Message"("restaurantId", "id");

ALTER TABLE "User" ADD CONSTRAINT "User_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_waiterId_fkey"
  FOREIGN KEY ("waiterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
