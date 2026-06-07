import { z } from 'zod';

export const sendMailSchema = z.object({
    to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
    subject: z.string().min(1).max(255),
    body: z.string().min(1),
    type: z.enum(['info', 'alert', 'reminder', 'success']).optional(),
});

export const latestMailQuery = z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type SendMailInput = z.infer<typeof sendMailSchema>;
export type LatestMailQuery = z.infer<typeof latestMailQuery>;
