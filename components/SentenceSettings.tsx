'use client';

interface SentenceSettingsProps {
  sentenceMode: boolean;
  setSentenceMode: (enabled: boolean) => void;
  sentenceHoldMs: number;
  setSentenceHoldMs: (ms: number) => void;
  isRecording: boolean;
}

export function SentenceSettings({
  sentenceMode,
  setSentenceMode,
  sentenceHoldMs,
  setSentenceHoldMs,
  isRecording,
}: SentenceSettingsProps) {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        📝 Sentence Mode
      </h3>
      
      <div style={styles.setting}>
        <div style={styles.toggleContainer}>
          <label style={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={sentenceMode}
              onChange={(e) => setSentenceMode(e.target.checked)}
              disabled={isRecording}
              style={styles.toggleInput}
            />
            <span style={styles.toggleSlider}>
              <span style={styles.toggleSliderInner}></span>
            </span>
          </label>
          <span style={styles.toggleText}>
            {sentenceMode ? 'ON' : 'OFF'}
          </span>
        </div>
        <p style={styles.description}>
          {sentenceMode 
            ? 'Complete sentences will be stitched together for better readability'
            : 'Translations will appear as they are finalized (faster display)'
          }
        </p>
      </div>

      {sentenceMode && (
        <div style={styles.setting}>
          <label style={styles.sliderLabel}>
            Sentence Hold: {sentenceHoldMs}ms
          </label>
          <input
            type="range"
            min="300"
            max="900"
            step="50"
            value={sentenceHoldMs}
            onChange={(e) => setSentenceHoldMs(Number(e.target.value))}
            disabled={isRecording}
            style={styles.slider}
          />
          <div style={styles.sliderLabels}>
            <span>Fast (300ms)</span>
            <span>Slow (900ms)</span>
          </div>
          <p style={styles.sliderDescription}>
            How long to wait for sentence continuation. Higher values = more complete sentences but slightly more delay.
          </p>
        </div>
      )}

      {sentenceMode && (
        <div style={styles.statusBox}>
          <span style={styles.statusIcon}>✅</span>
          <span style={styles.statusText}>
            Sentence Mode Active: Holding for {sentenceHoldMs}ms to stitch complete sentences
          </span>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: '0.75rem',
    padding: '1.25rem',
    marginBottom: '1rem',
    border: '1px solid #e2e8f0',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  setting: {
    marginBottom: '1rem',
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.5rem',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  toggleInput: {
    display: 'none',
  },
  toggleSlider: {
    width: '3rem',
    height: '1.5rem',
    backgroundColor: '#d1d5db',
    borderRadius: '9999px',
    position: 'relative' as const,
    transition: 'background-color 0.2s',
  },
  toggleSliderInner: {
    width: '1.25rem',
    height: '1.25rem',
    backgroundColor: 'white',
    borderRadius: '50%',
    position: 'absolute' as const,
    top: '0.125rem',
    left: '0.125rem',
    transition: 'transform 0.2s',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  toggleText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
  },
  description: {
    fontSize: '0.8125rem',
    color: '#6b7280',
    lineHeight: '1.4',
    marginLeft: '0',
  },
  sliderLabel: {
    fontSize: '0.8125rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem',
    display: 'block',
  },
  slider: {
    width: '100%',
    height: '0.5rem',
    borderRadius: '0.25rem',
    background: '#e5e7eb',
    outline: 'none',
    marginBottom: '0.5rem',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginBottom: '0.5rem',
  },
  sliderDescription: {
    fontSize: '0.75rem',
    color: '#6b7280',
    lineHeight: '1.3',
  },
  statusBox: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #bbf7d0',
    borderRadius: '0.5rem',
    padding: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  statusIcon: {
    fontSize: '1rem',
  },
  statusText: {
    fontSize: '0.8125rem',
    color: '#065f46',
    fontWeight: '500',
  },
};
