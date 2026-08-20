import { Router } from 'express';
import { RecipientController } from './recipient.controller';
import { validate } from '../../common/middleware/validate';
import { createRecipientSchema, updateRecipientSchema } from './recipient.validators';

const router = Router();
const controller = new RecipientController();

/**
 * @openapi
 * /api/recipients:
 *   post:
 *     tags: [Recipients]
 *     summary: Create a recipient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRecipient'
 *     responses:
 *       201:
 *         description: Recipient created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Recipient' }
 *       400:
 *         description: Duplicate email or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validate(createRecipientSchema), controller.create);

/**
 * @openapi
 * /api/recipients:
 *   get:
 *     tags: [Recipients]
 *     summary: List all recipients
 *     responses:
 *       200:
 *         description: List of recipients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Recipient' }
 */
router.get('/', controller.findAll);

/**
 * @openapi
 * /api/recipients/{id}:
 *   get:
 *     tags: [Recipients]
 *     summary: Get a recipient by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Recipient found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Recipient' }
 *       404:
 *         description: Recipient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', controller.findById);

/**
 * @openapi
 * /api/recipients/{id}:
 *   put:
 *     tags: [Recipients]
 *     summary: Update a recipient
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRecipient'
 *     responses:
 *       200:
 *         description: Recipient updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Recipient' }
 *       404:
 *         description: Recipient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', validate(updateRecipientSchema), controller.update);

/**
 * @openapi
 * /api/recipients/{id}:
 *   delete:
 *     tags: [Recipients]
 *     summary: Delete a recipient
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Recipient deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: 'Recipient deleted' }
 *       404:
 *         description: Recipient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', controller.delete);

export default router;
