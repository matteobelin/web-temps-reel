import {Controller, Sse, UseGuards} from "@nestjs/common";
import { SseService } from "../service/sse.service.js";
import {JwtAuthGuard} from "../common/guard/jwt-auth.guard.js";
import {RolesGuard} from "../common/guard/role.guard.js";
import {Roles} from "../common/decorator/roles.decorator.js";
import {Role} from "shared";
import {CurrentUser} from "../common/decorator/currentUser.decorator.js";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("events")
@Roles(Role.WAITER, Role.COOK, Role.MANAGER)
export class SseController {
    constructor(private readonly sseService: SseService) {}

    @Sse()
    stream(@CurrentUser() user: { role: Role, restaurantCode: string }) {
        return this.sseService.stream(user.role, user.restaurantCode);
    }
}