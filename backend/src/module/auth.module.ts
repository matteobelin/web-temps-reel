// auth/auth.module.ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "../service/auth.service.js";
import { UserModule } from "./user.module.js";
import { JwtStrategy } from "../strategy/jwt.stategy.js";
import { StringValue } from "ms";

@Module({
    imports: [
        UserModule,
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: (process.env.JWT_EXPIRES_IN ?? "1d") as StringValue
            },
        }),
    ],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {}