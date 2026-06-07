import { Router } from 'express';
import { gradeController } from './grade.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole, requireOwnerOrAdmin } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { createGradeSchema, updateGradeSchema, bulkCreateGradeSchema, gradeIdParam } from './grade.schemas';

const router = Router();

/** @swagger
 * /api/grades:
 *   get:
 *     tags: [Grades]
 *     summary: List grades (filterable by student, module, type, semester)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: studentId, schema: { type: string, format: uuid } }
 *       - { in: query, name: moduleId, schema: { type: string, format: uuid } }
 *       - { in: query, name: gradeType, schema: { type: string, enum: [Exam, TD, TP, Project] } }
 *       - { in: query, name: semester, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Grades list */
router.get('/', authenticate, gradeController.findAll);

/** @swagger
 * /api/grades/transcript/{studentId}:
 *   get:
 *     tags: [Grades]
 *     summary: Get full transcript for a student (grouped by module with averages)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: studentId, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: semester, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Student transcript with module averages and overall GPA */
router.get('/transcript/:studentId', authenticate, requireOwnerOrAdmin('studentId'), gradeController.getTranscript);

/** @swagger
 * /api/grades/{id}:
 *   get:
 *     tags: [Grades]
 *     summary: Get a specific grade
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Grade details */
router.get('/:id', authenticate, validate({ params: gradeIdParam }), gradeController.findById);

/** @swagger
 * /api/grades:
 *   post:
 *     tags: [Grades]
 *     summary: Record a single grade (Enseignant/Scolarite/Admin)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, moduleId, value, gradeType]
 *             properties:
 *               studentId: { type: string, format: uuid }
 *               moduleId: { type: string, format: uuid }
 *               value: { type: number, minimum: 0, maximum: 20 }
 *               gradeType: { type: string, enum: [Exam, TD, TP, Project] }
 *               semester: { type: string, default: S1-2024 }
 *               comment: { type: string }
 *     responses:
 *       201:
 *         description: Grade recorded */
router.post('/', authenticate, requireRole('Admin', 'Scolarite', 'Enseignant'), validate({ body: createGradeSchema }), gradeController.create);

/** @swagger
 * /api/grades/bulk:
 *   post:
 *     tags: [Grades]
 *     summary: Bulk record grades for a module (Enseignant/Scolarite/Admin)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [moduleId, gradeType, grades]
 *             properties:
 *               moduleId: { type: string, format: uuid }
 *               gradeType: { type: string, enum: [Exam, TD, TP, Project] }
 *               semester: { type: string, default: S1-2024 }
 *               grades:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId: { type: string, format: uuid }
 *                     value: { type: number, minimum: 0, maximum: 20 }
 *                     comment: { type: string }
 *     responses:
 *       201:
 *         description: Bulk grades recorded */
router.post('/bulk', authenticate, requireRole('Admin', 'Scolarite', 'Enseignant'), validate({ body: bulkCreateGradeSchema }), gradeController.bulkCreate);

/** @swagger
 * /api/grades/{id}:
 *   put:
 *     tags: [Grades]
 *     summary: Update a grade
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value: { type: number, minimum: 0, maximum: 20 }
 *               comment: { type: string }
 *     responses:
 *       200:
 *         description: Grade updated */
router.put('/:id', authenticate, requireRole('Admin', 'Scolarite', 'Enseignant'), validate({ params: gradeIdParam, body: updateGradeSchema }), gradeController.update);

/** @swagger
 * /api/grades/{id}:
 *   delete:
 *     tags: [Grades]
 *     summary: Delete a grade (Admin/Scolarite only)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Grade deleted */
router.delete('/:id', authenticate, requireRole('Admin', 'Scolarite'), validate({ params: gradeIdParam }), gradeController.delete);

export default router;
