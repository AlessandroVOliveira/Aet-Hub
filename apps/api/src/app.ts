import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { authRouter } from './modules/auth/auth.routes.js';
import { tournamentsRouter } from './modules/tournaments/tournaments.routes.js';
import { registrationsRouter } from './modules/registrations/registrations.routes.js';
import { checkinRouter } from './modules/checkin/checkin.routes.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.VITE_API_URL ? undefined : true,
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

app.use(errorHandler);

export default app;
