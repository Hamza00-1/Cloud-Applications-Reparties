import { prisma } from '../../config/database';
import { ApiError } from '../../middleware/errorHandler';
import { CreatePaymentInput, UpdatePaymentInput, PaymentQuery } from './payment.schemas';

export class PaymentService {
    private readonly include = {
        student: { select: { id: true, name: true, email: true } },
    } as const;

    async findAll(query: PaymentQuery) {
        const where: any = {};
        if (query.studentId) where.studentId = query.studentId;
        if (query.status) where.status = query.status;
        if (query.planType) where.planType = query.planType;
        if (query.overdue === 'true') {
            where.dueDate = { lt: new Date() };
            where.status = { not: 'Paid' };
        }
        return prisma.payment.findMany({ where, include: this.include, orderBy: { dueDate: 'asc' } });
    }

    async findById(id: string) {
        const p = await prisma.payment.findUnique({ where: { id }, include: this.include });
        if (!p) throw ApiError.notFound('Payment not found');
        return p;
    }

    async create(data: CreatePaymentInput) {
        const student = await prisma.user.findUnique({ where: { id: data.studentId } });
        if (!student || student.role !== 'Etudiant') throw ApiError.badRequest('Invalid student');
        return prisma.payment.create({
            data: { ...data, amount: data.amount, dueDate: new Date(data.dueDate) },
            include: this.include,
        });
    }

    async update(id: string, data: UpdatePaymentInput) {
        await this.findById(id);
        return prisma.payment.update({ where: { id }, data, include: this.include });
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.payment.delete({ where: { id } });
    }

    async getStudentSummary(studentId: string) {
        const payments = await prisma.payment.findMany({ where: { studentId }, orderBy: { dueDate: 'asc' } });
        const student = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true, email: true } });
        if (!student) throw ApiError.notFound('Student not found');

        const totalDue = payments.reduce((s, p) => s + Number(p.amount), 0);
        const totalPaid = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + Number(p.amount), 0);
        const overdue = payments.filter(p => p.status !== 'Paid' && new Date(p.dueDate) < new Date());

        return { student, totalDue, totalPaid, balance: totalDue - totalPaid, overdueCount: overdue.length, payments };
    }
}

export const paymentService = new PaymentService();
