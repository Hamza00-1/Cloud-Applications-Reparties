// ============================================
// CampusOps — Email Service (Nodemailer)
// ============================================
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../middleware/logger';

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize the SMTP transporter.
 * Only creates a real transport if SMTP_HOST is configured;
 * otherwise it stays null and sendEmail becomes a no-op that logs a warning.
 */
function getTransporter(): nodemailer.Transporter | null {
    if (transporter) return transporter;

    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
        logger.warn('📧 SMTP not configured — email notifications will be skipped. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env');
        return null;
    }

    transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_SECURE || false,
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
        },
    });

    logger.info(`📧 SMTP transport ready → ${env.SMTP_HOST}:${env.SMTP_PORT || 587}`);
    return transporter;
}

/**
 * Build a branded HTML email template.
 */
function buildHtmlEmail(title: string, body: string, type: string = 'info'): string {
    const typeColors: Record<string, string> = {
        info: '#3B82F6',
        alert: '#EF4444',
        reminder: '#F59E0B',
        success: '#22C55E',
    };
    const color = typeColors[type] || '#3B82F6';

    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%);border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
      <div style="color:white;font-size:24px;font-weight:800;letter-spacing:-0.5px;">CampusOps</div>
      <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">University OS</div>
    </div>
    <!-- Body -->
    <div style="background:white;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
      <div style="display:inline-block;background:${color};color:white;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:16px;">${type}</div>
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;line-height:1.3;">${title}</h1>
      <div style="font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap;">${body}</div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <div style="text-align:center;">
        <a href="${env.APP_URL}" style="display:inline-block;background:${color};color:white;padding:10px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">Open CampusOps</a>
      </div>
    </div>
    <!-- Footer -->
    <div style="text-align:center;padding:20px;color:#9ca3af;font-size:11px;">
      © ${new Date().getFullYear()} CampusOps — UEMF. This is an automated notification.
    </div>
  </div>
</body>
</html>`;
}

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    body: string;
    type?: string;
}

/**
 * Send an email notification.
 * Returns true if sent successfully, false otherwise.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
    const t = getTransporter();
    if (!t) {
        logger.warn(`📧 Email skipped (SMTP not configured): "${opts.subject}" → ${Array.isArray(opts.to) ? opts.to.length + ' recipients' : opts.to}`);
        return false;
    }

    try {
        const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];
        const html = buildHtmlEmail(opts.subject, opts.body, opts.type || 'info');

        await t.sendMail({
            from: env.SMTP_FROM,
            to: recipients.join(', '),
            subject: `[CampusOps] ${opts.subject}`,
            html,
            text: `${opts.subject}\n\n${opts.body}\n\n---\nCampusOps — UEMF`,
        });

        logger.info(`📧 Email sent: "${opts.subject}" → ${recipients.length} recipient(s)`);
        return true;
    } catch (err: any) {
        logger.error(`📧 Email failed: ${err.message}`);
        return false;
    }
}

/**
 * Verify SMTP connection (call on startup).
 */
export async function verifyEmailConnection(): Promise<boolean> {
    const t = getTransporter();
    if (!t) return false;
    try {
        await t.verify();
        logger.info('📧 SMTP connection verified successfully');
        return true;
    } catch (err: any) {
        logger.warn(`📧 SMTP connection failed: ${err.message} — emails will be retried on send`);
        return false;
    }
}
