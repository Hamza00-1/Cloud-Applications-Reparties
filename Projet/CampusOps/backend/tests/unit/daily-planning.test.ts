/**
 * Daily planning job — verifies the dispatch logic with mocked Prisma + channels.
 */

// Mock channels
jest.mock('../../src/integrations/email/smtp', () => ({
    sendEmail: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../src/services/telegram.service', () => ({
    sendTelegramMessage: jest.fn().mockResolvedValue(true),
    buildTelegramMessage: jest.fn((title: string, body: string) => `${title}\n${body}`),
    isTelegramConfigured: jest.fn().mockReturnValue(true),
}));

// Mock Prisma
const mockSession = {
    id: 'sess-1',
    moduleId: 'mod-1',
    groupId: 'grp-1',
    teacherId: 'teach-1',
    room: 'Lab Cyber',
    startTime: (() => { const d = new Date(); d.setHours(10, 0, 0, 0); return d; })(),
    endTime: (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; })(),
    module: { name: 'Distributed Apps' },
    group: { name: 'CS-G1' },
    teacher: { id: 'teach-1', name: 'Prof X', email: 'prof@x.ma', telegramChatId: '111' },
};
const notificationCreate = jest.fn().mockResolvedValue({});

jest.mock('../../src/config/database', () => ({
    prisma: {
        planning: { findMany: jest.fn().mockResolvedValue([mockSession]) },
        user: {
            findMany: jest.fn().mockImplementation(async ({ where }: any) => {
                const ids: string[] = where.id.in;
                if (ids.includes('teach-1')) {
                    return [{ id: 'teach-1', name: 'Prof X', email: 'prof@x.ma', telegramChatId: '111' }];
                }
                if (ids.includes('stud-1')) {
                    return [{ id: 'stud-1', email: 'stud@x.ma', telegramChatId: '222' }];
                }
                return [];
            }),
        },
        groupStudent: {
            findMany: jest.fn().mockResolvedValue([{ groupId: 'grp-1', studentId: 'stud-1' }]),
        },
        notification: { create: notificationCreate },
    },
}));

import { runDailyPlanningNotifications } from '../../src/integrations/openclaw/daily-planning.job';
import { sendEmail } from '../../src/integrations/email/smtp';
import { sendTelegramMessage } from '../../src/services/telegram.service';

describe('daily-planning.job', () => {
    it('dispatches in-app + email + telegram for teacher and student', async () => {
        const summary = await runDailyPlanningNotifications();

        expect(summary.sessionCount).toBe(1);
        expect(summary.teachersNotified).toBe(1);
        expect(summary.studentsNotified).toBe(1);
        expect(summary.inappCreated).toBe(2);   // 1 teacher + 1 student
        expect(summary.emailsSent).toBe(2);
        expect(summary.telegramSent).toBe(2);

        expect(notificationCreate).toHaveBeenCalledTimes(2);
        expect(sendEmail).toHaveBeenCalledTimes(2);
        expect(sendTelegramMessage).toHaveBeenCalledTimes(2);
    });
});
