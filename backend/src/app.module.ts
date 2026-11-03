import { APP_INTERCEPTOR } from "@nestjs/core";
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import {OrderModule} from "./module/order.module.js";
import {AuthModule} from "./module/auth.module.js";
import {ChatModule} from "./module/chat.module.js";
import {PrismaModule} from "../prisma/prisma.module.js";
import { HealthController } from "./controller/health.js";
import { MetricsController } from "./controller/metrics.js";
import { MetricsService } from "./service/metrics.service.js";
import { MetricsInterceptor } from "./common/interceptor/metrics.interceptor.js";
import { CsrfOriginMiddleware } from "./common/middleware/csrf-origin.middleware.js";
import { RequestLoggingMiddleware } from "./common/middleware/request-logging.middleware.js";
import { RedisModule } from "./module/redis.module.js";

@Module({
  imports: [PrismaModule, RedisModule, OrderModule, AuthModule, ChatModule],
  controllers: [HealthController, MetricsController],
  providers: [
    MetricsService,
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
  exports: [MetricsService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggingMiddleware, CsrfOriginMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
