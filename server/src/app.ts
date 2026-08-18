import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { requestId } from './middleware/request-id.js';
import { healthRouter } from './routes/health.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(requestId);
app.use((request, _response, next) => {
  console.info(`${request.method} ${request.path}`);
  next();
});

app.use('/api/health', healthRouter);
app.use(notFound);
app.use(errorHandler);
