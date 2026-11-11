// Налаштування Express-застосунку (окремо від запуску — так його зручно тестувати)
import express from 'express';
import cors from 'cors';
import { catalogRouter } from './routes/catalog.js';
import { appointmentsRouter } from './routes/appointments.js';
import { feedbackRouter } from './routes/feedback.js';
import { errorHandler, notFoundHandler } from './errors.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  // CORS: дозволяємо запити з фронтенду (адреси через кому в CORS_ORIGIN, за замовчуванням — усі)
  const origins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
  app.use(cors({ origin: origins?.length ? origins : '*' }));

  app.use(express.json({ limit: '20kb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
  app.use('/api', catalogRouter);
  app.use('/api/appointments', appointmentsRouter);
  app.use('/api/feedback', feedbackRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
