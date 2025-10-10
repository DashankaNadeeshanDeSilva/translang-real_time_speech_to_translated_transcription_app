/**
 * Keepalive Manager
 * 
 * Manages WebSocket keepalive messages to prevent session timeouts
 * during periods of silence or inactivity.
 * 
 * Phase 3 Implementation
 */

export interface KeepaliveConfig {
  interval: number; // milliseconds between keepalive messages
  enabled: boolean;
}

export const DEFAULT_KEEPALIVE_CONFIG: KeepaliveConfig = {
  interval: 5000, // Send keepalive every 5 seconds
  enabled: true,
};

/**
 * Keepalive Manager Class
 * 
 * Manages periodic keepalive messages to maintain WebSocket session
 */
export class KeepaliveManager {
  private config: KeepaliveConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private client: any = null;
  private isRunning: boolean = false;

  constructor(config: Partial<KeepaliveConfig> = {}) {
    this.config = { ...DEFAULT_KEEPALIVE_CONFIG, ...config };
  }

  /**
   * Start sending keepalive messages
   * 
   * @param client - Soniox client instance (must have sendKeepalive or similar method)
   */
  start(client: any): void {
    if (!this.config.enabled) {
      console.log('⏸️ Keepalive disabled');
      return;
    }

    if (this.isRunning) {
      console.warn('⚠️ Keepalive already running');
      return;
    }

    this.client = client;
    this.isRunning = true;

    console.log(`💓 Starting keepalive (interval: ${this.config.interval}ms)`);

    // Send keepalive messages at regular intervals
    this.intervalId = setInterval(() => {
      this.sendKeepalive();
    }, this.config.interval);

    // Send initial keepalive immediately
    this.sendKeepalive();
  }

  /**
   * Send a keepalive message
   */
  private sendKeepalive(): void {
    if (!this.client) {
      console.warn('⚠️ No client available for keepalive');
      return;
    }

    try {
      // Check if client has a sendKeepalive method
      if (typeof this.client.sendKeepalive === 'function') {
        this.client.sendKeepalive();
        console.log('💓 Keepalive sent');
      } else {
        // Fallback: Some SDKs might handle keepalive automatically
        console.log('💓 Keepalive (handled by SDK)');
      }
    } catch (error) {
      console.error('❌ Failed to send keepalive:', error);
    }
  }

  /**
   * Stop sending keepalive messages
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.client = null;

    console.log('💔 Keepalive stopped');
  }

  /**
   * Update keepalive configuration
   * Note: Requires restart to take effect
   */
  updateConfig(newConfig: Partial<KeepaliveConfig>): void {
    const wasRunning = this.isRunning;
    const client = this.client;

    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Keepalive config updated:', this.config);

    if (wasRunning && client) {
      this.start(client);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): KeepaliveConfig {
    return { ...this.config };
  }

  /**
   * Check if keepalive is running
   */
  get running(): boolean {
    return this.isRunning;
  }
}

