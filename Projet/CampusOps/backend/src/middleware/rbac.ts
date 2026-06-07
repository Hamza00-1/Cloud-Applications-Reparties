import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from './errorHandler';

// ============================================
// Role-Based Access Control (RBAC) Middleware
// ============================================
// Usage:
//   router.get('/admin-only', authenticate, requireRole('Admin'), controller.list);
//   router.get('/staff', authenticate, requireRole('Admin', 'Scolarite'), controller.list);
//
// Must be used AFTER the authenticate middleware,
// which populates req.user.
// ============================================

/**
 * Creates middleware that checks if the authenticated user
 * has one of the allowed roles. If not, throws 403 Forbidden.
 */
export function requireRole(...allowedRoles: Role[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = req.user;

        if (!user) {
            throw ApiError.unauthorized('Authentication required');
        }

        if (!allowedRoles.includes(user.role as Role)) {
            throw ApiError.forbidden(
                `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${user.role}`
            );
        }

        next();
    };
}

/**
 * Middleware that allows access only to the resource owner
 * (the user whose ID matches the :id param) OR users with Admin role.
 */
export function requireOwnerOrAdmin(paramName = 'id') {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = req.user;

        if (!user) {
            throw ApiError.unauthorized('Authentication required');
        }

        const resourceId = req.params[paramName];

        if (user.role === 'Admin' || user.id === resourceId) {
            next();
            return;
        }

        throw ApiError.forbidden('Access denied. You can only access your own resources.');
    };
}
