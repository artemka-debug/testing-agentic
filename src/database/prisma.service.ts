import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { databaseEnvSchema } from '../config/env.validation';

function buildDatabaseUrl(config: ConfigService): string {
  const db = databaseEnvSchema.parse({
    DB_HOST: config.getOrThrow<string>('DB_HOST'),
    DB_PORT: config.getOrThrow<number>('DB_PORT'),
    DB_USER: config.getOrThrow<string>('DB_USER'),
    DB_PASSWORD: config.getOrThrow<string>('DB_PASSWORD'),
    DB_NAME: config.getOrThrow<string>('DB_NAME'),
  });
  const u = encodeURIComponent(db.DB_USER);
  const p = encodeURIComponent(db.DB_PASSWORD);
  return `postgresql://${u}:${p}@${db.DB_HOST}:${String(db.DB_PORT)}/${db.DB_NAME}`;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: buildDatabaseUrl(config),
        },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
