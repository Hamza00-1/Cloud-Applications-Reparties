import { prisma } from '../../config/database';
import { ApiError } from '../../middleware/errorHandler';
import { CreatePlanningInput, UpdatePlanningInput } from './planning.schemas';

export class PlanningService {
    private readonly include = {
        module: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true, email: true } },
        _count: { select: { absences: true } },
    } as const;

    async findAll(filters: { date?: string; teacherId?: string; groupId?: string }) {
        const where: any = {};
        if (filters.teacherId) where.teacherId = filters.teacherId;
        if (filters.groupId) where.groupId = filters.groupId;
        if (filters.date) {
            const d = new Date(filters.date);
            const next = new Date(d); next.setDate(next.getDate() + 1);
            where.startTime = { gte: d, lt: next };
        }
        return prisma.planning.findMany({ where, include: this.include, orderBy: { startTime: 'asc' } });
    }

    async findToday(userId: string, role: string) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        const where: any = { startTime: { gte: today, lt: tomorrow } };
        if (role === 'Enseignant') where.teacherId = userId;
        if (role === 'Etudiant') {
            const groups = await prisma.groupStudent.findMany({ where: { studentId: userId }, select: { groupId: true } });
            where.groupId = { in: groups.map(g => g.groupId) };
        }
        return prisma.planning.findMany({ where, include: this.include, orderBy: { startTime: 'asc' } });
    }

    async findWeek(userId: string, role: string) {
        const now = new Date();
        const monday = new Date(now); monday.setDate(now.getDate() - now.getDay() + 1); monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 7);
        const where: any = { startTime: { gte: monday, lt: sunday } };
        if (role === 'Enseignant') where.teacherId = userId;
        if (role === 'Etudiant') {
            const groups = await prisma.groupStudent.findMany({ where: { studentId: userId }, select: { groupId: true } });
            where.groupId = { in: groups.map(g => g.groupId) };
        }
        return prisma.planning.findMany({ where, include: this.include, orderBy: { startTime: 'asc' } });
    }

    async findById(id: string) {
        const p = await prisma.planning.findUnique({ where: { id }, include: this.include });
        if (!p) throw ApiError.notFound('Planning session not found');
        return p;
    }

    async create(data: CreatePlanningInput) {
        const [mod, group, teacher] = await Promise.all([
            prisma.module.findUnique({ where: { id: data.moduleId } }),
            prisma.group.findUnique({ where: { id: data.groupId } }),
            prisma.user.findUnique({ where: { id: data.teacherId } }),
        ]);
        if (!mod) throw ApiError.badRequest('Module not found');
        if (!group) throw ApiError.badRequest('Group not found');
        if (!teacher || teacher.role !== 'Enseignant') throw ApiError.badRequest('Teacher not found or user is not a teacher');
        return prisma.planning.create({
            data: { ...data, startTime: new Date(data.startTime), endTime: new Date(data.endTime) },
            include: this.include,
        });
    }

    async update(id: string, data: UpdatePlanningInput) {
        await this.findById(id);
        const updateData: any = { ...data };
        if (data.startTime) updateData.startTime = new Date(data.startTime);
        if (data.endTime) updateData.endTime = new Date(data.endTime);
        return prisma.planning.update({ where: { id }, data: updateData, include: this.include });
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.planning.delete({ where: { id } });
    }
}

export const planningService = new PlanningService();
