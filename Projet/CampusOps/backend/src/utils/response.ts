// ============================================
// Standard API Response Helpers
// ============================================
// Ensures ALL API responses have a consistent shape.
// ============================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export function successResponse<T>(data: T, message = 'Success'): ApiResponse<T> {
    return {
        success: true,
        message,
        data,
    };
}

export function paginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success'
): ApiResponse<T[]> {
    return {
        success: true,
        message,
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
