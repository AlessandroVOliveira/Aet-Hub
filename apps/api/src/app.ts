import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { authRouter } from './modules/auth/auth.routes.js';
import { tournamentsRouter } from './modules/tournaments/tournaments.routes.js';
import { registrationsRouter } from './modules/registrations/registrations.routes.js';
import { checkinRouter } from './modules/checkin/checkin.routes.js';
import { matchesRouter } from './modules/matches/matches.routes.js';
import { tournamentPhotosRouter } from './modules/tournament-photos/tournament-photos.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { storeRouter } from './modules/store/store.routes.js';
import { rankingRouter } from './modules/ranking/ranking.routes.js';
import { chatRouter } from './modules/chat/chat.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { communitiesRouter } from './modules/communities/communities.routes.js';
import { feedRouter } from './modules/feed/feed.routes.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';

const app = express();

app.use(helmet());
// `origin: true` reflete o Origin da requisição (necessário com
// `credentials: true`, já que `cors` não aceita '*' combinado com
// credenciais). Não há hoje um env var de allowlist de frontend
// (`CORS_ORIGIN`/`FRONTEND_URL`) — API e frontend rodam só em dev local.
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Limite mais restrito em cadastro/login (RNF-07): dificulta criação em
// massa de contas falsas e força bruta de senha, sem afetar o resto da API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/auth', authLimiter, authRouter);
app.use('/tournaments', tournamentsRouter);
app.use('/registrations', registrationsRouter);
app.use('/checkins', checkinRouter);
app.use('/matches', matchesRouter);
app.use('/tournament-photos', tournamentPhotosRouter);
app.use('/users', usersRouter);
app.use('/store', storeRouter);
app.use('/ranking', rankingRouter);
app.use('/chat', chatRouter);
app.use('/notifications', notificationsRouter);
app.use('/communities', communitiesRouter);
app.use('/feed', feedRouter);

app.use(errorHandler);

export default app;
