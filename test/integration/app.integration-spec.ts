import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { waitForPostgres } from './wait-for-postgres';

describe('Application integration', () => {
  let moduleFixture: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;

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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('performs real database reads and writes on an isolated probe table (TEST-002)', async () => {
    const marker = `probe-${Date.now().toString()}-${Math.random().toString(16).slice(2)}`;

    await dataSource.query(
      `CREATE TABLE IF NOT EXISTS integration_probe (
        id SERIAL PRIMARY KEY,
        marker TEXT NOT NULL UNIQUE
      )`,
    );
    await dataSource.query(
      `INSERT INTO integration_probe (marker) VALUES ($1)`,
      [marker],
    );
    const rows = (await dataSource.query(
      `SELECT id FROM integration_probe WHERE marker = $1`,
      [marker],
    )) as unknown;
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(1);
    await dataSource.query(`DELETE FROM integration_probe WHERE marker = $1`, [
      marker,
    ]);
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
