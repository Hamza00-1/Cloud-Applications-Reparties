// ============================================
// CampusOps — Telegram Routes
// ============================================
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import {
    handleWebhook,
    linkAccount,
    unlinkAccount,
    getStatus,
    sendTest,
} from './telegram.controller';

const router = Router();

const linkSchema = z.object({ code: z.string().length(6).regex(/^\d{6}$/) });

/**
 * POST /api/telegram/webhook
 * Receives updates from Telegram (no auth — Telegram calls this).
 */
router.post('/webhook', handleWebhook);

/**
 * GET /api/telegram/status
 * Returns whether the authenticated user has Telegram linked.
 */
router.get('/status', authenticate, getStatus);

/**
 * POST /api/telegram/link
 * Body: { code: "123456" }
 * Links the authenticated user's account to the Telegram chatId associated with the code.
 */
router.post('/link', authenticate, validate({ body: linkSchema }), linkAccount);

/**
 * POST /api/telegram/unlink
 * Removes the Telegram link from the authenticated user.
 */
router.post('/unlink', authenticate, unlinkAccount);

/**
 * POST /api/telegram/test
 * Sends a test message to the authenticated user's linked Telegram.
 */
router.post('/test', authenticate, sendTest);

export default router;
