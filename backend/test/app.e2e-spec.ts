import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

process.env.JWT_SECRET ??= 'e2e-test-secret';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('rejects unauthenticated access to orders', () => {
    return request(app.getHttpServer())
      .get('/orders')
      .expect(401);
  });

  it('rejects unauthenticated chat history access', () => {
    return request(app.getHttpServer())
      .get('/chat/messages')
      .expect(401);
  });

  it('rejects an invalid login payload', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        matricule: '',
        password: 'short',
        restaurantCode: '',
      })
      .expect(400);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
