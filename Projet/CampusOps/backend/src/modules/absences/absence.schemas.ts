import { z } from 'zod';

export const markAbsenceSchema = z.object({
    sessionId: z.string().uuid(),
    studentId: z.string().uuid(),
    status: z.enum(['Present', 'Absent', 'Late']),
});
export const markBulkAbsenceSchema = z.object({
    sessionId: z.string().uuid(),
    records: z.array(z.object({
        studentId: z.string().uuid(),
        status: z.enum(['Present', 'Absent', 'Late']),
    })).min(1),
});
export const justifyAbsenceSchema = z.object({
    justificationDocUrl: z.string().url().optional(),
    ocrTextExtracted: z.string().optional(),
});
export const absenceIdParam = z.object({ id: z.string().uuid() });
export const absenceQuerySchema = z.object({
    sessionId: z.string().uuid().optional(),
    studentId: z.string().uuid().optional(),
    status: z.enum(['Present', 'Absent', 'Late']).optional(),
});

export type MarkAbsenceInput = z.infer<typeof markAbsenceSchema>;
export type MarkBulkInput = z.infer<typeof markBulkAbsenceSchema>;
export type JustifyInput = z.infer<typeof justifyAbsenceSchema>;
