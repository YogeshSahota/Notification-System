import express from 'express';
import cors from 'cors';
import { errorHandler } from '../src/common/middleware/error-handler';
import { notFoundHandler } from '../src/common/middleware/not-found';
import templateRoutes from '../src/modules/template/template.routes';
import recipientRoutes from '../src/modules/recipient/recipient.routes';
import preferenceRoutes from '../src/modules/preference/preference.routes';
import notificationRoutes from '../src/modules/notification/notification.routes';
import analyticsRoutes from '../src/modules/analytics/analytics.routes';

const app = express();

app.use(cors());
app.use(express.json());

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

export default app;
