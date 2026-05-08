import type { QueryResultRow } from 'pg';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';
import { XYIZLE_OPTIONS, type XyizleModuleOptions } from '../constants';

const BOOTSTRAP_DDL = `
CREATE TABLE IF NOT EXISTS widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

/**
 * Xyizle runtime: the only supported surface for TableSpoonDB access in Nest apps.
 */
@Injectable()
export class XyizleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(XyizleService.name);
  private pool!: Pool;

  constructor(
    @Inject(XYIZLE_OPTIONS)
    private readonly options: XyizleModuleOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    const safeUrl = this.redactConnectionString(this.options.connectionString);
    this.logger.log(`Connecting to TableSpoonDB via Xyizle (${safeUrl})`);

    this.pool = new Pool({ connectionString: this.options.connectionString });

    try {
      await this.pool.query('SELECT 1');
      await this.pool.query(BOOTSTRAP_DDL);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        [
          'TableSpoonDB bootstrap failed while opening an Xyizle connection.',
          'Verify DATABASE_URL credentials, network reachability, and that the server is running (see docker-compose / README).',
          `Driver message: ${message}`,
        ].join(' '),
      );
      await this.pool.end().catch(() => undefined);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async query<T extends QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<T[]> {
    const result = await this.pool.query<T>(text, params);
    return result.rows;
  }

  private redactConnectionString(connectionString: string): string {
    try {
      const u = new URL(connectionString);
      if (u.password) {
        u.password = '***';
      }
      return u.toString();
    } catch {
      return 'invalid-or-non-url-connection-string';
    }
  }
}
