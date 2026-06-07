import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { successResponse } from '../../utils/response';

export class NotificationController {
    // GET /notifications — User's inbox
    async findMine(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await notificationService.findByUser(req.user!.id);
            res.json(successResponse(data, 'Notifications retrieved'));
        } catch (e) { next(e); }
    }

    // GET /notifications/unread — Unread count
    async unreadCount(req: Request, res: Response, next: NextFunction) {
        try {
            const count = await notificationService.getUnreadCount(req.user!.id);
            res.json(successResponse({ count }, 'Unread count'));
        } catch (e) { next(e); }
    }

    // POST /notifications — Single notification (legacy, admin only)
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await notificationService.create(req.body);
            res.status(201).json(successResponse(data, 'Notification sent'));
        } catch (e) { next(e); }
    }

    // POST /notifications/broadcast — Multi-channel broadcast (admin/scolarite)
    async broadcast(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await notificationService.broadcast(req.body, req.user!.id);
            res.status(201).json(successResponse(result, `Notification broadcast to ${result.recipientCount} users`));
        } catch (e) { next(e); }
    }

    // GET /notifications/sent — Sent log (admin)
    async sentLog(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await notificationService.getSentLog(req.user!.id);
            res.json(successResponse(data, 'Sent log retrieved'));
        } catch (e) { next(e); }
    }

    // PUT /notifications/:id/read — Mark single as read
    async markAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await notificationService.markAsRead(String(req.params.id), req.user!.id);
            res.json(successResponse(data, 'Marked as read'));
        } catch (e) { next(e); }
    }

    // PUT /notifications/read-all — Mark all as read
    async markAllAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await notificationService.markAllAsRead(req.user!.id);
            res.json(successResponse(data, 'All marked as read'));
        } catch (e) { next(e); }
    }

    // DELETE /notifications/:id — Delete notification
    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await notificationService.delete(String(req.params.id), req.user!.id);
            res.json(successResponse(null, 'Notification deleted'));
        } catch (e) { next(e); }
    }
}

export const notificationController = new NotificationController();
