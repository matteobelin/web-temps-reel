import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import express from 'express';
import { AppModule } from './app.module.js';
import { isAllowedFrontendOrigin } from './common/security/origin.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("v1");
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (isAllowedFrontendOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origin is not allowed"));
      }
    },
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
