/**
 * Error Handler Utilities
 * 
 * Manages error handling, retry logic, and exponential backoff
 * for robust WebSocket connection management.
 * 
 * Phase 4 Implementation
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2, // Exponential: 1s, 2s, 4s, 8s, 16s, 30s
};

/**
 * Error types that can occur during translation
 */
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  SESSION_TERMINATED = 'SESSION_TERMINATED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Classify error based on status code and message
 */
export function classifyError(
  status: number | string,
  message: string
): ErrorType {
  const statusNum = typeof status === 'number' ? status : parseInt(status, 10);
  const messageLower = message.toLowerCase();

  // Session termination (Soniox specific)
  if (messageLower.includes('cannot continue request')) {
    return ErrorType.SESSION_TERMINATED;
  }

  // Permission errors
  if (statusNum === 403 || messageLower.includes('permission')) {
    return ErrorType.PERMISSION_DENIED;
  }

  // Network errors
  if (
    statusNum === 0 ||
    statusNum === 503 ||
    messageLower.includes('network') ||
    messageLower.includes('connection')
  ) {
    return ErrorType.NETWORK_ERROR;
  }

  // Timeout errors
  if (statusNum === 408 || messageLower.includes('timeout')) {
    return ErrorType.TIMEOUT_ERROR;
  }

  // API errors
  if (statusNum >= 400 && statusNum < 500) {
    return ErrorType.API_ERROR;
  }

  return ErrorType.UNKNOWN_ERROR;
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(errorType: ErrorType): boolean {
  switch (errorType) {
    case ErrorType.NETWORK_ERROR:
    case ErrorType.SESSION_TERMINATED:
    case ErrorType.TIMEOUT_ERROR:
      return true;
    
    case ErrorType.API_ERROR:
    case ErrorType.PERMISSION_DENIED:
    case ErrorType.UNKNOWN_ERROR:
      return false;
    
    default:
      return false;
  }
}

/**
 * Calculate delay for next retry with exponential backoff
 */
export function calculateBackoffDelay(
  retryCount: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, retryCount);
  return Math.min(delay, config.maxDelay);
}

/**
 * Create user-friendly error message
 */
export function getUserFriendlyMessage(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.NETWORK_ERROR:
      return 'Network connection lost. Attempting to reconnect...';
    
    case ErrorType.SESSION_TERMINATED:
      return 'Translation session ended. Starting new session...';
    
    case ErrorType.PERMISSION_DENIED:
      return 'Permission denied. Please check your API key or permissions.';
    
    case ErrorType.TIMEOUT_ERROR:
      return 'Connection timeout. Reconnecting...';
    
    case ErrorType.API_ERROR:
      return 'API error occurred. Please try again later.';
    
    case ErrorType.UNKNOWN_ERROR:
    default:
      return 'An unexpected error occurred. Attempting to recover...';
  }
}

/**
 * Retry Manager Class
 * 
 * Manages retry attempts with exponential backoff
 */
export class RetryManager {
  private retryCount: number = 0;
  private config: RetryConfig;
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Check if we can retry
   */
  canRetry(): boolean {
    return this.retryCount < this.config.maxRetries;
  }

  /**
   * Get current retry count
   */
  getCurrentRetryCount(): number {
    return this.retryCount;
  }

  /**
   * Calculate next retry delay
   */
  getNextDelay(): number {
    return calculateBackoffDelay(this.retryCount, this.config);
  }

  /**
   * Schedule a retry attempt
   */
  async scheduleRetry(callback: () => void | Promise<void>): Promise<void> {
    if (!this.canRetry()) {
      throw new Error('Maximum retry attempts exceeded');
    }

    const delay = this.getNextDelay();
    console.log(`⏳ Scheduling retry ${this.retryCount + 1}/${this.config.maxRetries} in ${delay}ms`);

    this.retryCount++;

    return new Promise((resolve) => {
      this.retryTimeoutId = setTimeout(async () => {
        try {
          await callback();
          resolve();
        } catch (error) {
          console.error('❌ Retry attempt failed:', error);
          resolve();
        }
      }, delay);
    });
  }

  /**
   * Reset retry count (e.g., after successful connection)
   */
  reset(): void {
    console.log('✅ Retry manager reset');
    this.retryCount = 0;
    
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }

  /**
   * Cancel pending retries
   */
  cancel(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
      console.log('🚫 Retry cancelled');
    }
  }

  /**
   * Get retry statistics
   */
  getStats(): {
    currentRetry: number;
    maxRetries: number;
    canRetry: boolean;
    nextDelay: number;
  } {
    return {
      currentRetry: this.retryCount,
      maxRetries: this.config.maxRetries,
      canRetry: this.canRetry(),
      nextDelay: this.getNextDelay(),
    };
  }
}

/**
 * Session State Manager
 * 
 * Tracks session state and helps with recovery
 */
export class SessionStateManager {
  private lastKnownGoodState: {
    committedLines: number;
    timestamp: number;
  } | null = null;

  /**
   * Save current state as last known good state
   */
  saveState(committedLinesCount: number): void {
    this.lastKnownGoodState = {
      committedLines: committedLinesCount,
      timestamp: Date.now(),
    };
    console.log(`💾 State saved: ${committedLinesCount} lines committed`);
  }

  /**
   * Get last known good state
   */
  getLastState(): typeof this.lastKnownGoodState {
    return this.lastKnownGoodState;
  }

  /**
   * Check if state is recent (within last N seconds)
   */
  isStateRecent(maxAgeMs: number = 30000): boolean {
    if (!this.lastKnownGoodState) {
      return false;
    }
    
    const age = Date.now() - this.lastKnownGoodState.timestamp;
    return age < maxAgeMs;
  }

  /**
   * Reset state
   */
  reset(): void {
    this.lastKnownGoodState = null;
    console.log('🔄 Session state reset');
  }
}

/**
 * Wait for a specified duration (for use with async/await)
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract error code from Soniox error message
 * Format: "Cannot continue request (code N)"
 */
export function extractErrorCode(message: string): number | null {
  const match = message.match(/code (\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if error message indicates session termination
 */
export function isSessionTerminationError(message: string): boolean {
  const terminationKeywords = [
    'cannot continue request',
    'session ended',
    'session terminated',
    'connection closed',
  ];

  const messageLower = message.toLowerCase();
  return terminationKeywords.some(keyword => messageLower.includes(keyword));
}

