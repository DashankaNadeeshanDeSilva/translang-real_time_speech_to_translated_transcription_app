'use client';

/**
 * Performance Settings Component
 * 
 * Advanced settings for performance tuning and optimization.
 * 
 * Phase 5 Implementation
 */

interface PerformanceSettingsProps {
  isRecording: boolean;
}

export function PerformanceSettings({
  isRecording,
}: PerformanceSettingsProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.title}>⚡ Performance Optimization</h4>
      </div>

      <div style={styles.content}>
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            <strong>Current Configuration:</strong>
          </p>
          <ul style={styles.configList}>
            <li>Sample Rate: <strong>16kHz</strong> (optimal for speech)</li>
            <li>Audio Format: <strong>Auto</strong> (Soniox detects)</li>
            <li>Buffer Size: <strong>4096 samples</strong> (VAD processing)</li>
            <li>Endpoint Detection: <strong>Enabled</strong></li>
            <li>Model: <strong>stt-rt-preview-v2</strong> (latest)</li>
          </ul>
        </div>

        <div style={styles.tipBox}>
          <p style={styles.tipTitle}>💡 Optimization Tips</p>
          <ul style={styles.tipList}>
            <li>Lower VAD threshold (300-500ms) for faster finalization</li>
            <li>Higher threshold (1000-1500ms) for more accurate translations</li>
            <li>Disable VAD to rely solely on Soniox endpoint detection</li>
            <li>Use wired internet for best connection stability</li>
            <li>Close other tabs/apps for better performance</li>
          </ul>
        </div>

        {isRecording && (
          <div style={styles.warningBox}>
            <p style={styles.warningText}>
              ⚠️ Performance settings cannot be changed during active recording
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    marginTop: '1rem',
  },
  header: {
    padding: '0.75rem 1rem',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    margin: 0,
  },
  content: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  infoBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    padding: '0.75rem 1rem',
  },
  infoText: {
    fontSize: '0.8125rem',
    color: '#374151',
    margin: '0 0 0.5rem 0',
  },
  configList: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: '0 0 0 1.25rem',
    padding: 0,
    lineHeight: '1.75',
  },
  tipBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #dbeafe',
    borderRadius: '0.375rem',
    padding: '0.75rem 1rem',
  },
  tipTitle: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 0.5rem 0',
  },
  tipList: {
    fontSize: '0.75rem',
    color: '#1e40af',
    margin: '0 0 0 1.25rem',
    padding: 0,
    lineHeight: '1.75',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fde047',
    borderRadius: '0.375rem',
    padding: '0.75rem 1rem',
  },
  warningText: {
    fontSize: '0.75rem',
    color: '#92400e',
    margin: 0,
    fontWeight: '500',
  },
};

