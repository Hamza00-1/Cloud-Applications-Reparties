import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { ZodError } from 'zod';

// ============================================
// Custom API Error Class
// ============================================
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(statusCode: number, message: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, ApiError.prototype);
    }

    // Factory methods for common errors
    static badRequest(message = 'Bad Request') {
        return new ApiError(400, message);
    }
    static unauthorized(message = 'Unauthorized') {
        return new ApiError(401, message);
    }
    static forbidden(message = 'Forbidden') {
        return new ApiError(403, message);
    }
    static notFound(message = 'Resource not found') {
        return new ApiError(404, message);
    }
    static conflict(message = 'Conflict') {
        return new ApiError(409, message);
    }
    static tooManyRequests(message = 'Too many requests') {
        return new ApiError(429, message);
    }
    static internal(message = 'Internal server error') {
        return new ApiError(500, message, false);
    }
    static serviceUnavailable(message = 'Service unavailable') {
        return new ApiError(503, message);
    }
}

// ============================================
// Centralized Error Handler Middleware
// ============================================
// Catches ALL errors thrown in the app and
// returns a consistent JSON error response.
// ============================================
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Handle Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }

    // Handle custom API errors
    if (err instanceof ApiError) {
        logger.warn(`ApiError: ${err.statusCode} — ${err.message}`);
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }

    // Handle unexpected errors
    logger.error('Unexpected error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
}

// ============================================
// 404 Not Found Handler
// ============================================
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
    next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}
