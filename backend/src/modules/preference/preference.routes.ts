import { Router } from 'express';
import { PreferenceController } from './preference.controller';
import { validate } from '../../common/middleware/validate';
import { createPreferenceSchema, updatePreferenceSchema } from './preference.validators';

const router = Router();
const controller = new PreferenceController();

/**
 * @openapi
 * /api/preferences:
 *   post:
 *     tags: [Preferences]
 *     summary: Create a user preference
 *     description: Set opt-in/opt-out for a recipient on a specific channel. Defaults to opted_in=true.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePreference'
 *     responses:
 *       201:
 *         description: Preference created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/UserPreference' }
 *       400:
 *         description: Duplicate preference or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validate(createPreferenceSchema), controller.create);

/**
 * @openapi
 * /api/preferences:
 *   get:
 *     tags: [Preferences]
 *     summary: List all preferences
 *     responses:
 *       200:
 *         description: List of all user preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/UserPreference' }
 */
router.get('/', controller.findAll);

/**
 * @openapi
 * /api/preferences/{userId}:
 *   get:
 *     tags: [Preferences]
 *     summary: List preferences for a user
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/UserPreference' }
 */
router.get('/:userId', controller.findByUserId);

/**
 * @openapi
 * /api/preferences/{userId}/{channel}:
 *   get:
 *     tags: [Preferences]
 *     summary: Get a specific preference
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - name: channel
 *         in: path
 *         required: true
 *         schema: { type: string, enum: [email, sms] }
 *     responses:
 *       200:
 *         description: Preference found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/UserPreference' }
 *       404:
 *         description: Preference not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:userId/:channel', controller.findByUserAndChannel);

/**
 * @openapi
 * /api/preferences/{userId}/{channel}:
 *   put:
 *     tags: [Preferences]
 *     summary: Update a preference
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - name: channel
 *         in: path
 *         required: true
 *         schema: { type: string, enum: [email, sms] }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePreference'
 *     responses:
 *       200:
 *         description: Preference updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/UserPreference' }
 *       404:
 *         description: Preference not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:userId/:channel', validate(updatePreferenceSchema), controller.update);

/**
 * @openapi
 * /api/preferences/{userId}/{channel}:
 *   delete:
 *     tags: [Preferences]
 *     summary: Delete a preference
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - name: channel
 *         in: path
 *         required: true
 *         schema: { type: string, enum: [email, sms] }
 *     responses:
 *       200:
 *         description: Preference deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: 'Preference deleted' }
 *       404:
 *         description: Preference not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:userId/:channel', controller.delete);

export default router;
