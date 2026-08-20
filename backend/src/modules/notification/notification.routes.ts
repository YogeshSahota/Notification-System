import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { validate, validateQuery } from '../../common/middleware/validate';
import { createNotificationSchema } from './notification.validators';
import { notificationListQuerySchema } from '../../common/validators/notification-query';

const router = Router();
const controller = new NotificationController();

/**
 * @openapi
 * /api/notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Send a notification
 *     description: |
 *       Creates and dispatches a notification. If the recipient has opted out of the channel,
 *       the notification is created with status SKIPPED. Scheduled notifications (via sendAt)
 *       are deferred to BullMQ and published to Kafka at the scheduled time.
 *       Rate limited to RATE_LIMIT_PER_HOUR per recipient.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNotification'
 *     responses:
 *       201:
 *         description: Notification created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Notification' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Recipient or template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Duplicate idempotency key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validate(createNotificationSchema), controller.create);

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [PENDING, PROCESSING, DELIVERED, FAILED, SKIPPED] }
 *       - name: channel
 *         in: query
 *         schema: { type: string, enum: [email, sms] }
 *       - name: priority
 *         in: query
 *         schema: { type: string, enum: [HIGH, NORMAL] }
 *       - name: recipientId
 *         in: query
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Notification' }
 */
router.get('/', validateQuery(notificationListQuerySchema), controller.findAll);

/**
 * @openapi
 * /api/notifications/{id}:
 *   get:
 *     tags: [Notifications]
 *     summary: Get a notification by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Notification found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Notification' }
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', controller.findById);

export default router;
