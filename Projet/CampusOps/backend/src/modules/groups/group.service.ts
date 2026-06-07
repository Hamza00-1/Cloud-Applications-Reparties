import { prisma } from '../../config/database';
import { ApiError } from '../../middleware/errorHandler';
import { CreateGroupInput, UpdateGroupInput } from './group.schemas';

export class GroupService {
    async findAll(branchId?: string) {
        return prisma.group.findMany({
            where: branchId ? { branchId } : {},
            include: {
                branch: { select: { name: true } },
                _count: { select: { students: true, plannings: true } },
            },
            orderBy: [{ academicYear: 'desc' }, { name: 'asc' }],
        });
    }

    async findById(id: string) {
        const group = await prisma.group.findUnique({
            where: { id },
            include: {
                branch: { select: { name: true } },
                students: {
                    include: { student: { select: { id: true, name: true, email: true, role: true } } },
                    orderBy: { student: { name: 'asc' } },
                },
                _count: { select: { plannings: true } },
            },
        });
        if (!group) throw ApiError.notFound('Group not found');
        return group;
    }

    async create(data: CreateGroupInput) {
        const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
        if (!branch) throw ApiError.badRequest('Invalid branch ID');
        return prisma.group.create({ data });
    }

    async update(id: string, data: UpdateGroupInput) {
        await this.findById(id);
        return prisma.group.update({ where: { id }, data });
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.group.delete({ where: { id } });
    }

    async enrollStudent(groupId: string, studentId: string) {
        await this.findById(groupId);
        const student = await prisma.user.findUnique({ where: { id: studentId } });
        if (!student) throw ApiError.notFound('Student not found');
        if (student.role !== 'Etudiant') throw ApiError.badRequest('Only students can be enrolled in groups');

        const existing = await prisma.groupStudent.findUnique({
            where: { groupId_studentId: { groupId, studentId } },
        });
        if (existing) throw ApiError.conflict('Student is already enrolled in this group');

        return prisma.groupStudent.create({
            data: { groupId, studentId },
            include: { student: { select: { id: true, name: true, email: true } } },
        });
    }

    async unenrollStudent(groupId: string, studentId: string) {
        const enrollment = await prisma.groupStudent.findUnique({
            where: { groupId_studentId: { groupId, studentId } },
        });
        if (!enrollment) throw ApiError.notFound('Student is not enrolled in this group');
        return prisma.groupStudent.delete({
            where: { groupId_studentId: { groupId, studentId } },
        });
    }
}

export const groupService = new GroupService();
