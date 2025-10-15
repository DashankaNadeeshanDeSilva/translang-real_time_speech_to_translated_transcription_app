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
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.75rem',
    padding: '0.5rem 0.75rem',
    color: 'var(--text-primary)',
    lineHeight: 1.6,
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease',
  },
  text: { flex: 1 },
  live: {
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--accent-primary)',
  },
  cursor: {
    marginLeft: 2,
    color: 'var(--text-secondary)',
    animation: 'blink 1s infinite',
  },
  bubbleTime: {
    color: 'var(--text-tertiary)',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap' as const,
    marginLeft: '0.5rem',
  },
};
