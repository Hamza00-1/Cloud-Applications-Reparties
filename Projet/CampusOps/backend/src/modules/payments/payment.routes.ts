import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole, requireOwnerOrAdmin } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { createPaymentSchema, updatePaymentSchema, paymentIdParam } from './payment.schemas';

const router = Router();

/** @swagger
 * /api/payments:
 *   get:
 *     tags: [Payments]
 *     summary: List payments (filter by student, status, overdue)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: studentId, schema: { type: string, format: uuid } }
 *       - { in: query, name: status, schema: { type: string, enum: [Paid, Partial, Unpaid] } }
 *       - { in: query, name: planType, schema: { type: string, enum: [Inscription, Mensualite] } }
 *       - { in: query, name: overdue, schema: { type: string, enum: ['true', 'false'] }, description: "Filter overdue payments" }
 *     responses:
 *       200:
 *         description: Payment list */
router.get('/', authenticate, requireRole('Admin', 'Scolarite'), paymentController.findAll);

/** @swagger
 * /api/payments/summary/{studentId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment summary for a student
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: studentId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Total due, paid, balance, overdue count */
router.get('/summary/:studentId', authenticate, requireOwnerOrAdmin('studentId'), paymentController.getStudentSummary);
router.get('/:id', authenticate, validate({ params: paymentIdParam }), paymentController.findById);

/** @swagger
 * /api/payments:
 *   post:
 *     tags: [Payments]
 *     summary: Create a payment record (Scolarite/Admin)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, planType, amount, dueDate]
 *             properties:
 *               studentId: { type: string, format: uuid }
 *               planType: { type: string, enum: [Inscription, Mensualite] }
 *               amount: { type: number, example: 5000 }
 *               status: { type: string, enum: [Paid, Partial, Unpaid], default: Unpaid }
 *               dueDate: { type: string, format: date, example: "2026-05-01" }
 *     responses:
 *       201:
 *         description: Payment created */
router.post('/', authenticate, requireRole('Admin', 'Scolarite'), validate({ body: createPaymentSchema }), paymentController.create);
router.put('/:id', authenticate, requireRole('Admin', 'Scolarite'), validate({ params: paymentIdParam, body: updatePaymentSchema }), paymentController.update);
router.delete('/:id', authenticate, requireRole('Admin', 'Scolarite'), validate({ params: paymentIdParam }), paymentController.delete);
router.post('/:id/send-receipt', authenticate, requireRole('Admin', 'Scolarite'), validate({ params: paymentIdParam }), paymentController.sendReceipt);

export default router;
