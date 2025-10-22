'use client';

import { Activity } from 'lucide-react';

import { LatencyMetrics as LatencyMetricsType, formatLatency, getLatencyColor, getLatencyEmoji } from '@/utils/latencyTracker';

/**
 * Latency Metrics Display Component
 * 
 * Shows real-time latency metrics and performance statistics.
 * 
 * Phase 5 Implementation
 */

interface LatencyMetricsProps {
  metrics: LatencyMetricsType;
  isRecording: boolean;
  collapsed?: boolean;
}

export function LatencyMetrics({
  metrics,
  isRecording,
  collapsed = false,
}: LatencyMetricsProps) {
  if (collapsed) {
    return (
      <div style={styles.compactContainer}>
        <span style={styles.compactLabel}>Latency:</span>
        <span style={{
          ...styles.compactValue,
          color: getLatencyColor(metrics.currentLatency),
        }}>
          {getLatencyEmoji(metrics.currentLatency)} {formatLatency(metrics.currentLatency)}
        </span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.title} className="flex items-center gap-2">
          <Activity size={18} />
          Performance Metrics
        </h4>
        {isRecording && (
          <span style={styles.liveIndicator}>
            <span style={styles.liveDot}></span>
            Live
          </span>
        )}
      </div>

      <div style={styles.metricsGrid}>
        {/* Current Latency */}
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Current Latency</div>
          <div style={{
            ...styles.metricValue,
            color: getLatencyColor(metrics.currentLatency),
          }}>
            {getLatencyEmoji(metrics.currentLatency)} {formatLatency(metrics.currentLatency)}
          </div>
        </div>

        {/* Average Latency */}
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Average</div>
          <div style={{
            ...styles.metricValue,
            color: getLatencyColor(metrics.averageLatency),
          }}>
            {formatLatency(metrics.averageLatency)}
          </div>
        </div>

        {/* Min Latency */}
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Best</div>
          <div style={styles.metricValueSmall}>
            {formatLatency(metrics.minLatency === Infinity ? null : metrics.minLatency)}
          </div>
        </div>

        {/* Max Latency */}
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Worst</div>
          <div style={styles.metricValueSmall}>
            {formatLatency(metrics.maxLatency === 0 ? null : metrics.maxLatency)}
          </div>
        </div>

        {/* Sample Count */}
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Samples</div>
          <div style={styles.metricValueSmall}>
            {metrics.sampleCount}
          </div>
        </div>

        {/* Audio Processing (from Soniox) */}
        {metrics.audioProcessing !== null && (
          <div style={styles.metric}>
            <div style={styles.metricLabel}>Soniox Processing</div>
            <div style={styles.metricValueSmall}>
              {formatLatency(metrics.audioProcessing)}
            </div>
          </div>
        )}
      </div>

      {/* Quality Indicator */}
      <div style={styles.qualityBar}>
        <div style={styles.qualityLabel}>Quality:</div>
        <div style={styles.qualityIndicator}>
          {getQualityBars(metrics.averageLatency)}
        </div>
        <div style={styles.qualityText}>
          {getQualityText(metrics.averageLatency)}
        </div>
      </div>
    </div>
  );
}

/**
 * Get quality bars visualization
 */
function getQualityBars(avgLatency: number): JSX.Element {
  const bars = 5;
  const filledBars = getFilledBars(avgLatency);

  return (
    <>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          style={{
            ...styles.qualityBar,
            backgroundColor: i < filledBars ? '#10b981' : '#e5e7eb',
          }}
        />
      ))}
    </>
  );
}

/**
 * Calculate number of filled bars based on latency
 */
function getFilledBars(avgLatency: number): number {
  if (avgLatency === 0) return 3; // Default
  if (avgLatency < 200) return 5; // Excellent
  if (avgLatency < 300) return 4; // Very good
  if (avgLatency < 500) return 3; // Good
  if (avgLatency < 800) return 2; // Fair
  return 1; // Poor
}

/**
 * Get quality text description
 */
function getQualityText(avgLatency: number): string {
  if (avgLatency === 0) return 'No data yet';
  if (avgLatency < 200) return 'Excellent';
  if (avgLatency < 300) return 'Very Good';
  if (avgLatency < 500) return 'Good';
  if (avgLatency < 800) return 'Fair';
  return 'Needs Improvement';
}

// Styles
const styles = {
  container: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginTop: '1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    margin: 0,
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.75rem',
    color: '#059669',
    fontWeight: '500',
  },
  liveDot: {
    width: '0.5rem',
    height: '0.5rem',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  metric: {
    backgroundColor: '#ffffff',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #e5e7eb',
  },
  metricLabel: {
    fontSize: '0.6875rem',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.025em',
    marginBottom: '0.25rem',
  },
  metricValue: {
    fontSize: '1.25rem',
    fontWeight: '600',
    lineHeight: '1.2',
  },
  metricValueSmall: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#374151',
  },
  qualityBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '0.375rem',
    border: '1px solid #e5e7eb',
  },
  qualityLabel: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#6b7280',
  },
  qualityIndicator: {
    display: 'flex',
    gap: '0.25rem',
    flex: 1,
  },
  qualityBarSegment: {
    width: '0.375rem',
    height: '1rem',
    borderRadius: '0.125rem',
  },
  qualityText: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#374151',
  },
  compactContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
  },
  compactLabel: {
    color: '#6b7280',
    fontWeight: '500',
  },
  compactValue: {
    fontWeight: '600',
  },
};

