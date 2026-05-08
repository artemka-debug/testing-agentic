import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './../src/app.module';

describe('API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    const swagger = new DocumentBuilder()
      .setTitle('e2e')
      .setVersion('1')
      .build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('api', app, document);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health — database reachable', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      database: 'connected',
    });
  });

  it('GET /api-json — OpenAPI available', async () => {
    await request(app.getHttpServer()).get('/api-json').expect(200);
  });
});
