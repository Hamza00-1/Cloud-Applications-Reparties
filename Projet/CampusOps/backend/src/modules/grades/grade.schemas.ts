import { z } from 'zod';

export const createGradeSchema = z.object({
    studentId: z.string().uuid(),
    moduleId: z.string().uuid(),
    value: z.number().min(0).max(20),
    gradeType: z.enum(['Exam', 'TD', 'TP', 'Project']),
    semester: z.string().min(1).default('S1-2024'),
    comment: z.string().optional(),
});

export const updateGradeSchema = z.object({
    value: z.number().min(0).max(20).optional(),
    comment: z.string().optional(),
});

export const bulkCreateGradeSchema = z.object({
    moduleId: z.string().uuid(),
    gradeType: z.enum(['Exam', 'TD', 'TP', 'Project']),
    semester: z.string().min(1).default('S1-2024'),
    grades: z.array(z.object({
        studentId: z.string().uuid(),
        value: z.number().min(0).max(20),
        comment: z.string().optional(),
    })).min(1),
});

export const gradeIdParam = z.object({ id: z.string().uuid() });

export const gradeQuerySchema = z.object({
    studentId: z.string().uuid().optional(),
    moduleId: z.string().uuid().optional(),
    gradeType: z.enum(['Exam', 'TD', 'TP', 'Project']).optional(),
    semester: z.string().optional(),
});

export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
export type BulkCreateGradeInput = z.infer<typeof bulkCreateGradeSchema>;
