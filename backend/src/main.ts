import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import express from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("v1");
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:4200')
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      const localOrigin = origin && /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin);
      if (!origin || allowedOrigins.includes(origin) || localOrigin) {
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
