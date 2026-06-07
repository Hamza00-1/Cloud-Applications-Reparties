import { prisma } from '../../config/database';
import { ApiError } from '../../middleware/errorHandler';
import { UpdateProgressInput } from './progress.schemas';

export class ProgressService {
    private readonly include = {
        module: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
    } as const;

    async findAll(filters: { moduleId?: string; groupId?: string }) {
        const where: any = {};
        if (filters.moduleId) where.moduleId = filters.moduleId;
        if (filters.groupId) where.groupId = filters.groupId;
        return prisma.progress.findMany({ where, include: this.include, orderBy: { updatedAt: 'desc' } });
    }

    async upsert(data: UpdateProgressInput, userId: string) {
        const [mod, group] = await Promise.all([
            prisma.module.findUnique({ where: { id: data.moduleId } }),
            prisma.group.findUnique({ where: { id: data.groupId } }),
        ]);
        if (!mod) throw ApiError.badRequest('Module not found');
        if (!group) throw ApiError.badRequest('Group not found');

        const existing = await prisma.progress.findFirst({
            where: { moduleId: data.moduleId, groupId: data.groupId },
        });

        if (existing) {
            return prisma.progress.update({
                where: { id: existing.id },
                data: { percentage: data.percentage, lastUpdatedById: userId },
                include: this.include,
            });
        }

        return prisma.progress.create({
            data: { moduleId: data.moduleId, groupId: data.groupId, percentage: data.percentage, lastUpdatedById: userId },
            include: this.include,
        });
    }

    async getGroupSummary(groupId: string) {
        const group = await prisma.group.findUnique({ where: { id: groupId } });
        if (!group) throw ApiError.notFound('Group not found');

        const progress = await prisma.progress.findMany({
            where: { groupId },
            include: { module: { select: { name: true } } },
            orderBy: { module: { name: 'asc' } },
        });

        const avg = progress.length > 0
            ? Math.round(progress.reduce((sum, p) => sum + p.percentage, 0) / progress.length)
            : 0;

        return { groupId, groupName: group.name, averageProgress: avg, modules: progress };
    }
}

export const progressService = new ProgressService();
