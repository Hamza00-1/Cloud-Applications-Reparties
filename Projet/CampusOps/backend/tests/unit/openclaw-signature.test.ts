/**
 * OpenClaw webhook HMAC verification — tests the controller's
 * signature check by exercising the route via a minimal Express app.
 */
import express from 'express';
import request from 'supertest';
import crypto from 'crypto';

process.env.OPENCLAW_WEBHOOK_SECRET = 'unit-test-secret';

// Mock the daily-planning job so the controller doesn't touch the DB
jest.mock('../../src/integrations/openclaw/daily-planning.job', () => ({
    runDailyPlanningNotifications: jest.fn().mockResolvedValue({ runAt: 'now', sessionCount: 0 }),
}));

import { openclawController } from '../../src/integrations/openclaw/openclaw.controller';

function buildApp() {
    const app = express();
    app.use(express.json());
    app.post('/webhook', (req, res, next) => openclawController.webhook(req, res, next));
    app.use((err: any, _req: any, res: any, _next: any) => {
        res.status(err.statusCode || 500).json({ message: err.message });
    });
    return app;
}

function sign(body: object): string {
    return crypto.createHmac('sha256', 'unit-test-secret').update(JSON.stringify(body)).digest('hex');
}

describe('OpenClaw webhook signature', () => {
    const app = buildApp();

    it('rejects requests with no signature header', async () => {
        const res = await request(app).post('/webhook').send({ event: 'health.ping' });
        expect(res.status).toBe(401);
    });

    it('rejects requests with a bad signature', async () => {
        const res = await request(app)
            .post('/webhook')
            .set('x-openclaw-signature', 'deadbeef')
            .send({ event: 'health.ping' });
        expect(res.status).toBe(401);
    });

    it('accepts requests with a valid HMAC signature', async () => {
        const body = { event: 'health.ping' };
        const res = await request(app)
            .post('/webhook')
            .set('x-openclaw-signature', sign(body))
            .send(body);
        expect(res.status).toBe(200);
        expect(res.body.data.event).toBe('health.ping');
    });

    it('dispatches the daily-planning job for the planning.daily.trigger event', async () => {
        const job = require('../../src/integrations/openclaw/daily-planning.job');
        const body = { event: 'planning.daily.trigger' };
        const res = await request(app)
            .post('/webhook')
            .set('x-openclaw-signature', sign(body))
            .send(body);
        expect(res.status).toBe(200);
        expect(job.runDailyPlanningNotifications).toHaveBeenCalled();
    });
});
