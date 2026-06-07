import { prisma } from '../../config/database';
import { ApiError } from '../../middleware/errorHandler';
import { CreateModuleInput, UpdateModuleInput } from './module.schemas';

export class ModuleService {
    async findAll(branchId?: string) {
        return prisma.module.findMany({
            where: branchId ? { branchId } : {},
            include: {
                branch: { select: { name: true } },
                _count: { select: { plannings: true, progress: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findById(id: string) {
        const mod = await prisma.module.findUnique({
            where: { id },
            include: {
                branch: { select: { name: true, location: true } },
                _count: { select: { plannings: true, progress: true } },
            },
        });
        if (!mod) throw ApiError.notFound('Module not found');
        return mod;
    }

    async create(data: CreateModuleInput) {
        const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
        if (!branch) throw ApiError.badRequest('Invalid branch ID');
        return prisma.module.create({ data });
    }

    async update(id: string, data: UpdateModuleInput) {
        await this.findById(id);
        if (data.branchId) {
            const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
            if (!branch) throw ApiError.badRequest('Invalid branch ID');
        }
        return prisma.module.update({ where: { id }, data });
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.module.delete({ where: { id } });
    }
}

export const moduleService = new ModuleService();
