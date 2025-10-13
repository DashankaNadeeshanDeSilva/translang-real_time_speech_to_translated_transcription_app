'use client';

/**
 * VAD Settings Component
 * 
 * Provides UI controls for configuring Voice Activity Detection settings.
 * 
 * Phase 3 Implementation
 */

interface VADSettingsProps {
  vadEnabled: boolean;
  toggleVAD: () => void;
  silenceThreshold: number;
  setSilenceThreshold: (threshold: number) => void;
  isRecording: boolean;
}

export function VADSettings({
  vadEnabled,
  toggleVAD,
  silenceThreshold,
  setSilenceThreshold,
  isRecording,
}: VADSettingsProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.title}>⚙️ Voice Activity Detection (VAD)</h4>
      </div>

      <div style={styles.content}>
        {/* VAD Toggle */}
        <div style={styles.setting}>
          <div style={styles.settingInfo}>
            <span style={styles.settingLabel}>Enable VAD</span>
            <span style={styles.settingDescription}>
              Automatically finalize translations during pauses
            </span>
          </div>
          <button
            onClick={toggleVAD}
            disabled={isRecording}
            style={{
              ...styles.toggleButton,
              backgroundColor: vadEnabled ? '#10b981' : '#6b7280',
            }}
          >
            {vadEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Silence Threshold */}
        {vadEnabled && (
          <div style={styles.setting}>
            <div style={styles.settingInfo}>
              <span style={styles.settingLabel}>
                Silence Threshold: {silenceThreshold}ms
              </span>
              <span style={styles.settingDescription}>
                Duration of silence before auto-finalizing
              </span>
            </div>
            <input
              type="range"
              min="300"
              max="2000"
              step="100"
              value={silenceThreshold}
              onChange={(e) => setSilenceThreshold(Number(e.target.value))}
              disabled={isRecording}
              style={styles.slider}
            />
            <div style={styles.sliderLabels}>
              <span>Fast (300ms)</span>
              <span>Slow (2000ms)</span>
            </div>
          </div>
        )}

        {/* Status Information */}
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            {vadEnabled ? (
              <>
                <strong>✅ VAD Active:</strong> Translations will auto-finalize after{' '}
                {silenceThreshold}ms of silence.
              </>
            ) : (
              <>
                <strong>⏸️ VAD Disabled:</strong> Using Soniox&apos;s automatic endpoint detection only.
              </>
            )}
          </p>
          {isRecording && (
            <p style={styles.warningText}>
              ⚠️ Settings locked during recording
            </p>
          )}
        </div>
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
  setting: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  settingInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1f2937',
  },
  settingDescription: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.25rem',
    display: 'block',
  },
  toggleButton: {
    padding: '0.375rem 0.75rem',
    borderRadius: '0.375rem',
    border: 'none',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    minWidth: '60px',
    transition: 'all 0.2s',
  },
  slider: {
    width: '100%',
    height: '0.5rem',
    borderRadius: '9999px',
    outline: 'none',
    opacity: 0.9,
    transition: 'opacity 0.2s',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.625rem',
    color: '#9ca3af',
    marginTop: '-0.25rem',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #dbeafe',
    borderRadius: '0.375rem',
    padding: '0.75rem',
  },
  infoText: {
    fontSize: '0.75rem',
    color: '#1e40af',
    margin: 0,
    lineHeight: '1.5',
  },
  warningText: {
    fontSize: '0.75rem',
    color: '#f59e0b',
    margin: '0.5rem 0 0 0',
    fontWeight: '500',
  },
};

