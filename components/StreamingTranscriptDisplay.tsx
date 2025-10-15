/**
 * Streaming Transcript Display Component
 * 
 * Modern chat-style transcript display with real-time streaming updates.
 * Features efficient auto-scroll, typing animations, and clean UI.
 * 
 * Key Features:
 * - Chat-style message layout with speaker tracking
 * - Real-time typing animations with word-level updates
 * - Efficient auto-scroll that doesn't interfere with user scrolling
 * - Clean, minimal design with essential colors only
 * - Performance optimized for high-frequency updates
 * 
 * Phase 8.5 Implementation - Chat-Style Streaming
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StreamingMessage } from './StreamingMessage';
import { StreamingMessage as StreamingMessageType, StreamingUpdate } from '@/utils/streamingTokenProcessor';

interface StreamingTranscriptDisplayProps {
  messages: StreamingMessageType[];
  isRecording: boolean;
  onScrollToBottom?: () => void;
}

export function StreamingTranscriptDisplay({
  messages,
  isRecording,
  onScrollToBottom,
}: StreamingTranscriptDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if user is near bottom of scroll area
  const checkIfNearBottom = useCallback(() => {
    if (!scrollContainerRef.current) return false;
    
    const container = scrollContainerRef.current;
    const threshold = 100; // pixels from bottom
    
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Efficient auto-scroll to bottom
  const scrollToBottom = useCallback((force = false) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isNear = checkIfNearBottom();
    
    // Only auto-scroll if user is near bottom or forced
    if (force || isNear || !isUserScrolling) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: force ? 'auto' : 'smooth',
      });
      setIsNearBottom(true);
      setShowScrollButton(false);
    }
  }, [checkIfNearBottom, isUserScrolling]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isNear = checkIfNearBottom();
    
    setIsNearBottom(isNear);
    setShowScrollButton(!isNear);
    
    // Detect user-initiated scrolling
    setIsUserScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Reset user scrolling flag after scroll stops
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);
  }, [checkIfNearBottom]);

  // Handle new messages or updates
  useEffect(() => {
    const hasNewMessages = messages.length > lastMessageCount;
    const latestMessage = messages[messages.length - 1];
    const isLatestMessageActive = latestMessage?.isActive;
    
    setLastMessageCount(messages.length);
    
    // Auto-scroll on new messages or active updates
    if (hasNewMessages || isLatestMessageActive) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages, lastMessageCount, scrollToBottom]);

  // Handle recording state changes
  useEffect(() => {
    if (!isRecording && messages.length > 0) {
      // Final scroll when recording stops
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [isRecording, messages.length, scrollToBottom]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, []);

  // Manual scroll to bottom
  const handleScrollToBottom = useCallback(() => {
    scrollToBottom(true);
    onScrollToBottom?.();
  }, [scrollToBottom, onScrollToBottom]);

  const hasMessages = messages.length > 0;

  return (
    <div style={styles.container}>
      {/* Header */}
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

      {/* Messages Container */}
      <div 
        ref={scrollContainerRef}
        style={styles.messagesContainer}
        onScroll={handleScroll}
      >
        {!hasMessages && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <p style={styles.emptyText}>
              {isRecording 
                ? 'Start speaking to see translations appear here...' 
                : 'Begin translation to start the conversation'
              }
            </p>
          </div>
        )}

        {hasMessages && (
          <div style={styles.messagesList}>
            {messages.map((message, index) => (
              <StreamingMessage
                key={message.id}
                message={message}
                isLatest={index === messages.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <div style={styles.scrollButton} onClick={handleScrollToBottom}>
          <span style={styles.scrollButtonIcon}>↓</span>
          <span style={styles.scrollButtonText}>New messages</span>
        </div>
      )}

      {/* Footer */}
      {hasMessages && (
        <div style={styles.footer}>
          <span style={styles.footerText}>
            {messages.length} message{messages.length !== 1 ? 's' : ''}
            {isRecording && ' • Live'}
          </span>
        </div>
      )}
    </div>
  );
}

// Styles - Clean, modern, minimal colors
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
    backgroundColor: '#fef2f2',
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

  messagesContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '1rem',
    minHeight: '400px',
    maxHeight: '600px',
    scrollBehavior: 'smooth' as const,
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '300px',
    color: '#9ca3af',
  },

  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },

  emptyText: {
    fontSize: '0.875rem',
    textAlign: 'center' as const,
    maxWidth: '300px',
    lineHeight: '1.5',
  },

  messagesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },

  scrollButton: {
    position: 'absolute' as const,
    bottom: '5rem',
    right: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    zIndex: 10,
  },

  scrollButtonIcon: {
    fontSize: '1rem',
    fontWeight: 'bold',
  },

  scrollButtonText: {
    fontSize: '0.875rem',
    fontWeight: '500',
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
