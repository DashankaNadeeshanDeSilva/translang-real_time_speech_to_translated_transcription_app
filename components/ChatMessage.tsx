import React from 'react';
import { User } from 'lucide-react';

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

// Shadcn-inspired color palette for different speakers
const speakerColors = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-100' }, // Speaker 1
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', badge: 'bg-green-100' }, // Speaker 2
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', badge: 'bg-purple-100' }, // Speaker 3
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', badge: 'bg-amber-100' }, // Speaker 4
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', badge: 'bg-rose-100' }, // Speaker 5
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', badge: 'bg-cyan-100' }, // Speaker 6
];

function getSpeakerColor(speaker?: string) {
  if (!speaker) return speakerColors[0];
  const speakerNum = parseInt(speaker) || 1;
  return speakerColors[(speakerNum - 1) % speakerColors.length];
}

export function ChatMessage({ msg }: ChatMessageProps) {
  const timeText = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const colorScheme = getSpeakerColor(msg.speaker);
  
  return (
    <div className="flex flex-col gap-1 mb-3">
      {msg.startsGroup && (
        <div className="flex items-center gap-2 mb-1">
          <div className={`flex items-center justify-center w-6 h-6 rounded-full ${colorScheme.badge}`}>
            <User className={`w-3 h-3 ${colorScheme.text}`} />
          </div>
          <span className={`text-xs font-semibold ${colorScheme.text}`}>
            Speaker {msg.speaker || 'unknown'}
          </span>
        </div>
      )}
      <div className={`
        rounded-2xl border px-4 py-2.5 max-w-[85%] shadow-sm
        ${colorScheme.bg} ${colorScheme.border}
        ${msg.isLive ? 'border-2 shadow-md' : ''}
        transition-all duration-200
      `}>
        <div className="flex items-end gap-3">
          <span className={`flex-1 text-sm leading-relaxed ${colorScheme.text}`}>
            {msg.text}
            {msg.isLive && (
              <span className={`ml-1 animate-pulse ${colorScheme.text}`}>●</span>
            )}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeText}
          </span>
        </div>
      </div>
    </div>
  );
}
