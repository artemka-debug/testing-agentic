import { type INestApplication, RequestMethod } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { waitForPostgres } from './wait-for-postgres';

describe('Application integration', () => {
  let moduleFixture: TestingModule;
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    await waitForPostgres({
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.DB_PORT ?? 5433),
      user: process.env.DB_USER ?? 'app',
      password: process.env.DB_PASSWORD ?? 'devpassword',
      database: process.env.DB_NAME ?? 'app_test',
    });

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: [{ path: 'health', method: RequestMethod.ALL }],
    });
    await app.init();
    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('performs real database reads and writes on an isolated probe table (TEST-002)', async () => {
    const marker = `probe-${Date.now().toString()}-${Math.random().toString(16).slice(2)}`;

    const created = await prisma.integrationProbe.create({
      data: { marker },
    });
    expect(created.marker).toBe(marker);

    const found = await prisma.integrationProbe.findUnique({
      where: { marker },
    });
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);

    await prisma.integrationProbe.delete({ where: { marker } });
  });

  it('GET /health reports database connectivity', async () => {
    await request(app.getHttpServer() as Server)
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          status: 'ok',
          database: 'up',
        });
      });
  });
});
