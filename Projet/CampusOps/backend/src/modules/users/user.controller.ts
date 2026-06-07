import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { successResponse } from '../../utils/response';
import { UserQuery } from './user.schemas';

export class UserController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await userService.findAll(req.query as unknown as UserQuery);
            res.json({
                success: true, message: 'Users retrieved',
                data: result.users,
                meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
            });
        } catch (error) { next(error); }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await userService.findById(req.params.id as string);
            res.json(successResponse(user, 'User retrieved'));
        } catch (error) { next(error); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await userService.create(req.body);
            res.status(201).json(successResponse(user, 'User created'));
        } catch (error) { next(error); }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await userService.update(req.params.id as string, req.body);
            res.json(successResponse(user, 'User updated'));
        } catch (error) { next(error); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await userService.delete(req.params.id as string);
            res.json(successResponse(null, 'User deleted'));
        } catch (error) { next(error); }
    }
}

export const userController = new UserController();
