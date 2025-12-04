/**
 * Usage Tracking Utilities
 * 
 * Tracks translation session duration and enforces usage limits.
 * Free tier: 60 minutes per month
 */

export interface UsageStats {
  totalMinutes: number;
  limitMinutes: number;
  remainingMinutes: number;
  percentUsed: number;
  isOverLimit: boolean;
}

export interface UsageTier {
  name: string;
  limitMinutes: number;
  price?: number;
}

// Usage tiers configuration
export const USAGE_TIERS: Record<string, UsageTier> = {
  free: {
    name: 'Free',
    limitMinutes: 60,
  },
  pro: {
    name: 'Pro',
    limitMinutes: 600,
    price: 15,
  },
  unlimited: {
    name: 'Unlimited',
    limitMinutes: Infinity,
    price: 49,
  },
};

/**
 * Calculate minutes from milliseconds
 */
export function msToMinutes(ms: number): number {
  return ms / 1000 / 60;
}

/**
 * Format minutes to human-readable string
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  
  return `${mins}m`;
}

/**
 * Calculate usage statistics
 */
export function calculateUsageStats(
  totalMinutes: number,
  tier: UsageTier = USAGE_TIERS.free
): UsageStats {
  const limitMinutes = tier.limitMinutes;
  const remainingMinutes = Math.max(0, limitMinutes - totalMinutes);
  const percentUsed = Math.min(100, (totalMinutes / limitMinutes) * 100);
  const isOverLimit = totalMinutes >= limitMinutes;
  
  return {
    totalMinutes,
    limitMinutes,
    remainingMinutes,
    percentUsed,
    isOverLimit,
  };
}

/**
 * Check if user has remaining usage
 */
export function hasRemainingUsage(stats: UsageStats): boolean {
  return stats.remainingMinutes > 0;
}

/**
 * Check if user is near limit (>80%)
 */
export function isNearLimit(stats: UsageStats): boolean {
  return stats.percentUsed >= 80 && !stats.isOverLimit;
}

/**
 * Get usage warning message
 */
export function getUsageWarningMessage(stats: UsageStats): string | null {
  if (stats.isOverLimit) {
    return `You've used all ${stats.limitMinutes} minutes of your free plan this month.`;
  }
  
  if (isNearLimit(stats)) {
    return `You have ${formatMinutes(stats.remainingMinutes)} remaining this month.`;
  }
  
  return null;
}

/**
 * Session tracker class for tracking active session duration
 */
export class SessionTracker {
  private startTime: number | null = null;
  private pausedTime: number = 0;
  private pauseStart: number | null = null;
  
  start(): void {
    if (this.startTime) return; // Already started
    this.startTime = Date.now();
  }
  
  pause(): void {
    if (!this.startTime || this.pauseStart) return; // Not started or already paused
    this.pauseStart = Date.now();
  }
  
  resume(): void {
    if (!this.pauseStart) return; // Not paused
    this.pausedTime += Date.now() - this.pauseStart;
    this.pauseStart = null;
  }
  
  stop(): number {
    if (!this.startTime) return 0;
    
    const endTime = Date.now();
    const totalMs = endTime - this.startTime;
    const activeMs = totalMs - this.pausedTime;
    
    // Reset state
    this.startTime = null;
    this.pausedTime = 0;
    this.pauseStart = null;
    
    return activeMs;
  }
  
  getElapsedMs(): number {
    if (!this.startTime) return 0;
    
    const currentTime = this.pauseStart || Date.now();
    const totalMs = currentTime - this.startTime;
    const activeMs = totalMs - this.pausedTime;
    
    return Math.max(0, activeMs);
  }
  
  getElapsedMinutes(): number {
    return msToMinutes(this.getElapsedMs());
  }
  
  reset(): void {
    this.startTime = null;
    this.pausedTime = 0;
    this.pauseStart = null;
  }
}

