import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TranscriptLine } from '@/hooks/useTranslator';
import { ChatMessage, ChatMessageModel } from './ChatMessage';

interface ChatThreadProps {
  committed: TranscriptLine[];
  liveText: string;
  isRecording: boolean;
  groupingWindowMs?: number; // default 4000
  smoothScroll?: boolean; // immediate vs smooth
}

export function ChatThread({ committed, liveText, isRecording, groupingWindowMs = 4000, smoothScroll = true }: ChatThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const lastUserScrollAtRef = useRef(0);
  const [showJump, setShowJump] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Build chat message list with grouping markers
  const messages: ChatMessageModel[] = useMemo(() => {
    const out: ChatMessageModel[] = [];
    let lastSpeaker: string | undefined;
    let lastTime = 0;

    for (const line of committed) {
      const startsGroup = line.speaker !== lastSpeaker || (line.timestamp - lastTime) > groupingWindowMs;
      out.push({
        id: line.id,
        speaker: line.speaker,
        text: line.text,
        timestamp: line.timestamp,
        startsGroup,
      });
      lastSpeaker = line.speaker;
      lastTime = line.timestamp;
    }

    if (liveText) {
      const now = Date.now();
      const last = out[out.length - 1];
      out.push({
        id: `live-${now}`,
        speaker: last?.speaker,
        text: liveText,
        timestamp: now,
        isLive: true,
        startsGroup: false,
      });
    }

    return out;
  }, [committed, liveText, groupingWindowMs]);

  // Near-bottom detection
  const isNearBottom = () => {
    const el = containerRef.current;
    if (!el) return true;
    const threshold = 120; // px
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  // User scroll detection
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      isUserScrollingRef.current = !isNearBottom();
      if (isUserScrollingRef.current) lastUserScrollAtRef.current = performance.now();
      // Hide jump if user reached bottom
      setShowJump(!isNearBottom());
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-scroll when new messages arrive and user near bottom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Scroll only if user is near bottom
    if (isNearBottom()) {
      if (smoothScroll) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      } else {
        // Use rAF to batch immediate updates
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      }
      setHasUnread(false);
      setShowJump(false);
    } else {
      // User is reading history; mark unread
      setHasUnread(true);
      setShowJump(true);
    }
  }, [messages.length, isRecording, smoothScroll]);

  const handleJumpToPresent = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setHasUnread(false);
    setShowJump(false);
  }, []);

  return (
    <div ref={containerRef} style={styles.container}>
      <div style={styles.list}>
        {messages.map(m => (
          <ChatMessage key={m.id} msg={m} />
        ))}
      </div>

      {showJump && (
        <div style={styles.jumpPill} onClick={handleJumpToPresent}>
          {hasUnread ? 'New messages — Jump to present' : 'Jump to present'}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    overflowY: 'auto' as const,
    padding: '1rem',
    backgroundColor: 'transparent',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  jumpPill: {
    position: 'sticky' as const,
    bottom: '0.75rem',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 'fit-content',
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '0.5rem 0.75rem',
    borderRadius: '9999px',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
  },
};
