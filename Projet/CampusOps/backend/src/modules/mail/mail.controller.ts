import { Request, Response, NextFunction } from 'express';
import { mailService } from './mail.service';
import { successResponse } from '../../utils/response';

export class MailController {
    async latest(req: Request, res: Response, next: NextFunction) {
        try {
            const limit = Number(req.query.limit) || 20;
            const messages = await mailService.latest(limit);
            res.json(successResponse(messages, `${messages.length} message(s) retrieved`));
        } catch (e) { next(e); }
    }

    async send(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await mailService.send(req.body);
            res.status(202).json(successResponse(result, 'Email sent'));
        } catch (e) { next(e); }
    }
}

export const mailController = new MailController();
