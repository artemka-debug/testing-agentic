import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).optional(),
  /** Used by Prisma Migrate (`pnpm run db:migrate`); must target the primary DB, not `app_test`. */
  DATABASE_URL: z.string().min(1).optional(),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  /** Override DB name for integration tests (see `test/integration/jest.setup.ts`). */
  DB_NAME_INTEGRATION: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});

/** Subset validated again when wiring TypeORM so config stays schema-driven everywhere. */
export const databaseEnvSchema = envSchema.pick({
  DB_HOST: true,
  DB_PORT: true,
  DB_USER: true,
  DB_PASSWORD: true,
  DB_NAME: true,
});

/** HTTP listen port after coercion (default 3000 when unset). */
export const listenEnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

export type EnvironmentVariables = z.infer<typeof envSchema>;

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(
      `Environment validation failed: ${parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}`,
    );
  }
  return parsed.data;
}
