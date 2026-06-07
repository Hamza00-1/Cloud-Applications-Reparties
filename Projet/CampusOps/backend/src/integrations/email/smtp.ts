// ============================================
// CampusOps — SMTP integration (thin re-export)
// ============================================
// Keeps the import paths from the roadmap stable
// (`src/integrations/email/smtp.ts`) while reusing
// the existing implementation in services/email.service.ts.
// ============================================
export {
    sendEmail,
    verifyEmailConnection,
    type SendEmailOptions,
} from '../../services/email.service';
