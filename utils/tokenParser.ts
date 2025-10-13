/**
 * Token Parser Utilities
 * 
 * Functions for parsing, filtering, and managing Soniox translation tokens.
 * Handles the complexity of non-final vs final tokens, deduplication, and line management.
 * 
 * Phase 2 Implementation
 */

export interface Token {
  text: string;
  is_final: boolean;
  translation_status?: 'original' | 'translation' | 'none';
  language?: string;
  source_language?: string;
  start_ms?: number;
  end_ms?: number;
  confidence?: number;
  speaker?: string;  // Speaker label from diarization (e.g., "1", "2", "3")
}

export interface TokenBuffer {
  tokens: Token[];
  lastUpdateTime: number;
}

export interface TranscriptLine {
  id: string;
  text: string;
  type: 'translation' | 'source';
  isFinal: boolean;
  timestamp: number;
}

/**
 * Filter tokens by translation status
 */
export function filterTokensByStatus(
  tokens: Token[],
  status: 'original' | 'translation' | 'none'
): Token[] {
  return tokens.filter(token => token.translation_status === status);
}

/**
 * Split tokens into final and non-final groups
 */
export function splitTokensByFinality(tokens: Token[]): {
  finalTokens: Token[];
  nonFinalTokens: Token[];
} {
  const finalTokens: Token[] = [];
  const nonFinalTokens: Token[] = [];

  for (const token of tokens) {
    if (token.is_final) {
      finalTokens.push(token);
    } else {
      nonFinalTokens.push(token);
    }
  }

  return { finalTokens, nonFinalTokens };
}

/**
 * Concatenate tokens into a single string
 */
export function tokensToText(tokens: Token[]): string {
  return tokens.map(token => token.text).join('');
}

/**
 * Extract translation tokens from a result
 */
export function extractTranslationTokens(tokens: Token[]): Token[] {
  return tokens.filter(
    token => token.translation_status === 'translation'
  );
}

/**
 * Extract source (original) tokens from a result
 */
export function extractSourceTokens(tokens: Token[]): Token[] {
  return tokens.filter(
    token => token.translation_status === 'original'
  );
}

/**
 * Process incoming tokens and update buffers
 * 
 * This is the core logic that handles:
 * - Separating final from non-final tokens
 * - Committing final tokens
 * - Updating the non-final buffer
 * - Preventing duplication
 */
export function processTokenUpdate(
  incomingTokens: Token[],
  currentNonFinalBuffer: Token[]
): {
  newCommittedText: string;
  updatedNonFinalBuffer: Token[];
  liveText: string;
} {
  // Split incoming tokens
  const { finalTokens, nonFinalTokens } = splitTokensByFinality(incomingTokens);

  // Final tokens are committed immediately
  const newCommittedText = tokensToText(finalTokens);

  // Non-final tokens replace the entire buffer
  // This prevents duplication as Soniox sends the complete current state
  const updatedNonFinalBuffer = [...nonFinalTokens];

  // Rebuild live text from the updated buffer
  const liveText = tokensToText(updatedNonFinalBuffer);

  return {
    newCommittedText,
    updatedNonFinalBuffer,
    liveText,
  };
}

/**
 * Process translation tokens specifically
 * Returns both final and non-final translation tokens separately
 */
export function processTranslationTokens(
  allTokens: Token[],
  currentNonFinalBuffer: Token[]
): {
  newCommittedText: string;
  updatedBuffer: Token[];
  liveText: string;
  finalTokens: Token[];
  nonFinalTokens: Token[];
} {
  // Extract only translation tokens
  const translationTokens = extractTranslationTokens(allTokens);

  // Process them
  const result = processTokenUpdate(translationTokens, currentNonFinalBuffer);
  
  // Split into final and non-final for the new buffering system
  const { finalTokens, nonFinalTokens } = splitTokensByFinality(translationTokens);
  
  return {
    newCommittedText: result.newCommittedText,
    updatedBuffer: result.updatedNonFinalBuffer,
    liveText: result.liveText,
    finalTokens,
    nonFinalTokens,
  };
}

/**
 * Process source (original) tokens specifically
 * Also extracts speaker information
 */
export function processSourceTokens(
  allTokens: Token[],
  currentNonFinalBuffer: Token[]
): {
  newCommittedText: string;
  updatedBuffer: Token[];
  liveText: string;
  currentSpeaker?: string;
} {
  // Extract only source tokens
  const sourceTokens = extractSourceTokens(allTokens);

  // Process them
  const result = processTokenUpdate(sourceTokens, currentNonFinalBuffer);
  
  // Extract current speaker from the tokens
  const currentSpeaker = extractCurrentSpeaker(sourceTokens);
  
  return {
    newCommittedText: result.newCommittedText,
    updatedBuffer: result.updatedNonFinalBuffer,
    liveText: result.liveText,
    currentSpeaker,
  };
}

/**
 * Extract current speaker from tokens
 * Returns the most recent speaker label found in the tokens
 */
export function extractCurrentSpeaker(tokens: Token[]): string | undefined {
  // Look for speaker in reverse order (most recent first)
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].speaker) {
      return tokens[i].speaker;
    }
  }
  return undefined;
}

/**
 * Commit remaining live tokens when session ends
 */
export function commitRemainingTokens(buffer: Token[]): string {
  return tokensToText(buffer);
}

/**
 * Generate a unique ID for a transcript line
 */
export function generateLineId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a line should trigger auto-scroll
 * (e.g., new committed line or substantial live text)
 */
export function shouldAutoScroll(
  newCommittedText: string,
  liveText: string,
  previousLiveTextLength: number
): boolean {
  // Auto-scroll if:
  // 1. New committed text arrived
  // 2. Live text grew significantly (more than 10 chars)
  return (
    newCommittedText.length > 0 ||
    (liveText.length > previousLiveTextLength + 10)
  );
}

/**
 * Clean up text (optional: remove extra spaces, trim, etc.)
 */
export function cleanText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Merge committed lines if they're part of the same sentence
 * Useful for creating more natural paragraph breaks
 */
export function mergeCommittedLines(lines: string[]): string[] {
  if (lines.length === 0) return [];

  const merged: string[] = [];
  let current = lines[0];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // If current line doesn't end with sentence-ending punctuation,
    // merge with next line
    if (!/[.!?]$/.test(current.trim()) && line.length > 0) {
      current += ' ' + line;
    } else {
      merged.push(current);
      current = line;
    }
  }
  
  merged.push(current);
  return merged;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(ms?: number): string {
  if (!ms) return '';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate confidence level category
 */
export function getConfidenceLevel(confidence?: number): 'high' | 'medium' | 'low' {
  if (!confidence) return 'medium';
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.7) return 'medium';
  return 'low';
}

