import { Request, Response, NextFunction } from 'express';
import { moduleService } from './module.service';
import { successResponse } from '../../utils/response';

export class ModuleController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const modules = await moduleService.findAll(req.query.branchId as string | undefined);
            res.json(successResponse(modules, 'Modules retrieved'));
        } catch (error) { next(error); }
    }
    async findById(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await moduleService.findById(req.params.id as string), 'Module retrieved')); } catch (error) { next(error); }
    }
    async create(req: Request, res: Response, next: NextFunction) {
        try { res.status(201).json(successResponse(await moduleService.create(req.body), 'Module created')); } catch (error) { next(error); }
    }
    async update(req: Request, res: Response, next: NextFunction) {
        try { res.json(successResponse(await moduleService.update(req.params.id as string, req.body), 'Module updated')); } catch (error) { next(error); }
    }
    async delete(req: Request, res: Response, next: NextFunction) {
        try { await moduleService.delete(req.params.id as string); res.json(successResponse(null, 'Module deleted')); } catch (error) { next(error); }
    }
}
export const moduleController = new ModuleController();
