import { prisma } from '../../config/database';
import { ApiError } from '../../middleware/errorHandler';
import { logger } from '../../middleware/logger';
import { CreateNotificationInput, BroadcastNotificationInput } from './notification.schemas';
import { sendEmail } from '../../services/email.service';
import { broadcastTelegram } from '../../services/telegram.service';

export class NotificationService {
    // ─── Read operations ───
    async findByUser(userId: string) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async getUnreadCount(userId: string) {
        return prisma.notification.count({ where: { userId, isRead: false } });
    }

    // ─── Single create (legacy) ───
    async create(data: CreateNotificationInput) {
        const user = await prisma.user.findUnique({ where: { id: data.userId } });
        if (!user) throw ApiError.badRequest('User not found');
        return prisma.notification.create({ data });
    }

    // ─── Broadcast (multi-channel, multi-recipient) ───
    async broadcast(data: BroadcastNotificationInput, senderId: string) {
        // 1. Resolve target users based on audience
        const targetUsers = await this.resolveAudience(data.audience, data.groupId, data.userId);

        if (targetUsers.length === 0) {
            throw ApiError.badRequest('No users found for the selected audience');
        }

        logger.info(`📢 Broadcasting "${data.title}" to ${targetUsers.length} users via [${data.channels.join(', ')}]`);

        // 2. Create in-app notifications for all target users
        const notifications = [];
        if (data.channels.includes('inapp')) {
            const created = await prisma.notification.createMany({
                data: targetUsers.map(u => ({
                    userId: u.id,
                    senderId,
                    title: data.title,
                    content: data.content,
                    type: data.type,
                    channels: data.channels,
                    audience: data.audience,
                    groupId: data.groupId || null,
                })),
            });
            logger.info(`📥 In-app: ${created.count} notifications created`);
            notifications.push({ channel: 'inapp', delivered: created.count, total: targetUsers.length });
        }

        // 3. Send emails (non-blocking — fire and forget)
        if (data.channels.includes('email')) {
            const emails = targetUsers.map(u => u.email).filter(Boolean);
            if (emails.length > 0) {
                // Send in batches of 50 to avoid SMTP limits
                const batchSize = 50;
                let emailsSent = 0;
                for (let i = 0; i < emails.length; i += batchSize) {
                    const batch = emails.slice(i, i + batchSize);
                    const ok = await sendEmail({
                        to: batch,
                        subject: data.title,
                        body: data.content,
                        type: data.type,
                    });
                    if (ok) emailsSent += batch.length;
                }
                notifications.push({ channel: 'email', delivered: emailsSent, total: emails.length });
                logger.info(`📧 Email: ${emailsSent}/${emails.length} delivered`);
            } else {
                notifications.push({ channel: 'email', delivered: 0, total: 0, reason: 'no valid emails' });
            }
        }

        // 4. Send Telegram messages
        if (data.channels.includes('telegram')) {
            const chatIds = targetUsers
                .map(u => u.telegramChatId)
                .filter((id): id is string => !!id);

            if (chatIds.length > 0) {
                const sent = await broadcastTelegram(chatIds, data.title, data.content, data.type);
                notifications.push({ channel: 'telegram', delivered: sent, total: chatIds.length });
            } else {
                notifications.push({ channel: 'telegram', delivered: 0, total: 0, reason: 'no linked accounts' });
                logger.info('🤖 Telegram: no users have linked their Telegram accounts');
            }
        }

        // 5. WhatsApp placeholder (future implementation)
        if (data.channels.includes('whatsapp')) {
            const phoneNumbers = targetUsers
                .map(u => u.whatsappNumber)
                .filter((n): n is string => !!n);
            notifications.push({ channel: 'whatsapp', delivered: 0, total: phoneNumbers.length, reason: 'WhatsApp API not yet integrated' });
            logger.info(`📱 WhatsApp: ${phoneNumbers.length} numbers found — API integration pending`);
        }

        return {
            recipientCount: targetUsers.length,
            channels: notifications,
            title: data.title,
            type: data.type,
            audience: data.audience,
        };
    }

    // ─── Resolve audience to list of users ───
    private async resolveAudience(audience: string, groupId?: string, userId?: string) {
        switch (audience) {
            case 'all':
                return prisma.user.findMany({
                    select: { id: true, email: true, telegramChatId: true, whatsappNumber: true },
                });
            case 'all_students':
                return prisma.user.findMany({
                    where: { role: 'Etudiant' },
                    select: { id: true, email: true, telegramChatId: true, whatsappNumber: true },
                });
            case 'all_teachers':
                return prisma.user.findMany({
                    where: { role: 'Enseignant' },
                    select: { id: true, email: true, telegramChatId: true, whatsappNumber: true },
                });
            case 'group':
                if (!groupId) throw ApiError.badRequest('groupId is required for group audience');
                const groupStudents = await prisma.groupStudent.findMany({
                    where: { groupId },
                    include: {
                        student: {
                            select: { id: true, email: true, telegramChatId: true, whatsappNumber: true },
                        },
                    },
                });
                return groupStudents.map(gs => gs.student);
            case 'user':
                if (!userId) throw ApiError.badRequest('userId is required for user audience');
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true, email: true, telegramChatId: true, whatsappNumber: true },
                });
                if (!user) throw ApiError.notFound('Target user not found');
                return [user];
            default:
                throw ApiError.badRequest(`Unknown audience: ${audience}`);
        }
    }

    // ─── Read/delete operations ───
    async markAsRead(id: string, userId: string) {
        const n = await prisma.notification.findUnique({ where: { id } });
        if (!n) throw ApiError.notFound('Notification not found');
        if (n.userId !== userId) throw ApiError.forbidden('Not your notification');
        return prisma.notification.update({ where: { id }, data: { isRead: true } });
    }

    async markAllAsRead(userId: string) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    async delete(id: string, userId: string) {
        const n = await prisma.notification.findUnique({ where: { id } });
        if (!n) throw ApiError.notFound('Notification not found');
        if (n.userId !== userId) throw ApiError.forbidden('Not your notification');
        return prisma.notification.delete({ where: { id } });
    }

    // ─── Sent log (for admin) ───
    async getSentLog(senderId: string) {
        // Get distinct broadcasts by grouping on title+content+createdAt
        const raw = await prisma.notification.findMany({
            where: { senderId },
            orderBy: { createdAt: 'desc' },
            take: 100,
            distinct: ['title', 'content'],
            select: {
                id: true,
                title: true,
                content: true,
                type: true,
                channels: true,
                audience: true,
                createdAt: true,
            },
        });
        return raw;
    }
}

export const notificationService = new NotificationService();
