import cron, { ScheduledTask } from 'node-cron';
import { env } from '../../config/env';
import { logger } from '../../middleware/logger';
import { runDailyPlanningNotifications } from './daily-planning.job';

let dailyTask: ScheduledTask | null = null;

export function startCronJobs(): void {
    if (env.CRON_DAILY_PLANNING !== 'on') {
        logger.info('⏰ Cron disabled (CRON_DAILY_PLANNING=off)');
        return;
    }

    if (!cron.validate(env.CRON_DAILY_PLANNING_TIME)) {
        logger.error(`⏰ Invalid cron expression "${env.CRON_DAILY_PLANNING_TIME}" — daily planning job NOT scheduled`);
        return;
    }

    dailyTask = cron.schedule(
        env.CRON_DAILY_PLANNING_TIME,
        async () => {
            logger.info('⏰ Daily planning cron firing...');
            try {
                await runDailyPlanningNotifications();
            } catch (err: any) {
                logger.error(`⏰ Daily planning cron failed: ${err.message}`);
            }
        },
        { timezone: env.CRON_TIMEZONE },
    );

    logger.info(`⏰ Daily planning cron scheduled: "${env.CRON_DAILY_PLANNING_TIME}" (${env.CRON_TIMEZONE})`);
}

export function stopCronJobs(): void {
    if (dailyTask) {
        dailyTask.stop();
        dailyTask = null;
        logger.info('⏰ Cron jobs stopped');
    }
}
