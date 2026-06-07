import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { successResponse } from '../../utils/response';
import { sendEmail } from '../../services/email.service';

export class PaymentController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const query = {
                studentId: req.query.studentId as string | undefined,
                status: req.query.status as string | undefined,
                planType: req.query.planType as string | undefined,
                overdue: req.query.overdue as string | undefined,
            };
            res.json(successResponse(await paymentService.findAll(query as any), 'Payments retrieved'));
        } catch (e) { next(e); }
    }
    async findById(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await paymentService.findById(req.params.id as string), 'Payment retrieved')); } catch (e) { next(e); }
    }
    async create(req: Request, res: Response, next: NextFunction) {
        try { res.status(201).json(successResponse(await paymentService.create(req.body), 'Payment created')); } catch (e) { next(e); }
    }
    async update(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await paymentService.update(req.params.id as string, req.body), 'Payment updated')); } catch (e) { next(e); }
    }
    async delete(req: Request, res: Response, next: NextFunction) {
        try { await paymentService.delete(req.params.id as string); res.json(successResponse(null, 'Payment deleted')); } catch (e) { next(e); }
    }
    async getStudentSummary(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await paymentService.getStudentSummary(req.params.studentId as string), 'Payment summary')); } catch (e) { next(e); }
    }
    async sendReceipt(req: Request, res: Response, next: NextFunction) {
        try {
            const payment = await paymentService.findById(req.params.id as string);
            const student = (payment as any).student;
            if (!student?.email) throw new Error('Student email not found');
            const amount = Number(payment.amount).toLocaleString('fr-FR');
            const status = payment.status;
            const type = payment.planType;
            const due = new Date(payment.dueDate).toLocaleDateString('fr-FR');
            const body = `Bonjour ${student.name},\n\nVoici votre reçu de paiement CampusOps :\n\n📄 Type : ${type}\n💰 Montant : ${amount} MAD\n📅 Échéance : ${due}\n✅ Statut : ${status}\n\nSi vous avez des questions, contactez le service scolarité.\n\nCordialement,\nCampusOps — EIDIA`;
            const ok = await sendEmail({
                to: student.email,
                subject: `CampusOps — Reçu de paiement (${type} — ${amount} MAD)`,
                body,
                type: status === 'Paid' ? 'success' : 'alert',
            });
            res.json(successResponse({ sent: ok, to: student.email }, ok ? 'Receipt sent' : 'SMTP not configured — receipt logged'));
        } catch (e) { next(e); }
    }
}
export const paymentController = new PaymentController();
