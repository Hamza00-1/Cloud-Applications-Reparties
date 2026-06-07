import app from './app';
import { env } from './config/env';
import { logger } from './middleware/logger';
import { prisma } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { verifyEmailConnection } from './services/email.service';
import { verifyTelegramBot } from './services/telegram.service';
import { verifyImapConnection } from './integrations/email/imap';
import { startCronJobs, stopCronJobs } from './integrations/openclaw/cron';

// ============================================
// CampusOps — Server Entry Point
// ============================================

async function bootstrap(): Promise<void> {
    try {
        // 1. Connect to PostgreSQL via Prisma
        await prisma.$connect();
        logger.info('🐘 PostgreSQL connected');

        // 2. Connect to Redis (non-blocking — continues if unavailable)
        await connectRedis();

        // 3. Verify SMTP Email connection
        await verifyEmailConnection();

        // 4. Verify Telegram Bot
        await verifyTelegramBot();

        // 5. Verify IMAP inbox (optional)
        await verifyImapConnection();

        // 6. Schedule cron jobs (daily 7AM planning notifications)
        startCronJobs();

        // 7. Start Express server
        const server = app.listen(env.PORT, () => {
            logger.info(`
┌─────────────────────────────────────────────┐
│                                             │
│   ⚡ CampusOps API v1.0.0                   │
│                                             │
│   Environment:  ${env.NODE_ENV.padEnd(25)}│
│   Port:         ${String(env.PORT).padEnd(25)}│
│   API Prefix:   ${env.API_PREFIX.padEnd(25)}│
│   Health:       http://localhost:${env.PORT}/health     │
│   API Root:     http://localhost:${env.PORT}${env.API_PREFIX}     │
│                                             │
└─────────────────────────────────────────────┘
      `);
        });

        // ===== Graceful Shutdown =====
        const shutdown = async (signal: string) => {
            logger.info(`\n${signal} received. Shutting down gracefully...`);

            stopCronJobs();

            server.close(() => {
                logger.info('🔒 HTTP server closed');
            });

            await prisma.$disconnect();
            logger.info('🐘 PostgreSQL disconnected');

            await disconnectRedis();
            logger.info('🔴 Redis disconnected');

            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Handle unhandled rejections & exceptions
        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled Rejection:', reason);
        });

        process.on('uncaughtException', (err) => {
            logger.error('Uncaught Exception:', err);
            process.exit(1);
        });

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

bootstrap();
