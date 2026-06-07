import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { createNotificationSchema, broadcastNotificationSchema, notificationIdParam } from './notification.schemas';

const router = Router();

/** @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get my notifications (last 50)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Notification list */
router.get('/', authenticate, notificationController.findMine);

/** @swagger
 * /api/notifications/unread:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Unread count */
router.get('/unread', authenticate, notificationController.unreadCount);

/** @swagger
 * /api/notifications/sent:
 *   get:
 *     tags: [Notifications]
 *     summary: Get sent notification log (Admin/Scolarite)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Sent log */
router.get('/sent', authenticate, requireRole('Admin', 'Scolarite'), notificationController.sentLog);

/** @swagger
 * /api/notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Send a notification to a single user (Admin/Scolarite)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, title, content]
 *             properties:
 *               userId: { type: string, format: uuid }
 *               title: { type: string }
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: Notification sent */
router.post('/', authenticate, requireRole('Admin', 'Scolarite'), validate({ body: createNotificationSchema }), notificationController.create);

/** @swagger
 * /api/notifications/broadcast:
 *   post:
 *     tags: [Notifications]
 *     summary: Broadcast notification via multiple channels (Admin/Scolarite)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, audience, channels]
 *             properties:
 *               title: { type: string, example: "Grade submission deadline" }
 *               content: { type: string, example: "Please submit all grades by Friday." }
 *               type: { type: string, enum: [info, alert, reminder, success], default: info }
 *               audience: { type: string, enum: [all, all_students, all_teachers, group, user] }
 *               groupId: { type: string, format: uuid }
 *               userId: { type: string, format: uuid }
 *               channels: { type: array, items: { type: string, enum: [inapp, email, telegram, whatsapp] } }
 *     responses:
 *       201:
 *         description: Broadcast result */
router.post('/broadcast', authenticate, requireRole('Admin', 'Scolarite'), validate({ body: broadcastNotificationSchema }), notificationController.broadcast);

/** @swagger
 * /api/notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all my notifications as read
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All marked as read */
router.put('/read-all', authenticate, notificationController.markAllAsRead);

router.put('/:id/read', authenticate, validate({ params: notificationIdParam }), notificationController.markAsRead);
router.delete('/:id', authenticate, validate({ params: notificationIdParam }), notificationController.delete);

export default router;
