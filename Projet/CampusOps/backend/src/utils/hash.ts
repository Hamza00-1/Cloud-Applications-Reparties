import bcrypt from 'bcrypt';
import { env } from '../config/env';

// ============================================
// Password Hashing Utilities (bcrypt)
// ============================================

/**
 * Hash a plaintext password using bcrypt.
 * Salt rounds come from env (default 12).
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 * Returns true if they match.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
