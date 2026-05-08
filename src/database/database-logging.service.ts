import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { databaseEnvSchema } from '../config/env.validation';

@Injectable()
export class DatabaseLoggingService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseLoggingService.name);

  constructor(private readonly config: ConfigService) {}

  onApplicationBootstrap(): void {
    const db = databaseEnvSchema.parse({
      DB_HOST: this.config.getOrThrow<string>('DB_HOST'),
      DB_PORT: this.config.getOrThrow<number>('DB_PORT'),
      DB_USER: this.config.getOrThrow<string>('DB_USER'),
      DB_PASSWORD: this.config.getOrThrow<string>('DB_PASSWORD'),
      DB_NAME: this.config.getOrThrow<string>('DB_NAME'),
    });
    const { DB_HOST: host, DB_PORT: port, DB_NAME: database } = db;
    this.logger.log(
      `PostgreSQL is ready (Prisma host=${String(host)} port=${String(port)} database=${String(database)})`,
    );
  }
}
