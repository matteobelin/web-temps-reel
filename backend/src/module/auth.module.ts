// auth/auth.module.ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "../service/auth.service.js";
import { UserModule } from "./user.module.js";
import { JwtStrategy } from "../common/strategy/jwt.strategy.js";
import { StringValue } from "ms";
import { AuthController } from "../controller/auth.js";
import { RateLimitGuard } from "../common/guard/rate-limit.guard.js";

@Module({
    imports: [
        UserModule,
        PassportModule.register({}),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: (process.env.JWT_EXPIRES_IN ?? "1d") as StringValue
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, RateLimitGuard],
    exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}