import { Router } from 'express';
import { TemplateController } from './template.controller';
import { validate } from '../../common/middleware/validate';
import { createTemplateSchema, updateTemplateSchema } from './template.validators';

const router = Router();
const controller = new TemplateController();

/**
 * @openapi
 * /api/templates:
 *   post:
 *     tags: [Templates]
 *     summary: Create a template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTemplate'
 *     responses:
 *       201:
 *         description: Template created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Template' }
 *       400:
 *         description: Validation error (e.g. SMS template with subject)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validate(createTemplateSchema), controller.create);

/**
 * @openapi
 * /api/templates:
 *   get:
 *     tags: [Templates]
 *     summary: List all templates
 *     responses:
 *       200:
 *         description: List of templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Template' }
 */
router.get('/', controller.findAll);

/**
 * @openapi
 * /api/templates/{id}:
 *   get:
 *     tags: [Templates]
 *     summary: Get a template by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Template found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Template' }
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', controller.findById);

/**
 * @openapi
 * /api/templates/{id}:
 *   put:
 *     tags: [Templates]
 *     summary: Update a template
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
 *             $ref: '#/components/schemas/UpdateTemplate'
 *     responses:
 *       200:
 *         description: Template updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Template' }
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', validate(updateTemplateSchema), controller.update);

/**
 * @openapi
 * /api/templates/{id}:
 *   delete:
 *     tags: [Templates]
 *     summary: Delete a template
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Template deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: 'Template deleted' }
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', controller.delete);

export default router;
