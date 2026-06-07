import { Router } from 'express';
import { progressController } from './progress.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { updateProgressSchema } from './progress.schemas';

const router = Router();

/** @swagger
 * /api/progress:
 *   get:
 *     tags: [Progress]
 *     summary: List progress records (filter by moduleId, groupId)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: moduleId, schema: { type: string, format: uuid } }
 *       - { in: query, name: groupId, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Progress list */
router.get('/', authenticate, progressController.findAll);

/** @swagger
 * /api/progress/group/{groupId}:
 *   get:
 *     tags: [Progress]
 *     summary: Get progress summary for a group (average across modules)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: groupId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Group progress summary */
router.get('/group/:groupId', authenticate, progressController.getGroupSummary);

/** @swagger
 * /api/progress:
 *   post:
 *     tags: [Progress]
 *     summary: Update progress % for a module/group (Enseignant/Admin)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [moduleId, groupId, percentage]
 *             properties:
 *               moduleId: { type: string, format: uuid }
 *               groupId: { type: string, format: uuid }
 *               percentage: { type: integer, minimum: 0, maximum: 100, example: 75 }
 *     responses:
 *       200:
 *         description: Progress updated */
router.post('/', authenticate, requireRole('Admin', 'Enseignant'), validate({ body: updateProgressSchema }), progressController.upsert);

export default router;
