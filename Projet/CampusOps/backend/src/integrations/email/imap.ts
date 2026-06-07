// ============================================
// CampusOps — IMAP inbox reader (imapflow)
// ============================================
import { ImapFlow } from 'imapflow';
import { env } from '../../config/env';
import { logger } from '../../middleware/logger';

export interface InboxMessage {
    uid: number;
    from: string;
    to: string;
    subject: string;
    date: string;
    snippet: string;
    seen: boolean;
}

export function isImapConfigured(): boolean {
    const host = env.IMAP_HOST || env.SMTP_HOST;
    const user = env.IMAP_USER || env.SMTP_USER;
    const pass = env.IMAP_PASS || env.SMTP_PASS;
    return !!(host && user && pass);
}

function buildClient(): ImapFlow {
    const host = env.IMAP_HOST || env.SMTP_HOST!;
    const user = env.IMAP_USER || env.SMTP_USER!;
    const pass = env.IMAP_PASS || env.SMTP_PASS!;
    return new ImapFlow({
        host,
        port: env.IMAP_PORT,
        secure: env.IMAP_SECURE,
        auth: { user, pass },
        logger: false,
    });
}

function snippetOf(text: string | undefined, max = 240): string {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * Fetch the most recent messages from INBOX.
 * Returns lightweight envelope + short snippet — does not parse attachments.
 */
export async function fetchLatestMessages(limit = 20): Promise<InboxMessage[]> {
    if (!isImapConfigured()) {
        logger.warn('📬 IMAP not configured — fetchLatestMessages returning []');
        return [];
    }

    const client = buildClient();
    const messages: InboxMessage[] = [];

    try {
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        try {
            const status = await client.status('INBOX', { messages: true });
            const total = status.messages ?? 0;
            if (total === 0) return [];
            const from = Math.max(1, total - limit + 1);
            const range = `${from}:${total}`;

            for await (const msg of client.fetch(range, {
                uid: true,
                envelope: true,
                flags: true,
                bodyStructure: false,
                source: false,
                bodyParts: ['1'],
            })) {
                const env = msg.envelope;
                const fromAddr = env?.from?.[0];
                const toAddr = env?.to?.[0];
                const part = msg.bodyParts?.get('1');
                const text = part ? part.toString('utf-8') : '';
                messages.push({
                    uid: msg.uid,
                    from: fromAddr ? `${fromAddr.name || ''} <${fromAddr.address}>`.trim() : '',
                    to: toAddr ? toAddr.address || '' : '',
                    subject: env?.subject || '(no subject)',
                    date: (env?.date instanceof Date ? env.date.toISOString() : env?.date) || '',
                    snippet: snippetOf(text),
                    seen: msg.flags?.has('\\Seen') ?? false,
                });
            }
        } finally {
            lock.release();
        }
    } catch (err: any) {
        logger.error(`📬 IMAP fetch failed: ${err.message}`);
        throw err;
    } finally {
        try { await client.logout(); } catch { /* ignore */ }
    }

    // Newest first
    return messages.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Verify IMAP credentials by connecting and listing INBOX status.
 */
export async function verifyImapConnection(): Promise<boolean> {
    if (!isImapConfigured()) {
        logger.warn('📬 IMAP not configured — skipping verification');
        return false;
    }
    const client = buildClient();
    try {
        await client.connect();
        const status = await client.status('INBOX', { messages: true });
        logger.info(`📬 IMAP connected — INBOX has ${status.messages ?? 0} messages`);
        return true;
    } catch (err: any) {
        logger.warn(`📬 IMAP verification failed: ${err.message}`);
        return false;
    } finally {
        try { await client.logout(); } catch { /* ignore */ }
    }
}
