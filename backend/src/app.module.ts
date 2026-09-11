import { Module } from '@nestjs/common';
import {OrderModule} from "./module/order.module.js";

@Module({
  imports: [OrderModule],
})
export class AppModule {}
