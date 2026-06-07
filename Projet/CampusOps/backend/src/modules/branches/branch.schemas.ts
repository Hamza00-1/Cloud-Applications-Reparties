import { z } from 'zod';

// ============================================
// Branch Validation Schemas
// ============================================

export const createBranchSchema = z.object({
    name: z.string().min(2, 'Branch name must be at least 2 characters').max(200),
    location: z.string().min(2, 'Location must be at least 2 characters').max(500),
});

export const updateBranchSchema = createBranchSchema.partial();

export const branchIdParam = z.object({
    id: z.string().uuid('Invalid branch ID'),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
