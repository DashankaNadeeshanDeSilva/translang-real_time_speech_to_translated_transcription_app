/**
 * Streaming Message Component
 * 
 * Displays individual messages in chat-style format with typing animations.
 * Shows speaker labels and handles final/mutable text regions with smooth transitions.
 * 
 * Features:
 * - Clean, modern chat-style layout
 * - Smooth typing animation for mutable text
 * - Speaker badges with minimal color usage
 * - Blinking cursor for active messages
 * - Word-by-word updates with diff reconciliation
 * 
 * Phase 8.5 Implementation - Chat-Style Streaming
 */

import React, { useEffect, useRef, useState } from 'react';
import { StreamingMessage as StreamingMessageType } from '@/utils/streamingTokenProcessor';

interface StreamingMessageProps {
  message: StreamingMessageType;
  showSpeaker?: boolean;
  isLatest?: boolean;
}

export function StreamingMessage({ 
  message, 
  showSpeaker = true, 
  isLatest = false 
}: StreamingMessageProps) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const finalTextRef = useRef<HTMLSpanElement>(null);
  const mutableTextRef = useRef<HTMLSpanElement>(null);

  // Update display text when message changes
  useEffect(() => {
    if (message.finalText && message.mutableText) {
      setDisplayText(message.finalText + message.mutableText);
    } else if (message.finalText) {
      setDisplayText(message.finalText);
    } else if (message.mutableText) {
      setDisplayText(message.mutableText);
    } else {
      setDisplayText('');
    }
  }, [message.finalText, message.mutableText]);

  // Handle cursor animation for active messages
  useEffect(() => {
    if (message.isActive && isLatest) {
      const interval = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 530); // Blink every 530ms for natural feel

      return () => clearInterval(interval);
    } else {
      setShowCursor(false);
    }
  }, [message.isActive, isLatest]);

  // Auto-scroll into view when this is the latest message
  useEffect(() => {
    if (isLatest && message.isActive) {
      finalTextRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [isLatest, message.isActive, displayText]);

  const hasContent = displayText.trim().length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <div style={styles.messageContainer}>
      {/* Speaker Badge */}
      {showSpeaker && message.speaker && (
        <div style={styles.speakerBadge}>
          <span style={styles.speakerIcon}>👤</span>
          <span style={styles.speakerLabel}>Speaker {message.speaker}</span>
        </div>
      )}

      {/* Message Content */}
      <div style={styles.messageContent}>
        {/* Final Text (committed, never changes) */}
        {message.finalText && (
          <span ref={finalTextRef} style={styles.finalText}>
            {message.finalText}
          </span>
        )}

        {/* Mutable Text (currently being typed) */}
        {message.mutableText && (
          <span ref={mutableTextRef} style={styles.mutableText}>
            {message.mutableText}
            {/* Blinking cursor for active messages */}
            {message.isActive && showCursor && (
              <span style={styles.cursor}>|</span>
            )}
          </span>
        )}

        {/* Cursor for empty messages that are active */}
        {!message.finalText && !message.mutableText && message.isActive && showCursor && (
          <span style={styles.cursor}>|</span>
        )}
      </div>

      {/* Timestamp (optional, subtle) */}
      <div style={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
}

// Styles - Clean and modern, minimal colors
const styles = {
  messageContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: '1rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#ffffff',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    border: '1px solid #f3f4f6',
  },

  speakerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.375rem',
    alignSelf: 'flex-start',
  },

  speakerIcon: {
    fontSize: '0.75rem',
    opacity: 0.7,
  },

  speakerLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.025em',
  },

  messageContent: {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#1f2937',
    fontWeight: '400',
    wordWrap: 'break-word' as const,
    minHeight: '1.2em', // Prevent layout shift
  },

  finalText: {
    color: '#1f2937',
    // No special styling for final text - it's just regular text
  },

  mutableText: {
    color: '#374151',
    position: 'relative' as const,
    // Subtle difference for mutable text
  },

  cursor: {
    display: 'inline-block',
    marginLeft: '1px',
    color: '#6b7280',
    fontWeight: '300',
    animation: 'blink 1s infinite',
  },

  timestamp: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: '0.5rem',
    textAlign: 'right' as const,
    opacity: 0.8,
  },
};

// Add CSS animation for cursor blink (only on client side)
if (typeof document !== 'undefined') {
  const cursorBlinkStyle = document.createElement('style');
  cursorBlinkStyle.textContent = `
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `;
  document.head.appendChild(cursorBlinkStyle);
}
