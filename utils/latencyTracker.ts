/**
 * Latency Tracker
 * 
 * Measures and tracks latency metrics for real-time translation performance.
 * Tracks time from audio capture to final display.
 * 
 * Phase 5 Implementation
 */

export interface LatencyMetrics {
  // End-to-end latency
  captureToDisplay: number | null; // Time from capture to UI display
  
  // Component latencies
  audioProcessing: number | null; // Soniox processing time
  networkRoundTrip: number | null; // Network latency
  rendering: number | null; // UI rendering time
  
  // Statistics
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  sampleCount: number;
  
  // Real-time
  currentLatency: number | null;
  lastUpdateTime: number;
}

export interface LatencyDataPoint {
  timestamp: number;
  latency: number;
  type: 'translation' | 'token' | 'finalization';
}

export const DEFAULT_METRICS: LatencyMetrics = {
  captureToDisplay: null,
  audioProcessing: null,
  networkRoundTrip: null,
  rendering: null,
  averageLatency: 0,
  minLatency: Infinity,
  maxLatency: 0,
  sampleCount: 0,
  currentLatency: null,
  lastUpdateTime: Date.now(),
};

/**
 * Latency Tracker Class
 * 
 * Tracks and calculates latency metrics over time
 */
export class LatencyTracker {
  private metrics: LatencyMetrics = { ...DEFAULT_METRICS };
  private dataPoints: LatencyDataPoint[] = [];
  private maxDataPoints = 100; // Keep last 100 measurements
  
  // Timestamp markers
  private captureStartTime: number | null = null;
  private tokenReceiveTime: number | null = null;

  /**
   * Mark the start of audio capture
   */
  markCaptureStart(): void {
    this.captureStartTime = performance.now();
  }

  /**
   * Mark when token is received from Soniox
   */
  markTokenReceived(audioProcessedMs?: number): void {
    this.tokenReceiveTime = performance.now();
    
    if (audioProcessedMs !== undefined) {
      this.metrics.audioProcessing = audioProcessedMs;
    }
  }

  /**
   * Mark when final translation is displayed
   * Calculates end-to-end latency
   */
  markDisplayed(type: 'translation' | 'token' | 'finalization' = 'translation'): number | null {
    if (!this.captureStartTime) {
      return null;
    }

    const now = performance.now();
    const endToEndLatency = now - this.captureStartTime;

    // Update metrics
    this.updateMetrics(endToEndLatency, type);

    // Reset markers for next measurement
    this.captureStartTime = null;
    this.tokenReceiveTime = null;

    return endToEndLatency;
  }

  /**
   * Update metrics with new latency measurement
   */
  private updateMetrics(latency: number, type: LatencyDataPoint['type']): void {
    // Add data point
    const dataPoint: LatencyDataPoint = {
      timestamp: Date.now(),
      latency,
      type,
    };
    
    this.dataPoints.push(dataPoint);

    // Keep only recent data points
    if (this.dataPoints.length > this.maxDataPoints) {
      this.dataPoints.shift();
    }

    // Update current metrics
    this.metrics.currentLatency = latency;
    this.metrics.lastUpdateTime = Date.now();
    this.metrics.sampleCount++;

    // Calculate statistics
    this.calculateStatistics();
  }

  /**
   * Calculate average, min, max from data points
   */
  private calculateStatistics(): void {
    if (this.dataPoints.length === 0) {
      return;
    }

    const latencies = this.dataPoints.map(dp => dp.latency);
    
    this.metrics.averageLatency = 
      latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    
    this.metrics.minLatency = Math.min(...latencies);
    this.metrics.maxLatency = Math.max(...latencies);
  }

  /**
   * Get current metrics
   */
  getMetrics(): LatencyMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent data points (last N measurements)
   */
  getRecentDataPoints(count: number = 10): LatencyDataPoint[] {
    return this.dataPoints.slice(-count);
  }

  /**
   * Check if latency is within acceptable range
   */
  isLatencyAcceptable(threshold: number = 500): boolean {
    if (!this.metrics.currentLatency) {
      return true; // No data yet
    }
    return this.metrics.currentLatency <= threshold;
  }

  /**
   * Get latency quality category
   */
  getLatencyQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!this.metrics.averageLatency || this.metrics.sampleCount === 0) {
      return 'good'; // Default
    }

    const avg = this.metrics.averageLatency;
    
    if (avg < 200) return 'excellent';
    if (avg < 400) return 'good';
    if (avg < 700) return 'fair';
    return 'poor';
  }

  /**
   * Reset all metrics and data
   */
  reset(): void {
    this.metrics = { ...DEFAULT_METRICS };
    this.dataPoints = [];
    this.captureStartTime = null;
    this.tokenReceiveTime = null;
    console.log('📊 Latency tracker reset');
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    summary: LatencyMetrics;
    dataPoints: LatencyDataPoint[];
  } {
    return {
      summary: this.getMetrics(),
      dataPoints: [...this.dataPoints],
    };
  }
}

/**
 * Format latency for display
 */
export function formatLatency(latencyMs: number | null): string {
  if (latencyMs === null || latencyMs === undefined) {
    return 'N/A';
  }

  if (latencyMs < 1000) {
    return `${Math.round(latencyMs)}ms`;
  }

  return `${(latencyMs / 1000).toFixed(2)}s`;
}

/**
 * Get color for latency quality
 */
export function getLatencyColor(latencyMs: number | null): string {
  if (!latencyMs) return '#6b7280'; // Gray

  if (latencyMs < 200) return '#10b981'; // Green - excellent
  if (latencyMs < 400) return '#3b82f6'; // Blue - good
  if (latencyMs < 700) return '#f59e0b'; // Orange - fair
  return '#ef4444'; // Red - poor
}

/**
 * Get emoji for latency quality
 */
export function getLatencyEmoji(latencyMs: number | null): string {
  if (!latencyMs) return '⚪';

  if (latencyMs < 200) return '🟢'; // Excellent
  if (latencyMs < 400) return '🔵'; // Good
  if (latencyMs < 700) return '🟡'; // Fair
  return '🔴'; // Poor
}

/**
 * Calculate percentile from data points
 */
export function calculatePercentile(
  dataPoints: LatencyDataPoint[],
  percentile: number
): number {
  if (dataPoints.length === 0) return 0;

  const sorted = [...dataPoints]
    .map(dp => dp.latency)
    .sort((a, b) => a - b);
  
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

