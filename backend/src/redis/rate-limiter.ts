import redis from '../config/redis';
import { env } from '../config/env';

export async function checkRateLimit(recipientId: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:${recipientId}`;
  const now = Date.now();
  const windowMs = 3600 * 1000;
  const currentMinute = Math.floor(now / 60000).toString();

  const pipeline = redis.pipeline();
  pipeline.hincrby(key, currentMinute, 1);
  pipeline.expire(key, 3600);
  const results = await pipeline.exec();

  const currentCount = results?.[0]?.[1] as number;

  const allBuckets = await redis.hgetall(key);
  let totalCount = 0;

  for (const [minute, count] of Object.entries(allBuckets)) {
    const bucketTime = parseInt(minute, 10) * 60000;
    if (now - bucketTime < windowMs) {
      totalCount += parseInt(count, 10);
    }
  }

  const allowed = totalCount <= env.RATE_LIMIT_PER_HOUR;
  const remaining = Math.max(0, env.RATE_LIMIT_PER_HOUR - totalCount);

  return { allowed, remaining };
}
