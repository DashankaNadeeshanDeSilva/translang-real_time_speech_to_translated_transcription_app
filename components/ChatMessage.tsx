import React from 'react';

export interface ChatMessageModel {
  id: string;
  speaker?: string;
  text: string;
  timestamp: number;
  isLive?: boolean;
  startsGroup?: boolean;
}

interface ChatMessageProps {
  msg: ChatMessageModel;
}

export function ChatMessage({ msg }: ChatMessageProps) {
  const timeText = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div style={styles.container}>
      {msg.startsGroup && (
        <div style={styles.header}>
          <span style={styles.speakerIcon}>👤</span>
          <span style={styles.speakerLabel}>Speaker {msg.speaker || 'unknown'}</span>
        </div>
      )}
      <div style={{...styles.bubble, ...(msg.isLive ? styles.live : {})}}>
        <span style={styles.text}>{msg.text}{msg.isLive && <span style={styles.cursor}>|</span>}</span>
        <span style={styles.bubbleTime}>{timeText}</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#6b7280',
    fontSize: '0.75rem',
  },
  speakerIcon: { fontSize: '0.9rem' },
  speakerLabel: { fontWeight: 600 as const },
  time: { marginLeft: 'auto' },
  bubble: {
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    padding: '0.5rem 0.75rem',
    color: '#111827',
    lineHeight: 1.6,
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
    justifyContent: 'space-between',
  },
  text: { flex: 1 },
  live: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  cursor: {
    marginLeft: 2,
    color: '#6b7280',
    animation: 'blink 1s infinite',
  },
  bubbleTime: {
    color: '#9ca3af',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap' as const,
    marginLeft: '0.5rem',
  },
};
