import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';

const router = Router();
const controller = new AnalyticsController();

/**
 * @openapi
 * /api/analytics/summary:
 *   get:
 *     tags: [Analytics]
 *     summary: Get analytics summary
 *     description: Returns aggregate counts by status, channel, priority, DLQ entries, and recent hour activity.
 *     responses:
 *       200:
 *         description: Analytics summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/AnalyticsSummary' }
 */
router.get('/summary', controller.getSummary);

export default router;
