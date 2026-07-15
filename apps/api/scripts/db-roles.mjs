import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { config } from 'dotenv';

const apiDir = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(apiDir, '..', '..', '..', '.env') });

const requiredEnvVars = [
  'POSTGRES_SUPERUSER',
  'POSTGRES_DB',
  'AET_APP_DB_PASSWORD',
  'AET_AUTH_DB_PASSWORD',
];

const missing = requiredEnvVars.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Faltam variáveis no .env: ${missing.join(', ')}`);
  process.exit(1);
}

const composeFile = path.join(apiDir, '..', '..', '..', 'docker-compose.yml');

const result = spawnSync(
  'docker',
  [
    'compose',
    '-f',
    composeFile,
    'exec',
    '-T',
    'postgres',
    'psql',
    '-U',
    process.env.POSTGRES_SUPERUSER,
    '-d',
    process.env.POSTGRES_DB,
    '-v',
    `app_password=${process.env.AET_APP_DB_PASSWORD}`,
    '-v',
    `auth_password=${process.env.AET_AUTH_DB_PASSWORD}`,
    '-f',
    '/roles.sql',
  ],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
