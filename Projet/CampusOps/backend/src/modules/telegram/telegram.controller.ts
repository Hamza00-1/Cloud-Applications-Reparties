// ============================================
// CampusOps — Telegram Controller
// ============================================
import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../../config/redis';
import { prisma } from '../../config/database';
import { sendTelegramMessage, isTelegramConfigured, httpsPost } from '../../services/telegram.service';
import { successResponse } from '../../utils/response';
import { ApiError } from '../../middleware/errorHandler';
import { env } from '../../config/env';
import { logger } from '../../middleware/logger';

const TELEGRAM_API = 'https://api.telegram.org/bot';
const CODE_TTL_SECONDS = 300; // 5 minutes

/**
 * POST /api/telegram/webhook
 * Receives updates from Telegram (set via setWebhook or via polling).
 * When a user sends /start, we generate a link code and reply with it.
 */
export async function handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
        const update = req.body;
        const message = update?.message;

        if (!message || !message.text) {
            res.json({ ok: true }); return;
        }

        const chatId = String(message.chat.id);
        const text: string = message.text.trim();
        const firstName = message.from?.first_name || 'there';

        // Helper: find linked user
        const getLinkedUser = async () => {
            return prisma.user.findFirst({
                where: { telegramChatId: chatId },
                select: { id: true, name: true, email: true, role: true },
            });
        };

        // Helper: format time
        const fmtTime = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' });
        const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Casablanca' });

        if (text === '/start' || text.startsWith('/start ')) {
            const code = String(Math.floor(100000 + Math.random() * 900000));
            const redis = getRedisClient();
            await redis.setex(`tg_link:${code}`, CODE_TTL_SECONDS, chatId);

            const reply =
                `👋 Hello ${firstName}!\n\n` +
                `Welcome to *CampusOps Bot*.\n\n` +
                `Your link code is:\n\n` +
                `🔑 \`${code}\`\n\n` +
                `Paste this code in the *Settings → Telegram* section of your CampusOps account within *5 minutes*.\n\n` +
                `_This code expires in 5 minutes._`;

            await sendTelegramMessage(chatId, reply);
            logger.info(`🤖 Telegram link code ${code} sent to chatId=${chatId}`);

        } else if (text === '/help') {
            await sendTelegramMessage(chatId,
                `*CampusOps Bot Commands*\n\n` +
                `📋 /today — Planning du jour\n` +
                `📅 /week — Planning de la semaine\n` +
                `❌ /absence — Absences récentes\n` +
                `📊 /progress — Avancement des modules\n` +
                `🔗 /start — Lier votre compte\n` +
                `ℹ️ /status — Vérifier la liaison\n` +
                `❓ /help — Ce message\n\n` +
                `_Vous devez d'abord lier votre compte avec /start._`
            );

        } else if (text === '/status') {
            const user = await getLinkedUser();
            if (user) {
                await sendTelegramMessage(chatId, `✅ Compte lié à *${user.name}* (${user.email}).\nRôle: ${user.role}`);
            } else {
                await sendTelegramMessage(chatId, `❌ Ce Telegram n'est lié à aucun compte CampusOps.\n\nEnvoyez /start pour obtenir un code.`);
            }

        } else if (text === '/today') {
            const user = await getLinkedUser();
            if (!user) { await sendTelegramMessage(chatId, `❌ Compte non lié. Envoyez /start d'abord.`); res.json({ ok: true }); return; }

            const today = new Date(); today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
            const where: any = { startTime: { gte: today, lt: tomorrow } };

            if (user.role === 'Enseignant') where.teacherId = user.id;
            if (user.role === 'Etudiant') {
                const groups = await prisma.groupStudent.findMany({ where: { studentId: user.id }, select: { groupId: true } });
                where.groupId = { in: groups.map(g => g.groupId) };
            }

            const sessions = await prisma.planning.findMany({
                where,
                include: { module: { select: { name: true } }, group: { select: { name: true } }, teacher: { select: { name: true } } },
                orderBy: { startTime: 'asc' },
            });

            if (sessions.length === 0) {
                await sendTelegramMessage(chatId, `📋 *Planning du jour*\n_${fmtDate(today)}_\n\n🎉 Aucune séance aujourd'hui !`);
            } else {
                let msg = `📋 *Planning du jour*\n_${fmtDate(today)}_\n\n`;
                for (const s of sessions) {
                    msg += `⏰ ${fmtTime(s.startTime)} → ${fmtTime(s.endTime)}\n`;
                    msg += `📚 ${s.module.name}\n`;
                    msg += `👥 ${s.group.name} — 🏫 ${s.room || 'TBD'}\n`;
                    msg += `👨‍🏫 ${s.teacher.name}\n\n`;
                }
                await sendTelegramMessage(chatId, msg);
            }

        } else if (text === '/week') {
            const user = await getLinkedUser();
            if (!user) { await sendTelegramMessage(chatId, `❌ Compte non lié. Envoyez /start d'abord.`); res.json({ ok: true }); return; }

            const now = new Date();
            const monday = new Date(now); monday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); monday.setHours(0, 0, 0, 0);
            const sunday = new Date(monday); sunday.setDate(monday.getDate() + 7);
            const where: any = { startTime: { gte: monday, lt: sunday } };

            if (user.role === 'Enseignant') where.teacherId = user.id;
            if (user.role === 'Etudiant') {
                const groups = await prisma.groupStudent.findMany({ where: { studentId: user.id }, select: { groupId: true } });
                where.groupId = { in: groups.map(g => g.groupId) };
            }

            const sessions = await prisma.planning.findMany({
                where,
                include: { module: { select: { name: true } }, group: { select: { name: true } }, teacher: { select: { name: true } } },
                orderBy: { startTime: 'asc' },
            });

            if (sessions.length === 0) {
                await sendTelegramMessage(chatId, `📅 *Planning de la semaine*\n\n🎉 Aucune séance cette semaine !`);
            } else {
                let msg = `📅 *Planning de la semaine* (${sessions.length} séances)\n\n`;
                let lastDay = '';
                for (const s of sessions) {
                    const day = fmtDate(s.startTime);
                    if (day !== lastDay) { msg += `\n📌 *${day}*\n`; lastDay = day; }
                    msg += `  ⏰ ${fmtTime(s.startTime)}–${fmtTime(s.endTime)} | ${s.module.name} | ${s.room || 'TBD'}\n`;
                }
                await sendTelegramMessage(chatId, msg);
            }

        } else if (text === '/absence') {
            const user = await getLinkedUser();
            if (!user) { await sendTelegramMessage(chatId, `❌ Compte non lié. Envoyez /start d'abord.`); res.json({ ok: true }); return; }

            // For students: their own absences. For teachers: absences they recorded.
            const where: any = {};
            if (user.role === 'Etudiant') where.studentId = user.id;
            if (user.role === 'Enseignant') {
                // Absences from their sessions
                const mySessions = await prisma.planning.findMany({ where: { teacherId: user.id }, select: { id: true } });
                where.planningId = { in: mySessions.map(s => s.id) };
            }

            const absences = await prisma.absence.findMany({
                where,
                include: {
                    student: { select: { name: true } },
                    planning: { include: { module: { select: { name: true } } } },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });

            // Monthly stats
            const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
            const monthCount = await prisma.absence.count({
                where: { ...where, createdAt: { gte: monthStart } },
            });

            if (absences.length === 0) {
                await sendTelegramMessage(chatId, `❌ *Absences*\n\n✅ Aucune absence enregistrée !`);
            } else {
                let msg = `❌ *Absences récentes* (${monthCount} ce mois)\n\n`;
                for (const a of absences) {
                    const statusIcon = a.status === 'Absent' ? '🔴' : a.status === 'Late' ? '🟡' : '🟢';
                    msg += `${statusIcon} ${a.student.name} — ${a.planning.module.name}\n`;
                    msg += `   ${a.status}${a.justified ? ' ✅ Justifié' : ''} — ${fmtDate(a.createdAt)}\n\n`;
                }
                await sendTelegramMessage(chatId, msg);
            }

        } else if (text === '/progress') {
            const user = await getLinkedUser();
            if (!user) { await sendTelegramMessage(chatId, `❌ Compte non lié. Envoyez /start d'abord.`); res.json({ ok: true }); return; }

            // Get groups the user belongs to (or all for admin/scolarite)
            let groupIds: string[] = [];
            if (user.role === 'Etudiant') {
                const gs = await prisma.groupStudent.findMany({ where: { studentId: user.id }, select: { groupId: true } });
                groupIds = gs.map(g => g.groupId);
            } else if (user.role === 'Enseignant') {
                // Get groups from their planning sessions
                const sessions = await prisma.planning.findMany({ where: { teacherId: user.id }, select: { groupId: true } });
                groupIds = [...new Set(sessions.map(s => s.groupId))];
            } else {
                // Admin/Scolarite: all groups
                const allGroups = await prisma.group.findMany({ select: { id: true } });
                groupIds = allGroups.map(g => g.id);
            }

            const progress = await prisma.progress.findMany({
                where: { groupId: { in: groupIds } },
                include: { module: { select: { name: true } }, group: { select: { name: true } } },
                orderBy: { percentage: 'desc' },
            });

            if (progress.length === 0) {
                await sendTelegramMessage(chatId, `📊 *Avancement*\n\nAucune donnée d'avancement disponible.`);
            } else {
                let msg = `📊 *Avancement des modules*\n\n`;
                for (const p of progress) {
                    const bar = '█'.repeat(Math.round(p.percentage / 10)) + '░'.repeat(10 - Math.round(p.percentage / 10));
                    msg += `${p.module.name}\n`;
                    msg += `${bar} ${p.percentage}% — ${p.group.name}\n\n`;
                }
                await sendTelegramMessage(chatId, msg);
            }

        } else {
            await sendTelegramMessage(chatId,
                `Je comprends uniquement les commandes.\n\nEnvoyez /help pour la liste complète.`
            );
        }

        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/telegram/link
 * Body: { code: "123456" }
 * The authenticated user submits the code they received from the bot.
 * Backend validates the code → saves chatId to user record → sends confirmation.
 */
export async function linkAccount(req: Request, res: Response, next: NextFunction) {
    try {
        const { code } = req.body;
        if (!code || !/^\d{6}$/.test(String(code))) {
            throw ApiError.badRequest('Invalid code format. Code must be 6 digits.');
        }

        const redis = getRedisClient();
        const chatId = await redis.get(`tg_link:${String(code)}`);
        if (!chatId) {
            throw ApiError.badRequest('Code is invalid or has expired. Please send /start to the bot again.');
        }

        // Check if this chatId is already used by another user
        const alreadyLinked = await prisma.user.findFirst({
            where: { telegramChatId: chatId, NOT: { id: req.user!.id } },
            select: { id: true },
        });
        if (alreadyLinked) {
            await redis.del(`tg_link:${String(code)}`);
            throw ApiError.conflict('This Telegram account is already linked to another CampusOps user.');
        }

        // Save telegramChatId to the user
        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: { telegramChatId: chatId },
            select: { id: true, name: true, email: true, telegramChatId: true },
        });

        // Consume the code
        await redis.del(`tg_link:${String(code)}`);

        // Send confirmation message on Telegram
        await sendTelegramMessage(chatId,
            `✅ *Account linked successfully!*\n\n` +
            `Your CampusOps account (*${user.name}*) is now connected.\n\n` +
            `You will receive instant notifications here from now on. 🎉`
        );

        logger.info(`🤖 Telegram linked: userId=${user.id} → chatId=${chatId}`);
        res.json(successResponse(user, 'Telegram account linked successfully'));
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/telegram/unlink
 * Removes the telegramChatId from the authenticated user.
 */
export async function unlinkAccount(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { telegramChatId: true, name: true } });

        if (user?.telegramChatId) {
            // Notify them on Telegram before unlinking
            await sendTelegramMessage(user.telegramChatId,
                `ℹ️ Your Telegram has been *unlinked* from CampusOps.\n\nSend /start if you want to reconnect.`
            );
        }

        const updated = await prisma.user.update({
            where: { id: req.user!.id },
            data: { telegramChatId: null },
            select: { id: true, name: true, email: true, telegramChatId: true },
        });

        res.json(successResponse(updated, 'Telegram account unlinked'));
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/telegram/status
 * Returns whether the current user has Telegram linked.
 */
export async function getStatus(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { telegramChatId: true },
        });
        res.json(successResponse({
            linked: !!user?.telegramChatId,
            chatId: user?.telegramChatId || null,
            botConfigured: isTelegramConfigured(),
        }, 'Telegram status'));
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/telegram/test
 * Sends a test message to the authenticated user (must be linked).
 */
export async function sendTest(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { telegramChatId: true, name: true },
        });

        if (!user?.telegramChatId) {
            throw ApiError.badRequest('Telegram not linked. Please link your account first.');
        }

        const ok = await sendTelegramMessage(user.telegramChatId,
            `🔔 *Test notification from CampusOps*\n\nHello ${user.name}! Your Telegram notifications are working perfectly. ✅`
        );

        res.json(successResponse({ sent: ok }, ok ? 'Test message sent' : 'Failed to send — check bot token'));
    } catch (err) {
        next(err);
    }
}
