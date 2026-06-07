import { prisma } from '../../config/database';
import { ApiError } from '../../middleware/errorHandler';
import { hashPassword } from '../../utils/hash';
import { CreateUserInput, UpdateUserInput, UserQuery } from './user.schemas';
import { Prisma } from '@prisma/client';
import { sendEmail } from '../../services/email.service';
import { logger } from '../../middleware/logger';
import { env } from '../../config/env';

export class UserService {
    private readonly selectFields = {
        id: true, name: true, email: true, role: true, branchId: true,
        telegramChatId: true, createdAt: true, updatedAt: true,
        branch: { select: { name: true, location: true } },
    } as const;

    async findAll(query: UserQuery) {
        const where: Prisma.UserWhereInput = {};
        if (query.role) where.role = query.role;
        if (query.branchId) where.branchId = query.branchId;
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: this.selectFields,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { name: 'asc' },
            }),
            prisma.user.count({ where }),
        ]);

        return { users, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
    }

    async findById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                ...this.selectFields,
                studentGroups: { include: { group: { select: { id: true, name: true } } } },
                _count: { select: { plannings: true, absences: true, payments: true, notifications: true } },
            },
        });
        if (!user) throw ApiError.notFound('User not found');
        return user;
    }

    async create(data: CreateUserInput) {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) throw ApiError.conflict('Email already registered');

        const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
        if (!branch) throw ApiError.badRequest('Invalid branch ID');

        const passwordHash = await hashPassword(data.password);
        const user = await prisma.user.create({
            data: { name: data.name, email: data.email, passwordHash, role: data.role, branchId: data.branchId },
            select: this.selectFields,
        });

        // Send invitation email (fire-and-forget — don't block user creation)
        const loginUrl = env.APP_URL?.endsWith('.html') ? env.APP_URL : `${env.APP_URL}/CampusOps.html`;
        sendEmail({
            to: data.email,
            subject: `Welcome to CampusOps — Your account is ready!`,
            body: `Hello ${data.name},\n\nYour CampusOps account has been created.\n\n📧 Email: ${data.email}\n🔑 Password: ${data.password}\n👤 Role: ${data.role}\n🏫 Branch: ${branch.name}\n\nPlease log in at: ${loginUrl}\n\nWe recommend changing your password after your first login.\n\nBest regards,\nCampusOps Administration`,
            type: 'success',
        }).then(ok => {
            if (ok) logger.info(`📧 Invitation email sent to ${data.email}`);
        }).catch(() => {});

        return user;
    }

    async update(id: string, data: UpdateUserInput) {
        await this.findById(id);
        if (data.email) {
            const existing = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
            if (existing) throw ApiError.conflict('Email already in use by another user');
        }
        if (data.branchId) {
            const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
            if (!branch) throw ApiError.badRequest('Invalid branch ID');
        }
        return prisma.user.update({ where: { id }, data, select: this.selectFields });
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.user.delete({ where: { id } });
    }
}

export const userService = new UserService();
