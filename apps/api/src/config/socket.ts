import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { verifyAccessToken, type AccessTokenPayload } from '../modules/auth/jwt.js';

// Guarda a instância criada por createSocketServer para que módulos fora
// do ciclo request/response do Express (services que precisam emitir
// broadcast) consigam acessá-la sem depender de injeção manual por
// camada — ver getSocketServer abaixo.
let socketServerInstance: Server | undefined;

export function getSocketServer(): Server | undefined {
  return socketServerInstance;
}

// Middleware de handshake compartilhado por todos os namespaces
// autenticados: exige `socket.handshake.auth.token` (JWT) e popula
// `socket.data.user`. Extraído do que era inline só em `/tournaments`
// para ser reaproveitado por `/chat`.
function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
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
}

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });
  socketServerInstance = io;

  const tournaments = io.of('/tournaments');

  tournaments.use(socketAuthMiddleware);

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

  // Chat geral (RF-37) + DM 1:1 (RF-38): namespace continua broadcast-only
  // — o cliente não emite eventos, escrita é sempre via REST
  // (POST /chat/messages, POST /chat/conversations/:userId/messages).
  // chat.service emite 'chat:message' para o namespace inteiro (canal
  // único, sem sala). A sala `user:{id}` existe só para a entrega
  // direcionada de DM: direct-messages.service emite 'chat:dm' apenas
  // para as duas salas dos participantes, nunca para o namespace inteiro.
  const chat = io.of('/chat');
  chat.use(socketAuthMiddleware);

  chat.on('connection', (socket) => {
    const user = socket.data.user as AccessTokenPayload;
    socket.join(`user:${user.id}`);
  });

  return io;
}
