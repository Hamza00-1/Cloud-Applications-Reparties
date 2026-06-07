import { Request, Response, NextFunction } from 'express';
import { progressService } from './progress.service';
import { successResponse } from '../../utils/response';

export class ProgressController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = {
                moduleId: req.query.moduleId as string | undefined,
                groupId: req.query.groupId as string | undefined,
            };
            res.json(successResponse(await progressService.findAll(filters), 'Progress retrieved'));
        } catch (e) { next(e); }
    }
    async upsert(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await progressService.upsert(req.body, req.user!.id), 'Progress updated')); } catch (e) { next(e); }
    }
    async getGroupSummary(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await progressService.getGroupSummary(req.params.groupId as string), 'Group progress summary')); } catch (e) { next(e); }
    }
}
export const progressController = new ProgressController();
