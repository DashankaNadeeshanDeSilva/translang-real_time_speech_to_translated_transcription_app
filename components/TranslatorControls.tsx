'use client';

import { useState } from 'react';
import { useTranslator } from '@/hooks/useTranslator';
import { TranscriptDisplay } from './TranscriptDisplay';
import { ChatThread } from './ChatThread';
import { VADSettings } from './VADSettings';
import { ReconnectingBanner } from './ReconnectingBanner';
import { LatencyMetrics } from './LatencyMetrics';
import { LanguageSettings } from './LanguageSettings';
import { ExportControls } from './ExportControls';
import { BrowserCompatWarning } from './BrowserCompatWarning';
import { SentenceSettings } from './SentenceSettings';

/**
 * TranslatorControls Component
 * 
 * Provides UI controls for starting/stopping real-time translation.
 * Phase 4: Added reconnection handling and error recovery.
 */

export function TranslatorControls() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const {
    isRecording,
    isConnecting,
    error,
    streamingMessages,
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
    latencyMetrics,
    showMetrics,
    toggleMetrics,
    sourceLanguage,
    setSourceLanguage,
    vocabularyContext,
    setVocabularyContext,
    sentenceMode,
    setSentenceMode,
    sentenceHoldMs,
    setSentenceHoldMs,
  } = useTranslator();

  // Listen for chat behavior controls
  if (typeof window !== 'undefined') {
    window.addEventListener('chat:setGroupingWindow', (e: any) => {
      const val = Number(e.detail);
      (window as any).__CHAT_GROUPING_MS = val;
    });
    window.addEventListener('chat:setSmooth', (e: any) => {
      const val = Boolean(e.detail);
      (window as any).__CHAT_SMOOTH = val;
    });
  }

  const groupingWindowMs = (typeof window !== 'undefined' && (window as any).__CHAT_GROUPING_MS) || 4000;
  const smoothScroll = (typeof window !== 'undefined' && (window as any).__CHAT_SMOOTH) !== false; // default true

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Browser Compatibility Warning (Phase 6) */}
        <BrowserCompatWarning />
        
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

        {/* Top Controls Bar */}
        <div style={styles.topBar}>
          <button onClick={toggleSidebar} style={styles.toggleButton}>
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
          <button onClick={toggleTheme} style={styles.themeButton}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Main Layout: Left (Controls) + Right (Content) */}
        <div style={styles.mainLayout}>
          {/* LEFT SIDE: Controls (25%) */}
          <div style={{
            ...styles.leftPanel,
            width: sidebarCollapsed ? '0' : '25%',
            minWidth: sidebarCollapsed ? '0' : '300px',
            opacity: sidebarCollapsed ? 0 : 1,
            transition: 'all 0.3s ease-in-out',
            overflow: sidebarCollapsed ? 'hidden' : 'visible',
          }}>
            {/* Legend moved from header */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              marginBottom: '0.75rem',
              fontSize: '0.8125rem',
              color: '#374151',
            }}>
              <span style={{marginRight: 8}}>🟢 Green = Final</span>
              <span style={{marginRight: 8}}>🔵 Blue italic = Live</span>
              <span>🌍 DE</span>
            </div>
            {/* Status */}
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

            {/* Main Action Buttons */}
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
              
              {/* Combined mode active - streaming toggle removed */}
              
              {committedSource.length > 0 && (
                <button
                  onClick={toggleSource}
                  style={styles.sourceToggleButton}
                >
                  {showSource ? '🙈 Hide Source' : '👁️ Show Source'}
                </button>
              )}
              
              {committedTranslation.length > 0 && (
                <button
                  onClick={toggleMetrics}
                  style={styles.metricsButton}
                >
                  {showMetrics ? '📊 Hide Metrics' : '📈 Show Metrics'}
                </button>
              )}
            </div>

            {/* Language Settings (Phase 6) */}
            {!isRecording && (
              <LanguageSettings
                sourceLanguage={sourceLanguage}
                setSourceLanguage={setSourceLanguage}
                vocabularyContext={vocabularyContext}
                setVocabularyContext={setVocabularyContext}
                isRecording={isRecording}
              />
            )}

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

            {/* Sentence Settings */}
            {!isRecording && (
              <SentenceSettings
                sentenceMode={sentenceMode}
                setSentenceMode={setSentenceMode}
                sentenceHoldMs={sentenceHoldMs}
                setSentenceHoldMs={setSentenceHoldMs}
                isRecording={isRecording}
              />
            )}

            {/* Export Controls (Phase 6) */}
            {committedTranslation.length > 0 && (
              <ExportControls
                translations={committedTranslation}
                source={committedSource}
                includeSource={showSource}
              />
            )}

            {/* Latency Metrics (Phase 5) */}
            {showMetrics && (
              <LatencyMetrics
                metrics={latencyMetrics}
                isRecording={isRecording}
              />
            )}

            {/* Feature Info */}
            <div style={styles.infoBox}>
              <h3 style={styles.infoTitle}>ℹ️ Features</h3>
              <ul style={styles.infoList}>
                <li><strong>Multi-Language</strong> - 7 languages + auto-detect</li>
                <li><strong>Smart VAD</strong> - Auto-finalize on silence</li>
                <li><strong>Sentence Mode</strong> - Stitch complete sentences for better readability</li>
                <li><strong>Export</strong> - TXT, JSON, SRT formats</li>
                <li><strong>Auto-Reconnect</strong> - Resilient connection</li>
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE: Content - expands when sidebar hidden */}
          <div style={{
            ...styles.rightPanel,
            flex: sidebarCollapsed ? '1' : '1',
            marginLeft: sidebarCollapsed ? '0' : '0',
            transition: 'all 0.3s ease-in-out',
            maxWidth: sidebarCollapsed ? '100%' : '75%',
          }}>
            {/* App Header & Intro */}
            <div style={styles.appHeader}>
              <h1 style={styles.appTitle}>TransLang</h1>
              <p style={styles.appIntro}>
                Real-time speech translation.
              </p>
            </div>

            {/* Chat-style unified thread with natural sentence flow + diarization */}
            <div style={{
              display:'flex', 
              flexDirection:'column', 
              height:'70vh',
              width: '100%',
              maxWidth: sidebarCollapsed ? '100%' : '75%',
              transition: 'all 0.3s ease-in-out',
            }}>
              <ChatThread 
                committed={committedTranslation} 
                liveText={liveTranslation} 
                isRecording={isRecording}
                groupingWindowMs={groupingWindowMs}
                smoothScroll={smoothScroll}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Updated styles for new layout
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'var(--bg-primary)',
    transition: 'background-color 0.3s ease',
  },
  card: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '1rem',
    padding: '2rem',
    maxWidth: '1600px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid var(--border-color)',
    transition: 'all 0.3s ease',
  },
  mainLayout: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
    width: '100%',
  },
  leftPanel: {
    flex: '0 0 25%',
    minWidth: '300px',
  },
  rightPanel: {
    flex: '1',
    minWidth: '0',
    width: '100%',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    padding: '0.5rem 0',
  },
  toggleButton: {
    background: 'var(--accent-primary)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  themeButton: {
    background: 'var(--accent-secondary)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
  },
  appHeader: {
    marginBottom: '2rem',
    textAlign: 'center' as const,
  },
  appTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: 'var(--text-primary)',
    background: 'linear-gradient(135deg, var(--accent-primary) 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  appIntro: {
    fontSize: '1.125rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '1rem',
    maxWidth: '600px',
    margin: '0 auto 1rem auto',
  },
  statusIndicator: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    display: 'inline-block',
  },
  statusText: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500',
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
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  primaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
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
    width: '100%',
  },
  stopButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
  },
  sourceToggleButton: {
    padding: '0.75rem 1rem',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
  },
  metricsButton: {
    padding: '0.75rem 1rem',
    backgroundColor: '#06b6d4',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
  },
  infoBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginTop: '1rem',
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

