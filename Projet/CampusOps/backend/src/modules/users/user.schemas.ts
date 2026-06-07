import { z } from 'zod';

export const createUserSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[!@#$%^&*(),.?":{}|<>]/),
    role: z.enum(['Admin', 'Scolarite', 'Enseignant', 'Etudiant']).default('Etudiant'),
    branchId: z.string().uuid(),
});

export const updateUserSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    role: z.enum(['Admin', 'Scolarite', 'Enseignant', 'Etudiant']).optional(),
    branchId: z.string().uuid().optional(),
});

export const userIdParam = z.object({ id: z.string().uuid() });
export const userQuerySchema = z.object({
    role: z.enum(['Admin', 'Scolarite', 'Enseignant', 'Etudiant']).optional(),
    branchId: z.string().uuid().optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(20),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
