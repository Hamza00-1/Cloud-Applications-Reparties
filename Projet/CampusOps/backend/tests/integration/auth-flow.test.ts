/**
 * Auth flow integration test — exercises register → login → /auth/me
 * via supertest against the real Express app. Prisma is mocked at the
 * module level so this test runs without a database.
 */

// ─── Mock Prisma before app imports ───
const dbState: {
    users: Map<string, any>;
    branches: Map<string, any>;
} = {
    users: new Map(),
    branches: new Map<string, any>([
        ['11111111-1111-1111-1111-111111111111', { id: '11111111-1111-1111-1111-111111111111', name: 'EIDIA', location: 'UEMF' }],
    ]),
};

jest.mock('../../src/config/database', () => {
    const userFns = {
        findUnique: jest.fn(async ({ where, select }: any) => {
            for (const u of dbState.users.values()) {
                const match =
                    (where.id && u.id === where.id) ||
                    (where.email && u.email === where.email);
                if (!match) continue;
                if (select) {
                    const out: any = {};
                    for (const k of Object.keys(select)) {
                        if (k === 'branch') out.branch = dbState.branches.get(u.branchId);
                        else if (k === 'studentGroups') out.studentGroups = [];
                        else if (select[k]) out[k] = (u as any)[k];
                    }
                    return out;
                }
                return u;
            }
            return null;
        }),
        create: jest.fn(async ({ data, select }: any) => {
            const id = `user-${dbState.users.size + 1}`;
            const u = { id, refreshToken: null, ...data, createdAt: new Date(), updatedAt: new Date() };
            dbState.users.set(id, u);
            if (select) {
                const out: any = {};
                for (const k of Object.keys(select)) if (select[k]) out[k] = (u as any)[k];
                return out;
            }
            return u;
        }),
        update: jest.fn(async ({ where, data }: any) => {
            const u = dbState.users.get(where.id);
            if (!u) throw new Error('user not found in mock');
            Object.assign(u, data);
            return u;
        }),
    };
    const branchFns = {
        findUnique: jest.fn(async ({ where }: any) => dbState.branches.get(where.id) ?? null),
    };
    return {
        prisma: {
            user: userFns,
            branch: branchFns,
            $connect: jest.fn(),
            $disconnect: jest.fn(),
        },
    };
});

// Redis stub
jest.mock('../../src/config/redis', () => ({
    connectRedis: jest.fn(),
    disconnectRedis: jest.fn(),
    redis: { get: jest.fn(), set: jest.fn() },
}));

import request from 'supertest';
import app from '../../src/app';

describe('Auth flow', () => {
    beforeEach(() => {
        // keep the seeded branch, drop users
        dbState.users.clear();
    });

    it('rejects login with no body', async () => {
        const res = await request(app).post('/api/auth/login').send({});
        expect(res.status).toBe(400);
    });

    it('register → login → me happy path', async () => {
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Jane Test',
                email: 'jane@test.local',
                password: 'Test@1234',
                role: 'Etudiant',
                branchId: '11111111-1111-1111-1111-111111111111',
            });
        expect(registerRes.status).toBe(201);
        expect(registerRes.body.data.accessToken).toBeDefined();
        expect(registerRes.body.data.user.email).toBe('jane@test.local');

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'jane@test.local', password: 'Test@1234' });
        expect(loginRes.status).toBe(200);
        const token = loginRes.body.data.accessToken;
        expect(token).toBeDefined();

        const meRes = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`);
        expect(meRes.status).toBe(200);
        expect(meRes.body.data.email).toBe('jane@test.local');
    });

    it('rejects login with wrong password', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'John',
                email: 'john@test.local',
                password: 'Right@1234',
                role: 'Etudiant',
                branchId: '11111111-1111-1111-1111-111111111111',
            });
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'john@test.local', password: 'Wrong@9999' });
        expect(res.status).toBe(401);
    });

    it('rejects access to /auth/me without a token', async () => {
        const res = await request(app).get('/api/auth/profile');
        expect(res.status).toBe(401);
    });

    it('rejects access to /auth/me with a garbage token', async () => {
        const res = await request(app).get('/api/auth/profile').set('Authorization', 'Bearer abc.def.ghi');
        expect(res.status).toBe(401);
    });
});
