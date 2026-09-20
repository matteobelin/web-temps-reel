import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guard/jwt-auth.guard.js";
import { CurrentUser } from "../common/decorator/currentUser.decorator.js";
import type { AuthUser } from "../common/strategy/jwt.strategy.js";
import { ChatService } from "../service/chat.service.js";
import { z } from "zod";
import { ZodQuery } from "../common/decorator/zod.decorator.js";

const HistoryQuery = z.object({
    before: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
});
type HistoryQueryType = z.infer<typeof HistoryQuery>;

@UseGuards(JwtAuthGuard)
@Controller("chat")
export class ChatController {
    constructor(private readonly chat: ChatService) {}

    @Get("messages")
    history(
        @ZodQuery(HistoryQuery) query: HistoryQueryType,
        @CurrentUser() user: AuthUser,
    ) {
        return this.chat.history(user.restaurantCode, query.before, query.limit);
    }
}