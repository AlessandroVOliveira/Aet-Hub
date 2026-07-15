import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// `npm run dev`/`start` roda com cwd = apps/api (workspace do npm), então
// o dotenv precisa apontar explicitamente para o .env na raiz do monorepo
// em vez de confiar no cwd padrão. Precisa ser o primeiro import de
// server.ts para rodar antes de config/env.ts ler process.env.
const apiSrcDir = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(apiSrcDir, '..', '..', '..', '.env') });
