'use client';

import { useState } from 'react';
import { useTranslator } from '@/hooks/useTranslator';
import { TranscriptDisplay } from './TranscriptDisplay';
import { ChatThread } from './ChatThread';
import { ReconnectingBanner } from './ReconnectingBanner';
import { LatencyMetrics } from './LatencyMetrics';
import { BrowserCompatWarning } from './BrowserCompatWarning';
import { ExportDialog } from './ExportDialog';
import { Mic, Square, Pause, Play, Eye, EyeOff, BarChart3, Trash2 } from 'lucide-react';

/**
 * TranslatorControls Component
 * 
 * Provides UI controls for starting/stopping real-time translation.
 * Phase 4: Added reconnection handling and error recovery.
 */

interface TranslatorControlsProps {
  onSessionEnd?: (hasEnded: boolean) => void;
}

export function TranslatorControls({ onSessionEnd }: TranslatorControlsProps = {}) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  const {
    isRecording,
    isConnecting,
    isPaused,
    error,
    streamingMessages,
    committedTranslation,
    liveTranslation,
    committedSource,
    liveSource,
    startTranslation,
    stopTranslation,
    cancelTranslation,
    pauseTranslation,
    resumeTranslation,
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

  // Handle pause/resume
  const handlePauseResume = () => {
    if (isPaused) {
      resumeTranslation();
    } else {
      pauseTranslation();
    }
  };

  // Handle stop (end session)
  const handleStop = () => {
    stopTranslation();
    onSessionEnd?.(true);
    // Show export dialog if there are translations
    if (committedTranslation.length > 0) {
      setShowExportDialog(true);
    }
  };

  // Reset session state when starting new translation
  const handleStart = async () => {
    onSessionEnd?.(false);
    await startTranslation();
  };

  // Handle clear transcript
  const handleClear = () => {
    clearTranscript();
    onSessionEnd?.(false);
    setShowExportDialog(false);
  };

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


  return (
    <div className="w-full h-full">
      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        translations={committedTranslation}
        source={committedSource}
        includeSource={showSource}
      />

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
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Main Content - Full Width */}
      <div className="w-full">
          {/* Status Bar */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isConnecting && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
                    <span className="text-sm text-muted-foreground">Connecting...</span>
                  </>
                )}
                {isRecording && !isPaused && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-sm text-muted-foreground">Recording & Translating</span>
                  </>
                )}
                {isRecording && isPaused && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    <span className="text-sm text-muted-foreground">Paused</span>
                  </>
                )}
                {!isConnecting && !isRecording && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                    <span className="text-sm text-muted-foreground">Ready</span>
                  </>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              {!isRecording && !isConnecting && (
                <button
                  onClick={handleStart}
                  disabled={isConnecting}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Mic size={16} />
                  Start Translation
                </button>
              )}
              
              {(isRecording || isConnecting) && (
                <>
                  <button
                    onClick={handlePauseResume}
                    disabled={isConnecting}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    {isPaused ? (
                      <>
                        <Play size={16} />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause size={16} />
                        Pause
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleStop}
                    disabled={isConnecting}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <Square size={16} />
                    Stop
                  </button>
                </>
              )}

              {committedTranslation.length > 0 && !isRecording && (
                <button
                  onClick={handleClear}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <Trash2 size={16} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Chat-style unified thread - Full Width */}
          <div className="flex flex-col rounded-lg border bg-card overflow-hidden" style={{ maxHeight: '80vh', height: '80vh' }}>
            <ChatThread 
              committed={committedTranslation} 
              liveText={liveTranslation} 
              isRecording={isRecording}
              groupingWindowMs={groupingWindowMs}
              smoothScroll={smoothScroll}
            />
          </div>


          {/* Latency Metrics - Optional */}
          {showMetrics && (
            <div className="mt-4">
              <LatencyMetrics
                metrics={latencyMetrics}
                isRecording={isRecording}
              />
            </div>
          )}
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
  fullWidthContainer: {
    width: '100%',
    maxWidth: '100%',
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

