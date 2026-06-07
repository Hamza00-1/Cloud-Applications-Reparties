import { z } from 'zod';

export const createModuleSchema = z.object({
    name: z.string().min(2).max(200),
    description: z.string().max(2000).optional(),
    branchId: z.string().uuid(),
});
export const updateModuleSchema = createModuleSchema.partial();
export const moduleIdParam = z.object({ id: z.string().uuid() });
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
