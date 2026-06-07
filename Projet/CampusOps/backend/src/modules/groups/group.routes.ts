import { Router } from 'express';
import { groupController } from './group.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { createGroupSchema, updateGroupSchema, groupIdParam, enrollStudentSchema } from './group.schemas';

const router = Router();

/** @swagger
 * /api/groups:
 *   get:
 *     tags: [Groups]
 *     summary: List all groups
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: branchId, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Group list */
router.get('/', authenticate, groupController.findAll);
router.get('/:id', authenticate, validate({ params: groupIdParam }), groupController.findById);

/** @swagger
 * /api/groups:
 *   post:
 *     tags: [Groups]
 *     summary: Create a group (Scolarite/Admin)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, academicYear, branchId]
 *             properties:
 *               name: { type: string, example: "Master Info - G2" }
 *               academicYear: { type: string, example: "2025/2026" }
 *               branchId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Group created */
router.post('/', authenticate, requireRole('Admin', 'Scolarite'), validate({ body: createGroupSchema }), groupController.create);
router.put('/:id', authenticate, requireRole('Admin', 'Scolarite'), validate({ params: groupIdParam, body: updateGroupSchema }), groupController.update);
router.delete('/:id', authenticate, requireRole('Admin', 'Scolarite'), validate({ params: groupIdParam }), groupController.delete);

/** @swagger
 * /api/groups/{id}/students:
 *   post:
 *     tags: [Groups]
 *     summary: Enroll a student into a group (Scolarite/Admin)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId]
 *             properties:
 *               studentId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Student enrolled
 *       409:
 *         description: Already enrolled */
router.post('/:id/students', authenticate, requireRole('Admin', 'Scolarite'), validate({ params: groupIdParam, body: enrollStudentSchema }), groupController.enrollStudent);

/** @swagger
 * /api/groups/{id}/students:
 *   delete:
 *     tags: [Groups]
 *     summary: Remove a student from a group (Scolarite/Admin)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId]
 *             properties:
 *               studentId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Student removed */
router.delete('/:id/students', authenticate, requireRole('Admin', 'Scolarite'), validate({ params: groupIdParam, body: enrollStudentSchema }), groupController.unenrollStudent);

export default router;
