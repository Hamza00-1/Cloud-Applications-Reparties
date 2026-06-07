import { z } from 'zod';

export const createPaymentSchema = z.object({
    studentId: z.string().uuid(),
    planType: z.enum(['Inscription', 'Mensualite']),
    amount: z.number().positive('Amount must be positive'),
    status: z.enum(['Paid', 'Partial', 'Unpaid']).default('Unpaid'),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
});
export const updatePaymentSchema = z.object({
    status: z.enum(['Paid', 'Partial', 'Unpaid']).optional(),
    amount: z.number().positive().optional(),
});
export const paymentIdParam = z.object({ id: z.string().uuid() });
export const paymentQuerySchema = z.object({
    studentId: z.string().uuid().optional(),
    status: z.enum(['Paid', 'Partial', 'Unpaid']).optional(),
    planType: z.enum(['Inscription', 'Mensualite']).optional(),
    overdue: z.enum(['true', 'false']).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaymentQuery = z.infer<typeof paymentQuerySchema>;
