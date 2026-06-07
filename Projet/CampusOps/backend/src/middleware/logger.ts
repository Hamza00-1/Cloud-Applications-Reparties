import winston from 'winston';
import { env } from '../config/env';

// ============================================
// Structured Logger (Winston)
// ============================================
// - Development: colorized, human-readable
// - Production: JSON format for log aggregation
// ============================================

const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level}: ${message}${metaStr}`;
    })
);

const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

export const logger = winston.createLogger({
    level: env.LOG_LEVEL,
    format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
    defaultMeta: { service: 'campusops-api' },
    transports: [
        new winston.transports.Console(),
        // In production, you'd add file/cloud transports here
        // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// Express middleware for HTTP request logging
export function httpLogger(
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction
): void {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'warn' : 'http';

        logger.log(level, `${req.method} ${req.originalUrl}`, {
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
        });
    });

    next();
}
