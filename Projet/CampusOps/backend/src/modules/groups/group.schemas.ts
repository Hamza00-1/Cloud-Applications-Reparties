import { z } from 'zod';

export const createGroupSchema = z.object({
    name: z.string().min(2).max(200),
    academicYear: z.string().regex(/^\d{4}\/\d{4}$/, 'Format: 2025/2026'),
    branchId: z.string().uuid(),
});
export const updateGroupSchema = createGroupSchema.partial();
export const groupIdParam = z.object({ id: z.string().uuid() });
export const enrollStudentSchema = z.object({
    studentId: z.string().uuid('Invalid student ID'),
});
export const unenrollStudentSchema = z.object({
    studentId: z.string().uuid('Invalid student ID'),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
