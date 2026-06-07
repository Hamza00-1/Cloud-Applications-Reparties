import { fetchLatestMessages, isImapConfigured } from '../../integrations/email/imap';
import { sendEmail } from '../../integrations/email/smtp';
import { ApiError } from '../../middleware/errorHandler';
import { SendMailInput } from './mail.schemas';

export class MailService {
    async latest(limit: number) {
        if (!isImapConfigured()) {
            throw ApiError.serviceUnavailable('IMAP not configured on the server');
        }
        return fetchLatestMessages(limit);
    }

    async send(input: SendMailInput) {
        const ok = await sendEmail({
            to: input.to,
            subject: input.subject,
            body: input.body,
            type: input.type || 'info',
        });
        if (!ok) throw ApiError.badRequest('SMTP not configured or send failed — check server logs');
        return { delivered: true, to: input.to, subject: input.subject };
    }
}

export const mailService = new MailService();
