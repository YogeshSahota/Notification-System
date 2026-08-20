import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './common/middleware/error-handler';
import { notFoundHandler } from './common/middleware/not-found';
import { setupSwagger } from './config/swagger';
import templateRoutes from './modules/template/template.routes';
import recipientRoutes from './modules/recipient/recipient.routes';
import preferenceRoutes from './modules/preference/preference.routes';
import notificationRoutes from './modules/notification/notification.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import { connectKafka, disconnectKafka, startConsumers, disconnectConsumers } from './kafka';
import { processNotification } from './kafka/notification-worker';
import { startRetryWorker, closeRetryQueue } from './kafka/retry-handler';
import { startSchedulerWorker, closeScheduler } from './scheduler/scheduler.service';
import { Consumer } from 'kafkajs';
import prisma from './config/database';
import redis from './config/redis';

const app = express();

app.use(cors());
app.use(express.json());

setupSwagger(app);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/templates', templateRoutes);
app.use('/api/recipients', recipientRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

let consumers: Consumer[] = [];
let isShuttingDown = false;

const server = app.listen(env.PORT, async () => {
  console.log(`[Server] Running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  try {
    await connectKafka();
    consumers = await startConsumers(processNotification);
    startRetryWorker();
    startSchedulerWorker();
  } catch (err) {
    console.error('[Kafka] Failed to connect:', err);
    process.exit(1);
  }
});

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[${signal}] Graceful shutdown initiated...`);

  const forceExit = setTimeout(() => {
    console.error('[Shutdown] Forced exit after timeout');
    process.exit(1);
  }, 10000);

  try {
    server.close(() => {
      console.log('[Server] HTTP server closed');
    });

    await disconnectConsumers(consumers);
    await closeRetryQueue();
    await closeScheduler();
    await disconnectKafka();
    await redis.quit();
    await prisma.$disconnect();

    console.log('[Shutdown] All connections closed cleanly');
    clearTimeout(forceExit);
    process.exit(0);
  } catch (err) {
    console.error('[Shutdown] Error during disconnect:', err);
    clearTimeout(forceExit);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default app;
