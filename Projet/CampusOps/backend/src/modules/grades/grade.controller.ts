import { Request, Response, NextFunction } from 'express';
import { gradeService } from './grade.service';
import { successResponse } from '../../utils/response';

export class GradeController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = {
                studentId: req.query.studentId as string | undefined,
                moduleId: req.query.moduleId as string | undefined,
                gradeType: req.query.gradeType as string | undefined,
                semester: req.query.semester as string | undefined,
            };
            res.json(successResponse(await gradeService.findAll(filters), 'Grades retrieved'));
        } catch (e) { next(e); }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            res.json(successResponse(await gradeService.findById(String(req.params.id)), 'Grade retrieved'));
        } catch (e) { next(e); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const teacherId = (req as any).user.id;
            res.status(201).json(successResponse(await gradeService.create(req.body, teacherId), 'Grade recorded'));
        } catch (e) { next(e); }
    }

    async bulkCreate(req: Request, res: Response, next: NextFunction) {
        try {
            const teacherId = (req as any).user.id;
            res.status(201).json(successResponse(await gradeService.bulkCreate(req.body, teacherId), 'Bulk grades recorded'));
        } catch (e) { next(e); }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            res.json(successResponse(await gradeService.update(String(req.params.id), req.body), 'Grade updated'));
        } catch (e) { next(e); }
    }

    async getTranscript(req: Request, res: Response, next: NextFunction) {
        try {
            const semester = req.query.semester as string | undefined;
            res.json(successResponse(await gradeService.getStudentTranscript(String(req.params.studentId), semester), 'Transcript retrieved'));
        } catch (e) { next(e); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await gradeService.delete(String(req.params.id));
            res.json(successResponse(null, 'Grade deleted'));
        } catch (e) { next(e); }
    }
}

export const gradeController = new GradeController();
