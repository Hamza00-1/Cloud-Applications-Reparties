import { prisma } from '../../config/database';
import { ApiError } from '../../middleware/errorHandler';
import { MarkAbsenceInput, MarkBulkInput, JustifyInput } from './absence.schemas';

export class AbsenceService {
    private readonly include = {
        session: { select: { id: true, startTime: true, endTime: true, room: true, module: { select: { name: true } } } },
        student: { select: { id: true, name: true, email: true } },
    } as const;

    async findAll(filters: { sessionId?: string; studentId?: string; status?: string }) {
        const where: any = {};
        if (filters.sessionId) where.sessionId = filters.sessionId;
        if (filters.studentId) where.studentId = filters.studentId;
        if (filters.status) where.status = filters.status;
        return prisma.absence.findMany({ where, include: this.include, orderBy: { createdAt: 'desc' } });
    }

    async findById(id: string) {
        const a = await prisma.absence.findUnique({ where: { id }, include: this.include });
        if (!a) throw ApiError.notFound('Absence record not found');
        return a;
    }

    async mark(data: MarkAbsenceInput) {
        const session = await prisma.planning.findUnique({ where: { id: data.sessionId } });
        if (!session) throw ApiError.badRequest('Session not found');
        const student = await prisma.user.findUnique({ where: { id: data.studentId } });
        if (!student || student.role !== 'Etudiant') throw ApiError.badRequest('Invalid student');

        // Upsert: update if exists, create if not
        const existing = await prisma.absence.findFirst({
            where: { sessionId: data.sessionId, studentId: data.studentId },
        });
        if (existing) {
            return prisma.absence.update({ where: { id: existing.id }, data: { status: data.status }, include: this.include });
        }
        return prisma.absence.create({ data, include: this.include });
    }

    async markBulk(data: MarkBulkInput) {
        const session = await prisma.planning.findUnique({ where: { id: data.sessionId } });
        if (!session) throw ApiError.badRequest('Session not found');

        const results = await Promise.all(
            data.records.map(r => this.mark({ sessionId: data.sessionId, studentId: r.studentId, status: r.status }))
        );
        return results;
    }

    async justify(id: string, data: JustifyInput) {
        await this.findById(id);
        return prisma.absence.update({ where: { id }, data, include: this.include });
    }

    async getStudentStats(studentId: string) {
        const [total, absent, late, present] = await Promise.all([
            prisma.absence.count({ where: { studentId } }),
            prisma.absence.count({ where: { studentId, status: 'Absent' } }),
            prisma.absence.count({ where: { studentId, status: 'Late' } }),
            prisma.absence.count({ where: { studentId, status: 'Present' } }),
        ]);
        return { studentId, total, present, absent, late, attendanceRate: total > 0 ? Math.round((present / total) * 100) : 100 };
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.absence.delete({ where: { id } });
    }
}

export const absenceService = new AbsenceService();
