import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env'), quiet: true });

// TEST-003: integration tests target a dedicated database by default.
process.env.DB_NAME = process.env.DB_NAME_INTEGRATION ?? 'app_test';
