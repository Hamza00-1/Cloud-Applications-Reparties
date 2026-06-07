import { z } from 'zod';

export const createPlanningSchema = z.object({
    moduleId: z.string().uuid(),
    groupId: z.string().uuid(),
    teacherId: z.string().uuid(),
    room: z.string().min(1).max(100),
    startTime: z.string().datetime({ message: 'Invalid ISO datetime' }),
    endTime: z.string().datetime({ message: 'Invalid ISO datetime' }),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
    message: 'End time must be after start time',
    path: ['endTime'],
});

export const updatePlanningSchema = z.object({
    room: z.string().min(1).max(100).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
});

export const planningIdParam = z.object({ id: z.string().uuid() });
export const planningQuerySchema = z.object({
    date: z.string().optional(),
    teacherId: z.string().uuid().optional(),
    groupId: z.string().uuid().optional(),
});

export type CreatePlanningInput = z.infer<typeof createPlanningSchema>;
export type UpdatePlanningInput = z.infer<typeof updatePlanningSchema>;
