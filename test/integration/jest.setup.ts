import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env'), quiet: true });

// Compose-backed defaults when `.env` is absent (still overridable by the shell).
process.env.DB_HOST ??= '127.0.0.1';
process.env.DB_PORT ??= '5433';
process.env.DB_USER ??= 'app';
process.env.DB_PASSWORD ??= 'devpassword';

// TEST-003: integration tests always target a dedicated database (not the primary `app` DB).
process.env.DB_NAME = process.env.DB_NAME_INTEGRATION ?? 'app_test';
