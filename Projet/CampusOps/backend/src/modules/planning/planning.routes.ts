import { Router } from 'express';
import { planningController } from './planning.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { createPlanningSchema, updatePlanningSchema, planningIdParam } from './planning.schemas';

const router = Router();

/** @swagger
 * /api/planning/today:
 *   get:
 *     tags: [Planning]
 *     summary: Get today's schedule (role-aware)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Today's sessions */
router.get('/today', authenticate, planningController.findToday);

/** @swagger
 * /api/planning/week:
 *   get:
 *     tags: [Planning]
 *     summary: Get this week's schedule (role-aware)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: This week's sessions */
router.get('/week', authenticate, planningController.findWeek);

router.get('/', authenticate, planningController.findAll);
router.get('/:id', authenticate, validate({ params: planningIdParam }), planningController.findById);

/** @swagger
 * /api/planning:
 *   post:
 *     tags: [Planning]
 *     summary: Create a planning session (Scolarite/Admin)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [moduleId, groupId, teacherId, room, startTime, endTime]
 *             properties:
 *               moduleId: { type: string, format: uuid }
 *               groupId: { type: string, format: uuid }
 *               teacherId: { type: string, format: uuid }
 *               room: { type: string, example: "Amphi B" }
 *               startTime: { type: string, format: date-time }
 *               endTime: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Session created */
router.post('/', authenticate, requireRole('Admin', 'Scolarite'), validate({ body: createPlanningSchema }), planningController.create);
router.put('/:id', authenticate, requireRole('Admin', 'Scolarite'), validate({ params: planningIdParam, body: updatePlanningSchema }), planningController.update);
router.delete('/:id', authenticate, requireRole('Admin', 'Scolarite'), validate({ params: planningIdParam }), planningController.delete);

export default router;
