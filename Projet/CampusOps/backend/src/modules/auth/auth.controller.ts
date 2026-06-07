import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { successResponse } from '../../utils/response';

// ============================================
// Auth Controller — Route Handlers
// ============================================

export class AuthController {
    /**
     * POST /api/auth/register
     */
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.register(req.body);

            res.status(201).json(successResponse(result, 'User registered successfully'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/login
     */
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.login(req.body);

            res.json(successResponse(result, 'Login successful'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/refresh
     */
    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refreshTokens(refreshToken);

            res.json(successResponse(result, 'Tokens refreshed successfully'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/logout
     * Requires authentication.
     */
    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            await authService.logout(req.user!.id);

            res.json(successResponse(null, 'Logged out successfully'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/auth/change-password
     * Requires authentication.
     */
    async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { currentPassword, newPassword } = req.body;
            await authService.changePassword(req.user!.id, currentPassword, newPassword);

            res.json(successResponse(null, 'Password changed successfully. Please login again.'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/auth/profile
     * Requires authentication.
     */
    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await authService.getProfile(req.user!.id);

            res.json(successResponse(user, 'Profile retrieved successfully'));
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/forgot-password
     * Public endpoint — sends a reset link to the user's email.
     */
    async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.forgotPassword(req.body.email);
            res.json(successResponse(result, result.message));
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/reset-password
     * Public endpoint — applies the new password using a valid reset token.
     */
    async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { token, password } = req.body;
            const result = await authService.resetPassword(token, password);
            res.json(successResponse(result, result.message));
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();
