import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import type { Socket } from "socket.io";

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const client = context.switchToWs().getClient<Socket>();
        if (!client.data.user) {
            throw new WsException("Unauthorized");
        }
        return true;
    }
}