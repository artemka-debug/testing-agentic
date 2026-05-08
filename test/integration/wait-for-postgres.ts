import { Client } from 'pg';

export async function waitForPostgres(options: {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
  readonly database: string;
  readonly attempts?: number;
  readonly delayMs?: number;
}): Promise<void> {
  const attempts = options.attempts ?? 30;
  const delayMs = options.delayMs ?? 1000;
  const lastErrorMessages: string[] = [];

  for (let i = 0; i < attempts; i++) {
    const client = new Client({
      host: options.host,
      port: options.port,
      user: options.user,
      password: options.password,
      database: options.database,
    });
    try {
      await client.connect();
      await client.end();
      return;
    } catch (err) {
      await client.end().catch(() => undefined);
      lastErrorMessages.push(err instanceof Error ? err.message : String(err));
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  const target = `${options.host}:${String(options.port)}/${options.database}`;
  throw new Error(
    `PostgreSQL not reachable at ${target} after ${String(attempts)} attempts: ${lastErrorMessages.at(-1) ?? 'unknown error'}`,
  );
}
