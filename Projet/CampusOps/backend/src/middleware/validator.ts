import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from './errorHandler';

// ============================================
// Request Validation Middleware Factory
// ============================================
// Usage:
//   router.post('/users', validate(createUserSchema), controller.create);
//
// The schema validates req.body, req.query, or req.params
// depending on what properties the schema defines.
// ============================================
interface ValidationSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query) as typeof req.query;
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            next();
        } catch (error) {
            next(error); // Will be caught by errorHandler (ZodError)
        }
    };
}
