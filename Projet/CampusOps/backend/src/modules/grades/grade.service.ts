import { prisma } from '../../config/database';
import { ApiError } from '../../middleware/errorHandler';
import { CreateGradeInput, UpdateGradeInput, BulkCreateGradeInput } from './grade.schemas';

export class GradeService {
    private readonly include = {
        student: { select: { id: true, name: true, email: true } },
        module: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
    } as const;

    async findAll(filters: { studentId?: string; moduleId?: string; gradeType?: string; semester?: string }) {
        const where: any = {};
        if (filters.studentId) where.studentId = filters.studentId;
        if (filters.moduleId) where.moduleId = filters.moduleId;
        if (filters.gradeType) where.gradeType = filters.gradeType;
        if (filters.semester) where.semester = filters.semester;
        return prisma.grade.findMany({ where, include: this.include, orderBy: { createdAt: 'desc' } });
    }

    async findById(id: string) {
        const g = await prisma.grade.findUnique({ where: { id }, include: this.include });
        if (!g) throw ApiError.notFound('Grade not found');
        return g;
    }

    async create(data: CreateGradeInput, teacherId: string) {
        // Validate student exists and is a student
        const student = await prisma.user.findUnique({ where: { id: data.studentId } });
        if (!student || student.role !== 'Etudiant') throw ApiError.badRequest('Invalid student');

        // Validate module exists
        const mod = await prisma.module.findUnique({ where: { id: data.moduleId } });
        if (!mod) throw ApiError.badRequest('Module not found');

        // Check for duplicate (same student + module + gradeType + semester)
        const existing = await prisma.grade.findFirst({
            where: {
                studentId: data.studentId,
                moduleId: data.moduleId,
                gradeType: data.gradeType,
                semester: data.semester,
            },
        });
        if (existing) {
            // Update instead of creating duplicate
            return prisma.grade.update({
                where: { id: existing.id },
                data: { value: data.value, comment: data.comment, teacherId },
                include: this.include,
            });
        }

        return prisma.grade.create({
            data: { ...data, teacherId },
            include: this.include,
        });
    }

    async bulkCreate(data: BulkCreateGradeInput, teacherId: string) {
        const mod = await prisma.module.findUnique({ where: { id: data.moduleId } });
        if (!mod) throw ApiError.badRequest('Module not found');

        const results = await Promise.all(
            data.grades.map(g => this.create({
                studentId: g.studentId,
                moduleId: data.moduleId,
                gradeType: data.gradeType,
                semester: data.semester,
                value: g.value,
                comment: g.comment,
            }, teacherId))
        );
        return results;
    }

    async update(id: string, data: UpdateGradeInput) {
        await this.findById(id);
        return prisma.grade.update({ where: { id }, data, include: this.include });
    }

    async getStudentTranscript(studentId: string, semester?: string) {
        const where: any = { studentId };
        if (semester) where.semester = semester;

        const grades = await prisma.grade.findMany({
            where,
            include: this.include,
            orderBy: [{ moduleId: 'asc' }, { gradeType: 'asc' }],
        });

        // Group by module
        const byModule: Record<string, { module: any; grades: any[]; average: number }> = {};
        for (const g of grades) {
            const key = g.moduleId;
            if (!byModule[key]) byModule[key] = { module: g.module, grades: [], average: 0 };
            byModule[key].grades.push(g);
        }

        // Calculate average per module
        for (const key of Object.keys(byModule)) {
            const mg = byModule[key].grades;
            byModule[key].average = mg.reduce((sum, g) => sum + Number(g.value), 0) / mg.length;
        }

        const modules = Object.values(byModule);
        const overall = modules.length > 0
            ? modules.reduce((sum, m) => sum + m.average, 0) / modules.length
            : 0;

        return { studentId, semester: semester || 'all', modules, overall: Math.round(overall * 100) / 100 };
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.grade.delete({ where: { id } });
    }
}

export const gradeService = new GradeService();
