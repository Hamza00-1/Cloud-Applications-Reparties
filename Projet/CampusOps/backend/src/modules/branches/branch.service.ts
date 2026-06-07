import { prisma } from '../../config/database';
import { ApiError } from '../../middleware/errorHandler';
import { CreateBranchInput, UpdateBranchInput } from './branch.schemas';

// ============================================
// Branch Service — Business Logic
// ============================================

export class BranchService {
    async findAll() {
        return prisma.branch.findMany({
            include: {
                _count: { select: { users: true, modules: true, groups: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findById(id: string) {
        const branch = await prisma.branch.findUnique({
            where: { id },
            include: {
                _count: { select: { users: true, modules: true, groups: true } },
            },
        });
        if (!branch) throw ApiError.notFound('Branch not found');
        return branch;
    }

    async create(data: CreateBranchInput) {
        return prisma.branch.create({ data });
    }

    async update(id: string, data: UpdateBranchInput) {
        await this.findById(id);
        return prisma.branch.update({ where: { id }, data });
    }

    async delete(id: string) {
        await this.findById(id);
        const counts = await prisma.branch.findUnique({
            where: { id },
            include: { _count: { select: { users: true, modules: true, groups: true } } },
        });
        if (counts && (counts._count.users > 0 || counts._count.modules > 0 || counts._count.groups > 0)) {
            throw ApiError.conflict('Cannot delete branch with existing users, modules, or groups. Remove them first.');
        }
        return prisma.branch.delete({ where: { id } });
    }
}

export const branchService = new BranchService();
