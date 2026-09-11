import { Injectable } from "@nestjs/common";
import { Order } from "shared";
import {PrismaService} from "../../prisma/prisma.service.js";

@Injectable()
export class OrderService {
    constructor(private readonly prisma: PrismaService){}

    async findAll(): Promise<Order[]> {
        return this.prisma.order.findMany({
            include: {
                meals: true
            }
        });
    }
}