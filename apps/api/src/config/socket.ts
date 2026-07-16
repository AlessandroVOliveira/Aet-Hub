import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { verifyAccessToken } from '../modules/auth/jwt.js';

// Guarda a instância criada por createSocketServer para que módulos fora
// do ciclo request/response do Express (services que precisam emitir
// broadcast) consigam acessá-la sem depender de injeção manual por
// camada — ver getSocketServer abaixo.
let socketServerInstance: Server | undefined;

export function getSocketServer(): Server | undefined {
  return socketServerInstance;
}

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });
  socketServerInstance = io;

  const tournaments = io.of('/tournaments');

  tournaments.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      next(new Error('Token de autenticação ausente'));
      return;
    }

    try {
      socket.data.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Token de autenticação inválido'));
    }
  });

  // Convenção de sala: uma sala por torneio, nome `tournament:{id}`. O
  // broadcast de atualização de chave (RF-13) entra no bloco de
  // chaveamento — aqui só a infraestrutura de conexão/sala.
  tournaments.on('connection', (socket) => {
    socket.on('tournament:join', (tournamentId: string) => {
      socket.join(`tournament:${tournamentId}`);
    });

    socket.on('tournament:leave', (tournamentId: string) => {
      socket.leave(`tournament:${tournamentId}`);
    });
  });

  // Namespace reservado para o chat da Fase 2 (RF-37/RF-38): sem
  // implementação ainda, só o contrato de que o namespace vai existir aqui.
  io.of('/chat');

  return io;
}
