import { Request, Response, NextFunction } from 'express';
import { groupService } from './group.service';
import { successResponse } from '../../utils/response';

export class GroupController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await groupService.findAll(req.query.branchId as string | undefined), 'Groups retrieved')); } catch (error) { next(error); }
    }
    async findById(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await groupService.findById(req.params.id as string), 'Group retrieved')); } catch (error) { next(error); }
    }
    async create(req: Request, res: Response, next: NextFunction) {
        try { res.status(201).json(successResponse(await groupService.create(req.body), 'Group created')); } catch (error) { next(error); }
    }
    async update(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await groupService.update(req.params.id as string, req.body), 'Group updated')); } catch (error) { next(error); }
    }
    async delete(req: Request, res: Response, next: NextFunction) {
        try { await groupService.delete(req.params.id as string); res.json(successResponse(null, 'Group deleted')); } catch (error) { next(error); }
    }
    async enrollStudent(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await groupService.enrollStudent(req.params.id as string, req.body.studentId);
            res.status(201).json(successResponse(result, 'Student enrolled'));
        } catch (error) { next(error); }
    }
    async unenrollStudent(req: Request, res: Response, next: NextFunction) {
        try {
            await groupService.unenrollStudent(req.params.id as string, req.body.studentId);
            res.json(successResponse(null, 'Student unenrolled'));
        } catch (error) { next(error); }
    }
}
export const groupController = new GroupController();
