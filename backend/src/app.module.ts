import { Module } from '@nestjs/common';
import {OrderModule} from "./module/order.module.js";
import {AuthModule} from "./module/auth.module.js";
import {ChatModule} from "./module/chat.module.js";
import {PrismaModule} from "../prisma/prisma.module.js";

@Module({
  imports: [PrismaModule, OrderModule, AuthModule, ChatModule],
})
export class AppModule {}
