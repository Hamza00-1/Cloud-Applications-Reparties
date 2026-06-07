import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../middleware/logger';
import { ApiError } from '../../middleware/errorHandler';
import { successResponse } from '../../utils/response';
import { runDailyPlanningNotifications } from './daily-planning.job';
import { prisma } from '../../config/database';
import { sendEmail } from '../../services/email.service';
import { sendTelegramMessage } from '../../services/telegram.service';

/**
 * Constant-time HMAC verification for the X-OpenClaw-Signature header.
 * If OPENCLAW_WEBHOOK_SECRET is unset we reject all requests — fail closed.
 */
function verifySignature(rawBody: string, signature: string | undefined): boolean {
    if (!env.OPENCLAW_WEBHOOK_SECRET) return false;
    if (!signature) return false;
    const expected = crypto
        .createHmac('sha256', env.OPENCLAW_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
        return false;
    }
}

/**
 * Workflow 2: Notify student when marked absent.
 * Sends email + Telegram (if linked) + in-app notification.
 */
async function runAbsenceNotification(absenceId?: string) {
    const where: any = {};
    if (absenceId) {
        where.id = absenceId;
    } else {
        // Last 24 hours, absent only
        const since = new Date(); since.setHours(since.getHours() - 24);
        where.createdAt = { gte: since };
        where.status = 'Absent';
    }

    const absences = await prisma.absence.findMany({
        where,
        include: {
            student: { select: { id: true, name: true, email: true, telegramChatId: true } },
            planning: { include: { module: { select: { name: true } } } },
        },
    });

    let emailsSent = 0;
    let telegramSent = 0;

    for (const a of absences) {
        const moduleName = a.planning?.module?.name || 'Unknown';
        const date = a.createdAt.toLocaleDateString('fr-FR');

        // Email notification
        const emailOk = await sendEmail({
            to: a.student.email,
            subject: `CampusOps — Absence enregistrée (${moduleName})`,
            body: `Bonjour ${a.student.name},\n\nUne absence a été enregistrée :\n\n📚 Module : ${moduleName}\n📅 Date : ${date}\n❌ Statut : ${a.status}\n\nContactez votre enseignant ou la scolarité si c'est une erreur.\n\nCordialement,\nCampusOps — EIDIA`,
            type: 'alert',
        });
        if (emailOk) emailsSent++;

        // Telegram notification
        if (a.student.telegramChatId) {
            const ok = await sendTelegramMessage(a.student.telegramChatId,
                `⚠️ *Absence enregistrée*\n\n📚 ${moduleName}\n📅 ${date}\n❌ Statut: ${a.status}\n\nContactez la scolarité si c'est une erreur.`
            );
            if (ok) telegramSent++;
        }

        // In-app notification
        await prisma.notification.create({
            data: {
                userId: a.student.id,
                title: `Absence — ${moduleName}`,
                message: `Vous avez été marqué(e) absent(e) le ${date} pour ${moduleName}.`,
                type: 'absence',
            },
        });
    }

    const summary = { absencesProcessed: absences.length, emailsSent, telegramSent };
    logger.info(`🪝 Absence notifications: ${JSON.stringify(summary)}`);
    return summary;
}

/**
 * Workflow 3: Scan overdue payments and notify students.
 * Sends email + Telegram (if linked) + in-app notification + creates relance task.
 */
async function runOverduePaymentScan() {
    const now = new Date();
    const overduePayments = await prisma.payment.findMany({
        where: { dueDate: { lt: now }, status: { not: 'Paid' } },
        include: { student: { select: { id: true, name: true, email: true, telegramChatId: true } } },
    });

    let emailsSent = 0;
    let telegramSent = 0;
    let notificationsCreated = 0;

    for (const p of overduePayments) {
        const amount = Number(p.amount).toLocaleString('fr-FR');
        const dueDate = p.dueDate.toLocaleDateString('fr-FR');

        // Email
        const emailOk = await sendEmail({
            to: p.student.email,
            subject: `CampusOps — Paiement en retard (${amount} MAD)`,
            body: `Bonjour ${p.student.name},\n\nVotre paiement est en retard :\n\n📄 Type : ${p.planType}\n💰 Montant : ${amount} MAD\n📅 Échéance : ${dueDate}\n⚠️ Statut : ${p.status}\n\nVeuillez régulariser votre situation auprès de la scolarité.\n\nCordialement,\nCampusOps — EIDIA`,
            type: 'alert',
        });
        if (emailOk) emailsSent++;

        // Telegram
        if (p.student.telegramChatId) {
            const ok = await sendTelegramMessage(p.student.telegramChatId,
                `💰 *Paiement en retard*\n\n📄 ${p.planType}\n💰 ${amount} MAD\n📅 Échéance: ${dueDate}\n⚠️ Statut: ${p.status}\n\nContactez la scolarité pour régulariser.`
            );
            if (ok) telegramSent++;
        }

        // In-app notification
        await prisma.notification.create({
            data: {
                userId: p.student.id,
                title: `Paiement en retard — ${amount} MAD`,
                message: `Votre ${p.planType} de ${amount} MAD (échéance ${dueDate}) est en retard.`,
                type: 'payment',
            },
        });
        notificationsCreated++;
    }

    const summary = { overdueFound: overduePayments.length, emailsSent, telegramSent, notificationsCreated };
    logger.info(`🪝 Overdue payment scan: ${JSON.stringify(summary)}`);
    return summary;
}

export class OpenClawController {
    /** POST /api/openclaw/webhook — generic event receiver */
    async webhook(req: Request, res: Response, next: NextFunction) {
        try {
            const raw = JSON.stringify(req.body ?? {});
            const sig = req.header('x-openclaw-signature');

            if (!verifySignature(raw, sig)) {
                throw ApiError.unauthorized('Invalid OpenClaw signature');
            }

            const event = req.body?.event as string | undefined;
            const payload = req.body?.payload;

            logger.info(`🪝 OpenClaw event received: ${event || '(unknown)'}`);

            switch (event) {
                case 'planning.daily.trigger':
                    await runDailyPlanningNotifications();
                    break;
                case 'absence.notify':
                    await runAbsenceNotification(payload?.absenceId);
                    break;
                case 'payment.overdue.scan':
                    await runOverduePaymentScan();
                    break;
                case 'health.ping':
                    break;
                default:
                    logger.warn(`🪝 OpenClaw event "${event}" has no handler — payload stored in logs only`, payload);
            }

            res.json(successResponse({ event, received: true }, 'Webhook accepted'));
        } catch (e) { next(e); }
    }

    /** POST /api/openclaw/trigger/daily-planning — manual fire (Admin only) */
    async triggerDailyPlanning(_req: Request, res: Response, next: NextFunction) {
        try {
            const summary = await runDailyPlanningNotifications();
            res.json(successResponse(summary, 'Daily planning notifications dispatched'));
        } catch (e) { next(e); }
    }

    /** POST /api/openclaw/trigger/absence-notify — notify recent absences (Admin only) */
    async triggerAbsenceNotify(_req: Request, res: Response, next: NextFunction) {
        try {
            const summary = await runAbsenceNotification();
            res.json(successResponse(summary, 'Absence notifications dispatched'));
        } catch (e) { next(e); }
    }

    /** POST /api/openclaw/trigger/overdue-scan — scan & notify overdue payments (Admin only) */
    async triggerOverdueScan(_req: Request, res: Response, next: NextFunction) {
        try {
            const summary = await runOverduePaymentScan();
            res.json(successResponse(summary, 'Overdue payment scan completed'));
        } catch (e) { next(e); }
    }
}

export const openclawController = new OpenClawController();
