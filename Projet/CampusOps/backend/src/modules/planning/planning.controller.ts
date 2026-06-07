import { Request, Response, NextFunction } from 'express';
import { planningService } from './planning.service';
import { successResponse } from '../../utils/response';

export class PlanningController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = {
                date: req.query.date as string | undefined,
                teacherId: req.query.teacherId as string | undefined,
                groupId: req.query.groupId as string | undefined,
            };
            res.json(successResponse(await planningService.findAll(filters), 'Planning retrieved'));
        } catch (e) { next(e); }
    }
    async findToday(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await planningService.findToday(req.user!.id, req.user!.role), "Today's schedule")); } catch (e) { next(e); }
    }
    async findWeek(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await planningService.findWeek(req.user!.id, req.user!.role), "This week's schedule")); } catch (e) { next(e); }
    }
    async findById(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await planningService.findById(req.params.id as string), 'Session retrieved')); } catch (e) { next(e); }
    }
    async create(req: Request, res: Response, next: NextFunction) {
        try { res.status(201).json(successResponse(await planningService.create(req.body), 'Session created')); } catch (e) { next(e); }
    }
    async update(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await planningService.update(req.params.id as string, req.body), 'Session updated')); } catch (e) { next(e); }
    }
    async delete(req: Request, res: Response, next: NextFunction) {
        try { await planningService.delete(req.params.id as string); res.json(successResponse(null, 'Session deleted')); } catch (e) { next(e); }
    }
}
export const planningController = new PlanningController();
