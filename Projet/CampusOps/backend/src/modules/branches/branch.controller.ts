import { Request, Response, NextFunction } from 'express';
import { branchService } from './branch.service';
import { successResponse } from '../../utils/response';

export class BranchController {
    async findAll(_req: Request, res: Response, next: NextFunction) {
        try {
            const branches = await branchService.findAll();
            res.json(successResponse(branches, 'Branches retrieved'));
        } catch (error) { next(error); }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const branch = await branchService.findById(req.params.id as string);
            res.json(successResponse(branch, 'Branch retrieved'));
        } catch (error) { next(error); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const branch = await branchService.create(req.body);
            res.status(201).json(successResponse(branch, 'Branch created'));
        } catch (error) { next(error); }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const branch = await branchService.update(req.params.id as string, req.body);
            res.json(successResponse(branch, 'Branch updated'));
        } catch (error) { next(error); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await branchService.delete(req.params.id as string);
            res.json(successResponse(null, 'Branch deleted'));
        } catch (error) { next(error); }
    }
}

export const branchController = new BranchController();
