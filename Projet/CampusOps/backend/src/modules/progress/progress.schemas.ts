import { z } from 'zod';

export const updateProgressSchema = z.object({
    moduleId: z.string().uuid(),
    groupId: z.string().uuid(),
    percentage: z.number().min(0).max(100),
});
export const progressQuerySchema = z.object({
    moduleId: z.string().uuid().optional(),
    groupId: z.string().uuid().optional(),
});
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
