import { Router } from 'express';
import { absenceController } from './absence.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { markAbsenceSchema, markBulkAbsenceSchema, justifyAbsenceSchema, absenceIdParam } from './absence.schemas';

const router = Router();

/** @swagger
 * /api/absences:
 *   get:
 *     tags: [Absences]
 *     summary: List absences (filterable by session, student, status)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: sessionId, schema: { type: string, format: uuid } }
 *       - { in: query, name: studentId, schema: { type: string, format: uuid } }
 *       - { in: query, name: status, schema: { type: string, enum: [Present, Absent, Late] } }
 *     responses:
 *       200:
 *         description: Absence list */
router.get('/', authenticate, absenceController.findAll);
router.get('/:id', authenticate, validate({ params: absenceIdParam }), absenceController.findById);

/** @swagger
 * /api/absences/stats/{studentId}:
 *   get:
 *     tags: [Absences]
 *     summary: Get attendance statistics for a student
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: studentId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Attendance stats (present, absent, late, rate) */
router.get('/stats/:studentId', authenticate, absenceController.getStudentStats);

/** @swagger
 * /api/absences:
 *   post:
 *     tags: [Absences]
 *     summary: Mark a single absence (Enseignant/Scolarite/Admin)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, studentId, status]
 *             properties:
 *               sessionId: { type: string, format: uuid }
 *               studentId: { type: string, format: uuid }
 *               status: { type: string, enum: [Present, Absent, Late] }
 *     responses:
 *       201:
 *         description: Absence marked */
router.post('/', authenticate, requireRole('Admin', 'Scolarite', 'Enseignant'), validate({ body: markAbsenceSchema }), absenceController.mark);

/** @swagger
 * /api/absences/bulk:
 *   post:
 *     tags: [Absences]
 *     summary: Bulk mark absences for a session
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, records]
 *             properties:
 *               sessionId: { type: string, format: uuid }
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId: { type: string, format: uuid }
 *                     status: { type: string, enum: [Present, Absent, Late] }
 *     responses:
 *       201:
 *         description: Bulk absences marked */
router.post('/bulk', authenticate, requireRole('Admin', 'Scolarite', 'Enseignant'), validate({ body: markBulkAbsenceSchema }), absenceController.markBulk);

/** @swagger
 * /api/absences/{id}/justify:
 *   put:
 *     tags: [Absences]
 *     summary: Justify an absence (upload doc URL)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               justificationDocUrl: { type: string, format: uri }
 *               ocrTextExtracted: { type: string }
 *     responses:
 *       200:
 *         description: Absence justified */
router.put('/:id/justify', authenticate, validate({ params: absenceIdParam, body: justifyAbsenceSchema }), absenceController.justify);
router.delete('/:id', authenticate, requireRole('Admin', 'Scolarite'), validate({ params: absenceIdParam }), absenceController.delete);

export default router;
