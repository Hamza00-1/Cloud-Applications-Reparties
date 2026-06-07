import { requireRole, requireOwnerOrAdmin } from '../../src/middleware/rbac';
import { ApiError } from '../../src/middleware/errorHandler';
import { Role } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';

function makeReq(user?: { id: string; role: Role }, params: Record<string, string> = {}): Request {
    return { user, params } as unknown as Request;
}

const res = {} as Response;

describe('middleware/rbac', () => {
    describe('requireRole', () => {
        it('allows a user whose role matches one of the allowed roles', () => {
            const mw = requireRole('Admin', 'Scolarite');
            const next = jest.fn() as unknown as NextFunction;
            mw(makeReq({ id: 'u1', role: 'Admin' as Role }), res, next);
            expect(next).toHaveBeenCalledWith();
        });

        it('throws 403 ApiError when role does not match', () => {
            const mw = requireRole('Admin');
            expect(() => mw(makeReq({ id: 'u1', role: 'Etudiant' as Role }), res, jest.fn() as any))
                .toThrow(ApiError);
        });

        it('throws 401 ApiError when user is missing', () => {
            const mw = requireRole('Admin');
            try {
                mw(makeReq(undefined), res, jest.fn() as any);
                fail('Expected throw');
            } catch (e: any) {
                expect(e).toBeInstanceOf(ApiError);
                expect(e.statusCode).toBe(401);
            }
        });
    });

    describe('requireOwnerOrAdmin', () => {
        it('passes for an Admin even when the id does not match', () => {
            const mw = requireOwnerOrAdmin('id');
            const next = jest.fn() as unknown as NextFunction;
            mw(makeReq({ id: 'u1', role: 'Admin' as Role }, { id: 'other-user' }), res, next);
            expect(next).toHaveBeenCalledWith();
        });

        it('passes when the user id matches the param', () => {
            const mw = requireOwnerOrAdmin('id');
            const next = jest.fn() as unknown as NextFunction;
            mw(makeReq({ id: 'u1', role: 'Etudiant' as Role }, { id: 'u1' }), res, next);
            expect(next).toHaveBeenCalledWith();
        });

        it('throws 403 when neither owner nor admin', () => {
            const mw = requireOwnerOrAdmin('id');
            expect(() =>
                mw(makeReq({ id: 'u1', role: 'Etudiant' as Role }, { id: 'u2' }), res, jest.fn() as any)
            ).toThrow(ApiError);
        });
    });
});
