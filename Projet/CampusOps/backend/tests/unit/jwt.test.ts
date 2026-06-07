import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, hashToken } from '../../src/utils/jwt';
import { AuthPayload } from '../../src/types';

const payload: AuthPayload = {
    id: 'user-uuid-1',
    email: 'jane@example.com',
    role: 'Admin' as any,
    branchId: 'branch-uuid-1',
};

describe('utils/jwt', () => {
    describe('signAccessToken / verifyAccessToken', () => {
        it('signs and verifies a valid access token', () => {
            const token = signAccessToken(payload);
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);

            const decoded = verifyAccessToken(token);
            expect(decoded.id).toBe(payload.id);
            expect(decoded.email).toBe(payload.email);
            expect(decoded.role).toBe(payload.role);
            expect(decoded.branchId).toBe(payload.branchId);
        });

        it('rejects a tampered token', () => {
            const token = signAccessToken(payload);
            const tampered = token.slice(0, -4) + 'XXXX';
            expect(() => verifyAccessToken(tampered)).toThrow();
        });

        it('rejects an empty/garbage token', () => {
            expect(() => verifyAccessToken('not-a-jwt')).toThrow();
        });
    });

    describe('signRefreshToken / verifyRefreshToken', () => {
        it('returns the user id when verifying a refresh token it signed', () => {
            const token = signRefreshToken(payload.id);
            expect(verifyRefreshToken(token)).toBe(payload.id);
        });

        it('throws when verifying a token signed with the access secret', () => {
            const accessToken = signAccessToken(payload);
            expect(() => verifyRefreshToken(accessToken)).toThrow();
        });
    });

    describe('hashToken', () => {
        it('is deterministic', () => {
            const a = hashToken('refresh-xyz');
            const b = hashToken('refresh-xyz');
            expect(a).toBe(b);
        });

        it('produces a 64-char hex sha256 digest', () => {
            const out = hashToken('refresh-xyz');
            expect(out).toMatch(/^[a-f0-9]{64}$/);
        });

        it('changes when input changes', () => {
            expect(hashToken('a')).not.toBe(hashToken('b'));
        });
    });
});
