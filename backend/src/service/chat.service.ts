import {Injectable, NotFoundException} from "@nestjs/common";
import type { ChatMessageOutputType } from "shared";
import { PrismaService } from "../../prisma/prisma.service.js";

const authorSelect = { select: { name: true, matricule: true } } as const;

@Injectable()
export class ChatService {
    constructor(private readonly prisma: PrismaService) {}

    async create(content: string, matricule: string, restaurantCode: string): Promise<ChatMessageOutputType> {
        const author = await this.prisma.user.findFirst({
            where: { matricule, restaurant: { code: restaurantCode } },
            select: { id: true },
        });
        if (!author) {
            throw new NotFoundException("User not found");
        }

        const message = await this.prisma.message.create({
            data: {
                content,
                author: { connect: { id: author.id } },
                restaurant: { connect: { code: restaurantCode } },
            },
            include: { author: { select: { name: true, matricule: true } } },
        });
        return this.map(message);
    }

    async history(restaurantCode: string, before?: number, limit = 50): Promise<ChatMessageOutputType[]> {
        const messages = await this.prisma.message.findMany({
            where: {
                restaurant: { code: restaurantCode },
                ...(before && { id: { lt: before } }),
            },
            orderBy: { id: "desc" },
            take: limit,
            include: { author: authorSelect },
        });
        return messages.reverse().map((m) => this.map(m));
    }

    private map(m: {
        id: number;
        content: string;
        createdAt: Date;
        author: { name: string; matricule: string };
    }): ChatMessageOutputType {
        return {
            id: m.id,
            content: m.content,
            createdAt: m.createdAt,
            authorName: m.author.name,
            authorMatricule: m.author.matricule,
        };
    }
}