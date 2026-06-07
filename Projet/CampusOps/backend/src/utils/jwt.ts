import jwt, { JwtPayload } from 'jsonwebtoken';
import { createHash } from 'crypto';
import { env } from '../config/env';
import { AuthPayload } from '../types';

// ============================================
// JWT Utilities — Sign, Verify, and Refresh
// ============================================

/**
 * Hash a refresh token for safe DB storage.
 * We never store the raw token — only the SHA-256 hash.
 * On verification, hash the incoming token and compare.
 */
export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

/**
 * Sign an access token (short-lived: 15m default).
 * Contains user id, email, role, and branchId.
 */
export function signAccessToken(payload: AuthPayload): string {
    return jwt.sign(
        { ...payload },
        env.JWT_ACCESS_SECRET,
        { expiresIn: env.JWT_ACCESS_EXPIRY, issuer: 'campusops-api', subject: payload.id } as jwt.SignOptions
    );
}

/**
 * Sign a refresh token (long-lived: 7d default).
 * Contains only the user id for minimal exposure.
 */
export function signRefreshToken(userId: string): string {
    return jwt.sign(
        { id: userId },
        env.JWT_REFRESH_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRY, issuer: 'campusops-api', subject: userId } as jwt.SignOptions
    );
}

/**
 * Verify an access token. Returns the decoded payload or throws.
 */
export function verifyAccessToken(token: string): AuthPayload {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: 'campusops-api',
    }) as JwtPayload & AuthPayload;

    return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        branchId: decoded.branchId,
    };
}

/**
 * Verify a refresh token. Returns the user id or throws.
 */
export function verifyRefreshToken(token: string): string {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: 'campusops-api',
    }) as JwtPayload & { id: string };

    return decoded.id;
}
