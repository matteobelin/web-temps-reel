CREATE INDEX "Order_restaurantId_id_idx" ON "Order"("restaurantId", "id");
CREATE INDEX "Meal_orderId_status_idx" ON "Meal"("orderId", "status");
