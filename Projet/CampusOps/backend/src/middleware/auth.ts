import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from './errorHandler';
import { logger } from './logger';

// ============================================
// JWT Authentication Middleware
// ============================================
// Extracts the Bearer token from the Authorization header,
// verifies it, and attaches the decoded user to req.user.
// If no token or invalid token, throws 401.
// ============================================

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('Missing or invalid Authorization header');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw ApiError.unauthorized('Token not provided');
        }

        // Verify and decode the JWT
        const payload = verifyAccessToken(token);

        // Attach user payload to request
        req.user = payload;

        next();
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            next(error);
            return;
        }

        // JWT verification errors (expired, malformed, etc.)
        const message = error instanceof Error ? error.message : 'Invalid token';
        logger.warn(`Auth failed: ${message}`);
        next(ApiError.unauthorized('Invalid or expired token'));
    }
}
