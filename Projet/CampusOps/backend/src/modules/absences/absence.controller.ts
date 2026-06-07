import { Request, Response, NextFunction } from 'express';
import { absenceService } from './absence.service';
import { successResponse } from '../../utils/response';

export class AbsenceController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = {
                sessionId: req.query.sessionId as string | undefined,
                studentId: req.query.studentId as string | undefined,
                status: req.query.status as string | undefined,
            };
            res.json(successResponse(await absenceService.findAll(filters), 'Absences retrieved'));
        } catch (e) { next(e); }
    }
    async findById(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await absenceService.findById(req.params.id as string), 'Absence retrieved')); } catch (e) { next(e); }
    }
    async mark(req: Request, res: Response, next: NextFunction) {
        try { res.status(201).json(successResponse(await absenceService.mark(req.body), 'Absence marked')); } catch (e) { next(e); }
    }
    async markBulk(req: Request, res: Response, next: NextFunction) {
        try { res.status(201).json(successResponse(await absenceService.markBulk(req.body), 'Bulk absences marked')); } catch (e) { next(e); }
    }
    async justify(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await absenceService.justify(req.params.id as string, req.body), 'Absence justified')); } catch (e) { next(e); }
    }
    async getStudentStats(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await absenceService.getStudentStats(req.params.studentId as string), 'Student stats')); } catch (e) { next(e); }
    }
    async delete(req: Request, res: Response, next: NextFunction) {
        try { await absenceService.delete(req.params.id as string); res.json(successResponse(null, 'Absence deleted')); } catch (e) { next(e); }
    }
}
export const absenceController = new AbsenceController();
