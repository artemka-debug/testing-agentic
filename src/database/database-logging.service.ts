import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseLoggingService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseLoggingService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.dataSource.isInitialized) {
      this.logger.warn(
        'PostgreSQL DataSource is not initialized; startup may still be in progress.',
      );
      return;
    }
    const host = this.config.getOrThrow<string>('DB_HOST');
    const port = this.config.getOrThrow<number>('DB_PORT');
    const database = this.config.getOrThrow<string>('DB_NAME');
    this.logger.log(
      `PostgreSQL is ready (driver=typeorm+pg host=${String(host)} port=${String(port)} database=${String(database)})`,
    );
  }
}
