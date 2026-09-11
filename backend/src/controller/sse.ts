import {Controller, Sse, UseGuards} from "@nestjs/common";
import { SseService } from "../service/sse.service.js";
import {JwtAuthGuard} from "../guard/jwt-auth.guard.js";
import {RolesGuard} from "../guard/role.guard.js";
import {Roles} from "../decorator/roles.decorator.js";
import {Role} from "shared";
import {CurrentUser} from "../decorator/currentUser.decorator.js";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("events")
@Roles(Role.WAITER, Role.COOK, Role.MANAGER)
export class SseController {
    constructor(private readonly sseService: SseService) {}

    @Sse()
    stream(@CurrentUser() user: { role: Role }) {
        return this.sseService.stream(user.role);
    }
}