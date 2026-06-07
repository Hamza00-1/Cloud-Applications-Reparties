import { Router } from 'express';
import { openclawController } from './openclaw.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const router = Router();

/** @swagger
 * /api/openclaw/webhook:
 *   post:
 *     tags: [OpenClaw]
 *     summary: Receive a signed event from OpenClaw orchestrator
 *     description: Requires header `X-OpenClaw-Signature` = HMAC-SHA256(body, OPENCLAW_WEBHOOK_SECRET)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [event]
 *             properties:
 *               event:   { type: string, example: planning.daily.trigger }
 *               payload: { type: object }
 *     responses:
 *       200: { description: Event accepted }
 *       401: { description: Bad signature } */
router.post('/webhook', openclawController.webhook);

/** @swagger
 * /api/openclaw/trigger/daily-planning:
 *   post:
 *     tags: [OpenClaw]
 *     summary: Manually fire the daily planning notification job (Admin)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: Job summary } */
router.post(
    '/trigger/daily-planning',
    authenticate,
    requireRole('Admin'),
    openclawController.triggerDailyPlanning,
);

/** @swagger
 * /api/openclaw/trigger/absence-notify:
 *   post:
 *     tags: [OpenClaw]
 *     summary: Notify students about recent absences (Admin)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: Notification summary } */
router.post(
    '/trigger/absence-notify',
    authenticate,
    requireRole('Admin'),
    openclawController.triggerAbsenceNotify,
);

/** @swagger
 * /api/openclaw/trigger/overdue-scan:
 *   post:
 *     tags: [OpenClaw]
 *     summary: Scan overdue payments and notify students (Admin)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: Scan summary } */
router.post(
    '/trigger/overdue-scan',
    authenticate,
    requireRole('Admin'),
    openclawController.triggerOverdueScan,
);

export default router;
