/**
 * Rate Limiting Implementation
 * 
 * In-memory rate limiting using sliding window algorithm.
 * For production, consider using Redis with @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.store.forEach((entry, key) => {
      if (entry.resetAt < now) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.store.delete(key));
  }

  /**
   * Check if request is within rate limit
   */
  public check(identifier: string, limit: number, windowMs: number): {
    success: boolean;
    remaining: number;
    reset: number;
  } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // No entry or expired entry
    if (!entry || entry.resetAt < now) {
      this.store.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return {
        success: true,
        remaining: limit - 1,
        reset: now + windowMs,
      };
    }

    // Within window
    if (entry.count < limit) {
      entry.count++;
      return {
        success: true,
        remaining: limit - entry.count,
        reset: entry.resetAt,
      };
    }

    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      reset: entry.resetAt,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  public reset(identifier: string) {
    this.store.delete(identifier);
  }

  /**
   * Clean up on shutdown
   */
  public destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
  // API requests per minute
  api: {
    limit: 60,
    window: 60 * 1000, // 1 minute
  },
  // Transcript creation per hour
  transcriptCreate: {
    limit: 20,
    window: 60 * 60 * 1000, // 1 hour
  },
  // Usage recording per minute (should match translation sessions)
  usageRecord: {
    limit: 10,
    window: 60 * 1000, // 1 minute
  },
  // Authentication attempts per hour
  auth: {
    limit: 10,
    window: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Check rate limit for API route
 */
export async function checkRateLimit(
  identifier: string,
  type: keyof typeof RATE_LIMITS = 'api'
): Promise<{
  success: boolean;
  remaining: number;
  reset: number;
}> {
  const config = RATE_LIMITS[type];
  return rateLimiter.check(identifier, config.limit, config.window);
}

/**
 * Get rate limit identifier from request
 * Uses user ID if authenticated, IP address otherwise
 */
export function getRateLimitIdentifier(
  userId: string | null,
  ip: string | null,
  route: string
): string {
  const base = userId || ip || 'anonymous';
  return `${route}:${base}`;
}

/**
 * Rate limit error response
 */
export class RateLimitError extends Error {
  public readonly statusCode = 429;
  public readonly reset: number;

  constructor(reset: number) {
    super('Too many requests, please try again later');
    this.name = 'RateLimitError';
    this.reset = reset;
  }
}

/**
 * Apply rate limit to request
 * Throws RateLimitError if limit exceeded
 */
export async function applyRateLimit(
  userId: string | null,
  ip: string | null,
  route: string,
  type: keyof typeof RATE_LIMITS = 'api'
): Promise<void> {
  const identifier = getRateLimitIdentifier(userId, ip, route);
  const result = await checkRateLimit(identifier, type);

  if (!result.success) {
    throw new RateLimitError(result.reset);
  }
}

export default rateLimiter;

