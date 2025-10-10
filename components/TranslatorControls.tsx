'use client';

import { useTranslator } from '@/hooks/useTranslator';
import { TranscriptDisplay } from './TranscriptDisplay';
import { VADSettings } from './VADSettings';
import { ReconnectingBanner } from './ReconnectingBanner';

/**
 * TranslatorControls Component
 * 
 * Provides UI controls for starting/stopping real-time translation.
 * Phase 4: Added reconnection handling and error recovery.
 */

export function TranslatorControls() {
  const {
    isRecording,
    isConnecting,
    error,
    committedTranslation,
    liveTranslation,
    committedSource,
    liveSource,
    startTranslation,
    stopTranslation,
    cancelTranslation,
    clearTranscript,
    showSource,
    toggleSource,
    vadEnabled,
    toggleVAD,
    silenceThreshold,
    setSilenceThreshold,
    isReconnecting,
    retryCount,
    maxRetries,
    reconnectionMessage,
  } = useTranslator();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Real-Time German → English Translation</h2>
        
        <div style={styles.statusContainer}>
          <div style={styles.statusBadge}>
            {isConnecting && (
              <>
                <span style={styles.statusDot('#fbbf24')}></span>
                <span>Connecting...</span>
              </>
            )}
            {isRecording && (
              <>
                <span style={styles.statusDot('#10b981')}></span>
                <span>Recording & Translating</span>
              </>
            )}
            {!isConnecting && !isRecording && (
              <>
                <span style={styles.statusDot('#6b7280')}></span>
                <span>Ready</span>
              </>
            )}
          </div>
        </div>

        {/* Reconnection Banner (Phase 4) */}
        <ReconnectingBanner
          isReconnecting={isReconnecting}
          retryCount={retryCount}
          maxRetries={maxRetries}
          errorMessage={reconnectionMessage}
        />

        {error && !isReconnecting && (
          <div style={styles.errorBox}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={styles.instructions}>
          <p><strong>Phase 4: Resilient Real-Time Translation</strong></p>
          <p>Click "Start Translation" and speak in German. Auto-reconnects if connection drops!</p>
          <p>
            🟢 Green = Final | 🔵 Blue italic = Live<br />
            {vadEnabled ? `⏸️ Auto-finalize after ${silenceThreshold}ms silence` : '⏸️ VAD disabled'}<br />
            🔄 Auto-reconnect up to {maxRetries} times on errors
          </p>
        </div>

        <div style={styles.buttonContainer}>
          {!isRecording && !isConnecting && (
            <>
              <button
                onClick={startTranslation}
                style={styles.primaryButton}
                disabled={isConnecting}
              >
                🎤 Start Translation
              </button>
              
              {committedTranslation.length > 0 && (
                <button
                  onClick={clearTranscript}
                  style={styles.secondaryButton}
                >
                  🗑️ Clear
                </button>
              )}
            </>
          )}
          
          {(isRecording || isConnecting) && (
            <>
              <button
                onClick={stopTranslation}
                style={styles.stopButton}
                disabled={isConnecting}
              >
                ⏹️ Stop
              </button>
              
              <button
                onClick={cancelTranslation}
                style={styles.cancelButton}
                disabled={isConnecting}
              >
                ❌ Cancel
              </button>
            </>
          )}
          
          {committedSource.length > 0 && (
            <button
              onClick={toggleSource}
              style={styles.toggleButton}
            >
              {showSource ? '🙈 Hide German' : '👁️ Show German'}
            </button>
          )}
        </div>

        {/* VAD Settings (Phase 3) */}
        {!isRecording && (
          <VADSettings
            vadEnabled={vadEnabled}
            toggleVAD={toggleVAD}
            silenceThreshold={silenceThreshold}
            setSilenceThreshold={setSilenceThreshold}
            isRecording={isRecording}
          />
        )}

        {/* Translation Display */}
        <TranscriptDisplay
          committedTranslation={committedTranslation}
          liveTranslation={liveTranslation}
          committedSource={committedSource}
          liveSource={liveSource}
          showSource={showSource}
          isRecording={isRecording}
        />

        <div style={styles.infoBox}>
          <h3 style={styles.infoTitle}>ℹ️ How it works (Phase 4)</h3>
          <ul style={styles.infoList}>
            <li><strong>Green boxes</strong> are final, confirmed translations</li>
            <li><strong>Blue italic text</strong> is live, updating as you speak</li>
            <li><strong>VAD</strong> detects silence and auto-finalizes</li>
            <li><strong>Auto-reconnect</strong> recovers from connection issues (up to {maxRetries} attempts)</li>
            <li><strong>Session recovery</strong> preserves your translations during reconnection</li>
            <li><strong>Keepalive</strong> maintains connection during pauses</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Inline styles for Phase 1 (will be replaced with proper CSS/Tailwind in Phase 5)
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '2rem',
    maxWidth: '1600px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#1f2937',
    textAlign: 'center' as const,
  },
  statusContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  statusDot: (color: string) => ({
    width: '0.75rem',
    height: '0.75rem',
    borderRadius: '50%',
    backgroundColor: color,
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  }),
  errorBox: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1rem',
    color: '#991b1b',
    fontSize: '0.875rem',
  },
  instructions: {
    backgroundColor: '#eff6ff',
    border: '1px solid #dbeafe',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
    lineHeight: '1.5',
  },
  buttonContainer: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap' as const,
  },
  primaryButton: {
    flex: '1',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '140px',
  },
  secondaryButton: {
    padding: '0.75rem 1rem',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  stopButton: {
    flex: '1',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '140px',
  },
  cancelButton: {
    flex: '1',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '140px',
  },
  toggleButton: {
    padding: '0.75rem 1rem',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  infoBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    padding: '1rem',
  },
  infoTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#374151',
  },
  infoList: {
    fontSize: '0.8125rem',
    color: '#6b7280',
    marginLeft: '1.25rem',
    lineHeight: '1.75',
  },
};

