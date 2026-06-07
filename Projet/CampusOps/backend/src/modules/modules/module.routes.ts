import { Router } from 'express';
import { moduleController } from './module.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { createModuleSchema, updateModuleSchema, moduleIdParam } from './module.schemas';

const router = Router();

/** @swagger
 * /api/modules:
 *   get:
 *     tags: [Modules]
 *     summary: List all modules (optionally filter by branchId)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: branchId, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Module list */
router.get('/', authenticate, moduleController.findAll);
router.get('/:id', authenticate, validate({ params: moduleIdParam }), moduleController.findById);

/** @swagger
 * /api/modules:
 *   post:
 *     tags: [Modules]
 *     summary: Create a module (Scolarite/Admin)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, branchId]
 *             properties:
 *               name: { type: string, example: "Machine Learning" }
 *               description: { type: string, example: "Neural networks, deep learning" }
 *               branchId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Module created */
router.post('/', authenticate, requireRole('Admin', 'Scolarite'), validate({ body: createModuleSchema }), moduleController.create);
router.put('/:id', authenticate, requireRole('Admin', 'Scolarite'), validate({ params: moduleIdParam, body: updateModuleSchema }), moduleController.update);
router.delete('/:id', authenticate, requireRole('Admin', 'Scolarite'), validate({ params: moduleIdParam }), moduleController.delete);

export default router;
