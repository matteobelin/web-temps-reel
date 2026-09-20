import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { WsException } from "@nestjs/websockets";
import { parseCookie } from "cookie";
import type { Socket } from "socket.io";

@Injectable()
export class WsJwtAuthGuard extends AuthGuard("jwt") {
    getRequest(context: ExecutionContext) {
        const client = context.switchToWs().getClient<Socket>();
        const req = client.handshake as any;
        req.cookies ??= parseCookie(req.headers.cookie ?? "");
        return req;
    }

    handleRequest(err: unknown, user: any, _info: unknown, context: ExecutionContext) {
        if (err || !user) throw new WsException("Unauthorized");
        context.switchToWs().getClient<Socket>().data.user = user;
        return user;
    }
}