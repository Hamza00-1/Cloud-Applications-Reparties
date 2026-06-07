// ============================================
// Daily planning notifications — runs at 7 AM
// ============================================
// Builds today's schedule for every teacher and student
// (who has at least one session) and dispatches an in-app
// notification + optional email/telegram.
// ============================================
import { prisma } from '../../config/database';
import { logger } from '../../middleware/logger';
import { sendEmail } from '../../integrations/email/smtp';
import { sendTelegramMessage, buildTelegramMessage, isTelegramConfigured } from '../../services/telegram.service';

interface PlanningWithRefs {
    id: string;
    startTime: Date;
    endTime: Date;
    room: string;
    moduleId: string;
    groupId: string;
    teacherId: string;
    module: { name: string };
    group: { name: string };
    teacher: { id: string; name: string; email: string; telegramChatId: string | null };
}

function fmtTime(d: Date): string {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function buildBody(sessions: PlanningWithRefs[]): string {
    if (sessions.length === 0) return 'Aucune session prévue aujourd\'hui.';
    return sessions
        .map(s => `• ${fmtTime(s.startTime)}–${fmtTime(s.endTime)} — ${s.module.name} (${s.group.name}) @ ${s.room}`)
        .join('\n');
}

export interface DailyPlanningSummary {
    runAt: string;
    teachersNotified: number;
    studentsNotified: number;
    inappCreated: number;
    emailsSent: number;
    telegramSent: number;
    sessionCount: number;
}

export async function runDailyPlanningNotifications(): Promise<DailyPlanningSummary> {
    const summary: DailyPlanningSummary = {
        runAt: new Date().toISOString(),
        teachersNotified: 0,
        studentsNotified: 0,
        inappCreated: 0,
        emailsSent: 0,
        telegramSent: 0,
        sessionCount: 0,
    };

    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);

    const sessions = (await prisma.planning.findMany({
        where: { startTime: { gte: dayStart, lt: dayEnd } },
        include: {
            module: { select: { name: true } },
            group: { select: { name: true } },
            teacher: { select: { id: true, name: true, email: true, telegramChatId: true } },
        },
        orderBy: { startTime: 'asc' },
    })) as unknown as PlanningWithRefs[];

    summary.sessionCount = sessions.length;
    if (sessions.length === 0) {
        logger.info('📅 Daily planning job: no sessions scheduled today — nothing to send');
        return summary;
    }

    // ── Group sessions by teacher ──
    const byTeacher = new Map<string, PlanningWithRefs[]>();
    for (const s of sessions) {
        const arr = byTeacher.get(s.teacherId) || [];
        arr.push(s);
        byTeacher.set(s.teacherId, arr);
    }

    const teacherIds = Array.from(byTeacher.keys());
    const teacherUsers = await prisma.user.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, name: true, email: true, telegramChatId: true },
    });
    const teacherMap = new Map<string, typeof teacherUsers[number]>(
        teacherUsers.map((u): [string, typeof teacherUsers[number]] => [u.id, u])
    );

    // ── Group sessions by group (for students) ──
    const groupIds = Array.from(new Set(sessions.map(s => s.groupId)));
    const enrollments = await prisma.groupStudent.findMany({
        where: { groupId: { in: groupIds } },
        select: { groupId: true, studentId: true },
    });
    const studentsByGroup = new Map<string, string[]>();
    for (const e of enrollments) {
        const arr = studentsByGroup.get(e.groupId) || [];
        arr.push(e.studentId);
        studentsByGroup.set(e.groupId, arr);
    }

    // Aggregate sessions per student (a student may belong to multiple groups)
    const sessionsByStudent = new Map<string, PlanningWithRefs[]>();
    for (const s of sessions) {
        const students = studentsByGroup.get(s.groupId) || [];
        for (const sid of students) {
            const arr = sessionsByStudent.get(sid) || [];
            arr.push(s);
            sessionsByStudent.set(sid, arr);
        }
    }

    const studentIds = Array.from(sessionsByStudent.keys());
    const students = await prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, email: true, telegramChatId: true },
    });

    // ── Dispatch ──
    const dateLabel = dayStart.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const title = `Planning du ${dateLabel}`;

    // Teachers
    for (const t of teacherUsers) {
        const list = byTeacher.get(t.id) || [];
        const body = buildBody(list);

        await prisma.notification.create({
            data: { userId: t.id, title, content: body, type: 'reminder', channels: ['inapp'] },
        });
        summary.inappCreated++;
        summary.teachersNotified++;

        if (t.email) {
            const ok = await sendEmail({ to: t.email, subject: title, body, type: 'reminder' });
            if (ok) summary.emailsSent++;
        }
        if (isTelegramConfigured() && t.telegramChatId) {
            const ok = await sendTelegramMessage(t.telegramChatId, buildTelegramMessage(title, body, 'reminder'));
            if (ok) summary.telegramSent++;
        }
    }

    // Students
    for (const s of students) {
        const list = sessionsByStudent.get(s.id) || [];
        if (list.length === 0) continue;
        const body = buildBody(list);

        await prisma.notification.create({
            data: { userId: s.id, title, content: body, type: 'reminder', channels: ['inapp'] },
        });
        summary.inappCreated++;
        summary.studentsNotified++;

        if (s.email) {
            const ok = await sendEmail({ to: s.email, subject: title, body, type: 'reminder' });
            if (ok) summary.emailsSent++;
        }
        if (isTelegramConfigured() && s.telegramChatId) {
            const ok = await sendTelegramMessage(s.telegramChatId, buildTelegramMessage(title, body, 'reminder'));
            if (ok) summary.telegramSent++;
        }
    }

    logger.info(
        `📅 Daily planning job done: ${summary.sessionCount} sessions → ` +
        `${summary.teachersNotified} teachers + ${summary.studentsNotified} students notified ` +
        `(emails=${summary.emailsSent}, telegram=${summary.telegramSent})`
    );

    // Silence unused-var lint
    void teacherMap;
    return summary;
}
