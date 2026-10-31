import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export class RateLimitUnavailableError extends Error {
  constructor() {
    super('Rate limiting service is temporarily unavailable');
    this.name = 'RateLimitUnavailableError';
  }
}

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  url && token
    ? new Redis({ url, token })
    : null;

const investigationLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      prefix: 'forgemind:investigations',
      analytics: true,
    })
  : null;

const followUpLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 h'),
      prefix: 'forgemind:follow-ups',
      analytics: true,
    })
  : null;

const feedbackLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 h'),
      prefix: 'forgemind:feedback',
      analytics: true,
    })
  : null;

export type RateLimitType =
  | 'investigation'
  | 'follow-up'
  | 'feedback';

export async function checkRateLimit(
  userId: string,
  type: RateLimitType
) {
  const limiter =
    type === 'investigation'
      ? investigationLimiter
      : type === 'follow-up'
        ? followUpLimiter
        : feedbackLimiter;

  if (!limiter) {
    if (process.env.NODE_ENV === 'production') {
      throw new RateLimitUnavailableError();
    }

    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }

  try {
    return await limiter.limit(userId);
  } catch {
    throw new RateLimitUnavailableError();
  }
}