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

    // Always scroll to bottom when recording or near bottom
    if (isRecording || isNearBottom()) {
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

  // Force scroll to bottom when recording starts
  useEffect(() => {
    if (isRecording) {
      const el = containerRef.current;
      if (!el) return;
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [isRecording]);

  const handleJumpToPresent = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setHasUnread(false);
    setShowJump(false);
  }, []);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto p-6 bg-transparent">
      <div className="flex flex-col">
        {messages.map(m => (
          <ChatMessage key={m.id} msg={m} />
        ))}
      </div>

      {showJump && (
        <div 
          onClick={handleJumpToPresent}
          className="sticky bottom-4 mx-auto w-fit bg-primary text-primary-foreground px-4 py-2 rounded-full cursor-pointer shadow-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          {hasUnread ? 'New messages — Jump to present' : 'Jump to present'}
        </div>
      )}
    </div>
  );
}
