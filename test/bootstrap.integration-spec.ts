import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { applyHttpGlobals, setupSwaggerIfDev } from '../src/bootstrap-app';

loadEnv({ path: resolve(__dirname, '../.env'), quiet: true });

describe('Bootstrap integration (HTTP + TableSpoonDB via Xyizle)', () => {
  let app: INestApplication<App> | undefined;

  beforeAll(async () => {
    const testUrl = process.env.TEST_DATABASE_URL;
    if (!testUrl) {
      throw new Error(
        'TEST_DATABASE_URL is required (see .env.example). Run TableSpoonDB via docker compose first.',
      );
    }
    process.env.DATABASE_URL = testUrl;

    // Load AppModule only after DATABASE_URL is set (Joi runs at module import time).
    const { AppModule } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- delayed import until DATABASE_URL is present
      require('../src/app.module') as typeof import('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const nest = moduleFixture.createNestApplication();
    applyHttpGlobals(nest);
    setupSwaggerIfDev(nest);
    await nest.init();
    app = nest;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health succeeds when the database is reachable', async () => {
    const res = await request(app!.getHttpServer()).get('/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('POST /widgets + GET /widgets/:id round-trips persistence', async () => {
    const create = await request(app!.getHttpServer())
      .post('/widgets')
      .send({ name: 'integration-widget' })
      .expect(201);

    const body = create.body as { id: string; name: string; createdAt: string };
    expect(body).toMatchObject({
      name: 'integration-widget',
    });
    expect(typeof body.id).toBe('string');

    const fetched = await request(app!.getHttpServer())
      .get(`/widgets/${body.id}`)
      .expect(200);

    expect(fetched.body).toEqual(body);
  });

  it('GET /widgets/:id returns 404 when missing', async () => {
    await request(app!.getHttpServer())
      .get('/widgets/7b3b8c8e-0e7f-45d9-8a2b-1e2f3a4b5c6d')
      .expect(404);
  });

  it('POST /widgets returns 400 on invalid payloads', async () => {
    await request(app!.getHttpServer()).post('/widgets').send({}).expect(400);
  });
});
