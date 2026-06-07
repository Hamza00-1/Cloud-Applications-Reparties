import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../middleware/logger';

// ============================================
// Redis Client
// ============================================
// Used for:
//  - Rate limiting (express-rate-limit store)
//  - Session/token blacklisting
//  - Caching frequently accessed data
//  - Pub/Sub for real-time notifications (Phase 5)
// ============================================

let redis: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redis) {
        redis = new Redis(env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy(times: number) {
                if (times > 3) {
                    logger.warn('Redis connection failed after 3 retries. Continuing without Redis.');
                    return null; // Stop retrying
                }
                return Math.min(times * 200, 2000);
            },
            lazyConnect: true,
        });

        redis.on('connect', () => {
            logger.info('🔴 Redis connected');
        });

        redis.on('error', (err) => {
            logger.error('Redis error:', err);
        });
    }

    return redis;
}

export async function connectRedis(): Promise<void> {
    try {
        const client = getRedisClient();
        await client.connect();
    } catch (error) {
        logger.warn('⚠️  Redis not available — rate limiting will use in-memory store');
    }
}

export async function disconnectRedis(): Promise<void> {
    if (redis) {
        await redis.quit();
        redis = null;
    }
}
