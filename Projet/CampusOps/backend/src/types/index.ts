// ============================================
// CampusOps — Type Definitions
// ============================================

import { Role } from '@prisma/client';

// Authenticated user payload attached to req.user
export interface AuthPayload {
    id: string;
    email: string;
    role: Role;
    branchId: string;
}

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

// Pagination query params
export interface PaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
