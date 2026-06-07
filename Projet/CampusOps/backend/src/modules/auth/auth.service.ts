import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../../utils/jwt';
import { ApiError } from '../../middleware/errorHandler';
import { AuthPayload } from '../../types';
import { RegisterInput, LoginInput } from './auth.schemas';
import { getRedisClient } from '../../config/redis';
import { sendEmail } from '../../services/email.service';
import { env } from '../../config/env';
import { logger } from '../../middleware/logger';
import crypto from 'crypto';

// ============================================
// Auth Service — Business Logic
// ============================================

export class AuthService {
    /**
     * Register a new user.
     * - Checks for duplicate email
     * - Validates branch exists
     * - Hashes password
     * - Creates user in DB
     * - Returns tokens
     */
    async register(input: RegisterInput) {
        // Check if email already exists
        const existing = await prisma.user.findUnique({
            where: { email: input.email },
        });

        if (existing) {
            throw ApiError.conflict('A user with this email already exists');
        }

        // Verify branch exists
        const branch = await prisma.branch.findUnique({
            where: { id: input.branchId },
        });

        if (!branch) {
            throw ApiError.badRequest('Invalid branch ID — branch does not exist');
        }

        // Hash password
        const passwordHash = await hashPassword(input.password);

        // Create user
        const user = await prisma.user.create({
            data: {
                name: input.name,
                email: input.email,
                passwordHash,
                role: input.role,
                branchId: input.branchId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                branchId: true,
                createdAt: true,
            },
        });

        // Generate tokens
        const payload: AuthPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            branchId: user.branchId,
        };

        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(user.id);

        // Store HASHED refresh token in DB (never store raw tokens)
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashToken(refreshToken) },
        });

        return {
            user,
            accessToken,
            refreshToken,
        };
    }

    /**
     * Login with email and password.
     * - Finds user by email
     * - Compares password
     * - Returns tokens
     */
    async login(input: LoginInput) {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email: input.email },
        });

        if (!user) {
            throw ApiError.unauthorized('Invalid email or password');
        }

        // Compare password
        const isValid = await comparePassword(input.password, user.passwordHash);

        if (!isValid) {
            throw ApiError.unauthorized('Invalid email or password');
        }

        // Generate tokens
        const payload: AuthPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            branchId: user.branchId,
        };

        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(user.id);

        // Store HASHED refresh token in DB (never store raw tokens)
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashToken(refreshToken) },
        });

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                branchId: user.branchId,
            },
            accessToken,
            refreshToken,
        };
    }

    /**
     * Refresh tokens using a valid refresh token.
     * - Verifies the refresh token
     * - Checks it matches the stored one (rotation)
     * - Issues new access + refresh tokens
     */
    async refreshTokens(refreshToken: string) {
        // Verify the refresh token
        let userId: string;
        try {
            userId = verifyRefreshToken(refreshToken);
        } catch {
            throw ApiError.unauthorized('Invalid or expired refresh token');
        }

        // Find the user and verify stored token hash matches
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.refreshToken !== hashToken(refreshToken)) {
            // Token rotation: if stored hash doesn't match,
            // it might be stolen. Invalidate all tokens.
            if (user) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { refreshToken: null },
                });
            }
            throw ApiError.unauthorized('Refresh token has been revoked');
        }

        // Generate new tokens (rotation)
        const payload: AuthPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            branchId: user.branchId,
        };

        const newAccessToken = signAccessToken(payload);
        const newRefreshToken = signRefreshToken(user.id);

        // Update stored refresh token hash
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashToken(newRefreshToken) },
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }

    /**
     * Logout — Invalidate the refresh token.
     */
    async logout(userId: string) {
        await prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }

    /**
     * Change password for authenticated user.
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        // Verify current password
        const isValid = await comparePassword(currentPassword, user.passwordHash);
        if (!isValid) {
            throw ApiError.unauthorized('Current password is incorrect');
        }

        // Hash and save new password
        const passwordHash = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash, refreshToken: null }, // Force re-login
        });
    }

    /**
     * Get current user profile (from JWT payload + DB).
     */
    async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                branchId: true,
                telegramChatId: true,
                createdAt: true,
                updatedAt: true,
                branch: {
                    select: { name: true, location: true },
                },
                studentGroups: {
                    select: {
                        group: { select: { id: true, name: true } },
                    },
                },
            },
        });

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        return user;
    }
    /**
     * Forgot password — generate a reset token and email it to the user.
     * Uses Redis to store token with 15 minute TTL.
     */
    async forgotPassword(email: string) {
        // Find user — always return success to avoid email enumeration
        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            const redis = getRedisClient();
            // Store hashed token in Redis keyed by userId, expire in 15 min
            await redis.setex(`pwd_reset:${token}`, 900, user.id);

            const loginUrl = env.APP_URL?.endsWith('.html') ? env.APP_URL : `${env.APP_URL}/CampusOps.html`;
            const resetUrl = `${loginUrl}?reset_token=${token}`;

            sendEmail({
                to: user.email,
                subject: 'CampusOps — Reset your password',
                body: `Hello ${user.name},\n\nYou requested a password reset.\n\nClick the link below to set a new password (valid for 15 minutes):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.\n\nBest regards,\nCampusOps Administration`,
                type: 'info',
            }).catch(() => {});

            logger.info(`🔑 Password reset token sent to ${email}`);
        }

        // Always return the same response (don't reveal whether email exists)
        return { message: 'If this email exists, a reset link has been sent.' };
    }

    /**
     * Reset password — validate the token from Redis and update password.
     */
    async resetPassword(token: string, newPassword: string) {
        const redis = getRedisClient();
        const userId = await redis.get(`pwd_reset:${token}`);

        if (!userId) {
            throw ApiError.badRequest('Reset token is invalid or has expired.');
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw ApiError.notFound('User not found');

        const passwordHash = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash, refreshToken: null }, // Force re-login everywhere
        });

        // Invalidate the token immediately (one-time use)
        await redis.del(`pwd_reset:${token}`);

        logger.info(`🔑 Password reset successful for userId=${userId}`);
        return { message: 'Password has been reset successfully. Please login.' };
    }
}

// Singleton export
export const authService = new AuthService();
