import { z } from 'zod';

// ─── Single notification (admin → specific user) ───
export const createNotificationSchema = z.object({
    userId: z.string().uuid(),
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(5000),
});
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

// ─── Broadcast notification (admin → audience) ───
export const broadcastNotificationSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(5000),
    type: z.enum(['info', 'alert', 'reminder', 'success']).default('info'),
    audience: z.enum(['all', 'all_students', 'all_teachers', 'group', 'user']),
    groupId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    channels: z.array(z.enum(['inapp', 'email', 'telegram', 'whatsapp'])).min(1),
});
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;

// ─── Params ───
export const notificationIdParam = z.object({ id: z.string().uuid() });
