'use client';

import { useCallback, useRef, useEffect } from 'react';
import { TranscriptLine } from '@/hooks/useTranslator';

/**
 * TranscriptDisplay Component
 * 
 * Displays committed and live translation lines with auto-scrolling.
 * 
 * Features:
 * - Committed lines (final, confirmed text)
 * - Live line (non-final, updating text)
 * - Auto-scroll to bottom on new content
 * - Visual distinction between committed and live
 * - Optional source text display
 * 
 * Phase 2 Implementation
 */

interface TranscriptDisplayProps {
  committedTranslation: TranscriptLine[];
  liveTranslation: string;
  committedSource?: TranscriptLine[];
  liveSource?: string;
  showSource?: boolean;
  isRecording: boolean;
}

export function TranscriptDisplay({
  committedTranslation,
  liveTranslation,
  committedSource = [],
  liveSource = '',
  showSource = false,
  isRecording,
}: TranscriptDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevCommittedLengthRef = useRef(0);
  const lastScrollHeightRef = useRef(0);
  const pendingScrollRef = useRef(false);

  // Immediate scroll function that runs synchronously with content changes
  const scrollToBottom = useCallback((immediate = false) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const currentScrollHeight = container.scrollHeight;
      
      if (immediate) {
        // Immediate scroll without animation
        container.scrollTop = currentScrollHeight;
        lastScrollHeightRef.current = currentScrollHeight;
      } else {
        // Smooth scroll for better UX
        container.scrollTo({
          top: currentScrollHeight,
          behavior: 'smooth',
        });
        lastScrollHeightRef.current = currentScrollHeight;
      }
    }
  }, []);

  // Pre-emptive scroll: scroll immediately when we detect new content
  const hasNewCommittedContent = committedTranslation.length > prevCommittedLengthRef.current;
  const hasSignificantLiveContent = liveTranslation.length > 50 && isRecording;
  
  if (hasNewCommittedContent || hasSignificantLiveContent) {
    // Immediate scroll to prepare for new content
    scrollToBottom(true);
    pendingScrollRef.current = true;
    prevCommittedLengthRef.current = committedTranslation.length;
  }

  // Final scroll after DOM updates (using useEffect for this)
  useEffect(() => {
    if (pendingScrollRef.current && scrollContainerRef.current) {
      // Small delay to ensure DOM is fully updated
      const timeoutId = setTimeout(() => {
        scrollToBottom(false);
        pendingScrollRef.current = false;
      }, 10); // Very small delay to ensure DOM update
      
      return () => clearTimeout(timeoutId);
    }
  }, [committedTranslation.length, liveTranslation, scrollToBottom]);

  const hasContent = 
    committedTranslation.length > 0 || 
    liveTranslation.length > 0 ||
    committedSource.length > 0 ||
    liveSource.length > 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          {isRecording ? '🎙️ Live Translation' : '📝 Transcript'}
        </h3>
        {isRecording && (
          <div style={styles.recordingIndicator}>
            <span style={styles.recordingDot}></span>
            <span style={styles.recordingText}>Recording</span>
          </div>
        )}
      </div>

      <div 
        ref={scrollContainerRef}
        style={styles.scrollContainer}
      >
        {!hasContent && (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>
              {isRecording 
                ? 'Speak in German to see translations appear here...' 
                : 'Start translation to begin'}
            </p>
          </div>
        )}

        {hasContent && (
          <div style={styles.content}>
            {/* Translation Lines */}
            <div style={styles.section}>
              <div style={styles.sectionLabel}>English Translation</div>
              
              {/* Committed translation lines */}
              {committedTranslation.map((line) => (
                <div key={line.id} style={styles.committedLine}>
                  {line.speaker && (
                    <div style={styles.speakerLabel}>
                      Speaker {line.speaker}
                    </div>
                  )}
                  <div style={styles.lineText}>
                    {line.text}
                  </div>
                </div>
              ))}

              {/* Live translation line */}
              {liveTranslation && (
                <div style={styles.liveLine}>
                  {liveTranslation}
                  <span style={styles.cursor}>▊</span>
                </div>
              )}
            </div>

            {/* Source Lines (optional) */}
            {showSource && (committedSource.length > 0 || liveSource) && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>German Original</div>
                
                {/* Committed source lines */}
                {committedSource.map((line) => (
                  <div key={line.id} style={styles.committedSourceLine}>
                    {line.speaker && (
                      <div style={styles.speakerLabelSource}>
                        Speaker {line.speaker}
                      </div>
                    )}
                    <div style={styles.lineText}>
                      {line.text}
                    </div>
                  </div>
                ))}

                {/* Live source line */}
                {liveSource && (
                  <div style={styles.liveSourceLine}>
                    {liveSource}
                    <span style={styles.cursor}>▊</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {hasContent && (
        <div style={styles.footer}>
          <span style={styles.footerText}>
            {committedTranslation.length} line{committedTranslation.length !== 1 ? 's' : ''} translated
          </span>
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  recordingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: '#fee2e2',
    borderRadius: '9999px',
  },
  recordingDot: {
    width: '0.5rem',
    height: '0.5rem',
    backgroundColor: '#ef4444',
    borderRadius: '50%',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  recordingText: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#991b1b',
  },
  scrollContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '1.5rem',
    minHeight: '700px',
    maxHeight: '900px',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '200px',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '0.875rem',
    textAlign: 'center' as const,
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  },
  committedLine: {
    padding: '0.875rem 1.125rem',
    backgroundColor: '#f0fdf4',
    border: '2px solid #bbf7d0',
    borderRadius: '0.5rem',
    wordWrap: 'break-word' as const,
    animation: 'fadeInUp 0.3s ease-out',
    transition: 'all 0.2s ease',
  },
  speakerLabel: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  speakerLabelSource: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#b45309',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  lineText: {
    fontSize: '1.125rem',
    lineHeight: '1.6',
    color: 'inherit',
    fontWeight: '500' as const,
  },
  liveLine: {
    padding: '0.875rem 1.125rem',
    backgroundColor: '#eff6ff',
    border: '2px solid #bfdbfe',
    borderRadius: '0.5rem',
    fontSize: '1.125rem',
    lineHeight: '1.6',
    color: '#1e40af',
    fontStyle: 'italic' as const,
    wordWrap: 'break-word' as const,
    opacity: 0.9,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontWeight: '500' as const,
    animation: 'scaleIn 0.2s ease-out',
    transition: 'all 0.15s ease',
  },
  committedSourceLine: {
    padding: '1rem 1.25rem',
    backgroundColor: '#fef3c7',
    border: '2px solid #fde047',
    borderRadius: '0.75rem',
    color: '#92400e',
    wordWrap: 'break-word' as const,
  },
  liveSourceLine: {
    padding: '1rem 1.25rem',
    backgroundColor: '#fef9c3',
    border: '2px solid #fef08a',
    borderRadius: '0.75rem',
    fontSize: '1.125rem',
    lineHeight: '1.75',
    color: '#713f12',
    fontStyle: 'italic' as const,
    wordWrap: 'break-word' as const,
    opacity: 0.85,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontWeight: '500' as const,
  },
  cursor: {
    display: 'inline-block',
    animation: 'blink 1s step-end infinite',
    marginLeft: '2px',
  },
  footer: {
    padding: '0.75rem 1.5rem',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  footerText: {
    fontSize: '0.75rem',
    color: '#6b7280',
  },
};

