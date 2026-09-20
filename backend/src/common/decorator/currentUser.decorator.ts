import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        if (ctx.getType() === "ws") {
            return ctx.switchToWs().getClient().data.user;
        }
        return ctx.switchToHttp().getRequest().user;
    },
);