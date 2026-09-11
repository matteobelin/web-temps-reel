import { Module } from '@nestjs/common';
import {OrderModule} from "./module/order.module.js";
import {AuthModule} from "./module/auth.module.js";

@Module({
  imports: [OrderModule, AuthModule],
})
export class AppModule {}
