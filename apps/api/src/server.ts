import './load-env.js';
import { createServer } from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { createSocketServer } from './config/socket.js';
import { disconnectPrisma } from './config/prisma.js';

const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AET Hub API rodando na porta ${env.PORT}`);
});

async function shutdown(signal: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`Recebido ${signal}, encerrando graciosamente...`);
  httpServer.close();
  await disconnectPrisma();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
