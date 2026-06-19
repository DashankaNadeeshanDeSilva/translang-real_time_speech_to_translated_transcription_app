/**
 * Translation Sentence Buffer
 * 
 * Buffers translation tokens and assembles them into complete, natural sentences
 * before committing to display. This prevents fragmented translation display.
 * 
 * Key Features:
 * - Buffers translation tokens until sentence boundaries detected
 * - Tracks speaker labels for multi-speaker scenarios
 * - Detects sentence endings (., !, ?, …)
 * - Uses timeout as fallback (commits incomplete sentences after delay)
 * - Handles speaker transitions (flushes on speaker change)
 * 
 * Phase 8 Implementation
 */

import { Token } from './tokenParser';

export interface TranslationSentence {
  text: string;
  originalText?: string;  // Original-language text accumulated alongside this translation
  speaker?: string;
  isFinal: boolean;
}

export interface BufferConfig {
  enabled: boolean;           // Enable/disable sentence buffering
  holdMs?: number;            // Wait time after potential sentence end
  maxHoldMs?: number;         // Maximum wait time before forcing commit
  maxChars?: number;          // Maximum sentence length before forcing commit
}

const DEFAULT_CONFIG: Required<BufferConfig> = {
  enabled: true,
  holdMs: 800,                // 800ms wait for additional tokens
  maxHoldMs: 2500,            // 2.5 seconds max hold (reduced premature splits)
  maxChars: 500,              // Max 500 characters per sentence
};

// Sentence-ending punctuation patterns
const SENTENCE_END_PATTERN = /[.!?…]["')\]]?\s*$/;

/**
 * Check if text ends with sentence-ending punctuation
 */
function endsWithSentencePunctuation(text: string): boolean {
  return SENTENCE_END_PATTERN.test(text.trim());
}

/**
 * Normalize whitespace in text
 */
function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')              // Multiple spaces → single space
    .replace(/\s+([,.;:!?])/g, '$1')   // Remove space before punctuation
    .trim();
}

/**
 * Translation Sentence Buffer
 * 
 * Accumulates translation tokens and commits complete sentences.
 */
export class TranslationSentenceBuffer {
  private config: Required<BufferConfig>;
  private buffer: Token[] = [];
  // Original-language (final) tokens accumulated in parallel with the translation
  // buffer, so they can be committed together as a matched pair.
  private sourceBuffer: Token[] = [];
  private currentSpeaker: string | null = null;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private holdStartTime = 0;
  
  constructor(
    private onCommit: (sentence: TranslationSentence) => void,
    config?: BufferConfig
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update buffer configuration
   */
  updateConfig(config: Partial<BufferConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current speaker being tracked
   */
  getCurrentSpeaker(): string | null {
    return this.currentSpeaker;
  }

  /**
   * Update current speaker from original tokens
   * This should be called when processing original (source) tokens
   */
  updateSpeaker(speaker: string | undefined): void {
    if (speaker && speaker !== this.currentSpeaker) {
      // Speaker changed - flush any pending content for previous speaker
      if (this.buffer.length > 0) {
        console.log(`🔄 Speaker change detected: ${this.currentSpeaker} → ${speaker}, flushing buffer`);
        this.flush(true);
      }
      this.currentSpeaker = speaker;
      console.log(`👤 Current speaker updated to: ${speaker}`);
    }
  }

  /**
   * Accumulate original-language (source) tokens in parallel with the translation.
   * Only FINAL source tokens are stored (non-final tokens are re-sent/revised by
   * Soniox each batch and would duplicate). These are committed together with the
   * translation in commitBuffer(), keeping each bubble's translation and original
   * physically paired.
   */
  addSourceTokens(tokens: Token[]): void {
    if (!this.config.enabled || tokens.length === 0) return;

    const finals = tokens.filter(t => t.is_final);
    if (finals.length > 0) {
      this.sourceBuffer.push(...finals);
    }
  }

  /**
   * Add translation tokens to buffer
   * Accumulates tokens and decides when to commit complete sentences
   */
  addTranslationTokens(tokens: Token[]): void {
    if (!this.config.enabled) {
      // Buffer disabled - commit immediately
      const text = tokens.map(t => t.text).join('');
      if (text.trim()) {
        this.commitDirect(text);
      }
      return;
    }

    if (tokens.length === 0) return;

    // Add new tokens to buffer
    this.buffer.push(...tokens);

    // Get current buffered text
    const bufferedText = this.getBufferedText();
    
    console.log(`📝 Translation buffer: "${bufferedText.substring(0, 100)}${bufferedText.length > 100 ? '...' : ''}" (${this.buffer.length} tokens)`);

    // Check if we should commit now
    const shouldCommit = this.shouldCommitNow(bufferedText);
    
    if (shouldCommit) {
      console.log('✅ Sentence boundary detected, committing translation');
      this.commitBuffer();
    } else {
      // Start/restart hold timer
      this.startHoldTimer();
    }
  }

  /**
   * Get live preview text (buffered + partial tokens)
   */
  getLivePreview(partialTokens?: Token[]): string {
    if (!this.config.enabled) {
      return partialTokens ? partialTokens.map(t => t.text).join('') : '';
    }

    const buffered = this.getBufferedText();
    const partial = partialTokens ? partialTokens.map(t => t.text).join('') : '';
    
    return normalizeText([buffered, partial].filter(Boolean).join(' '));
  }

  /**
   * Force flush buffer (commit whatever is accumulated)
   */
  flush(force = false): void {
    if (this.buffer.length === 0) return;

    const elapsed = performance.now() - this.holdStartTime;
    const shouldFlush = force || elapsed >= this.config.maxHoldMs;

    if (shouldFlush) {
      console.log(`🔄 Flushing translation buffer (force: ${force}, elapsed: ${Math.round(elapsed)}ms)`);
      this.commitBuffer();
    }
  }

  /**
   * Reset buffer (clear all state)
   */
  reset(): void {
    this.clearTimer();
    this.buffer = [];
    this.sourceBuffer = [];
    this.currentSpeaker = null;
    this.holdStartTime = 0;
    console.log('🗑️ Translation buffer reset');
  }

  /**
   * Get buffered text
   */
  private getBufferedText(): string {
    return this.buffer.map(t => t.text).join('');
  }

  /**
   * Check if buffer should be committed now
   */
  private shouldCommitNow(text: string): boolean {
    // Commit if:
    // 1. Text ends with sentence punctuation
    // 2. Buffer exceeds max characters
    // (Do not commit on commas/semicolons to avoid mid-sentence splits)
    
    if (endsWithSentencePunctuation(text)) {
      return true;
    }

    if (text.length >= this.config.maxChars) {
      console.log(`⚠️ Buffer exceeded max chars (${text.length}/${this.config.maxChars})`);
      return true;
    }

    return false;
  }

  /**
   * Start/restart hold timer
   */
  private startHoldTimer(): void {
    this.clearTimer();
    this.holdStartTime = performance.now();
    
    // Only force-commit after maxHoldMs (not holdMs) to avoid breaking
    // sentences on brief pauses or hesitations.
    this.holdTimer = setTimeout(() => {
      console.log(`⏱️ Max hold timer expired (${this.config.maxHoldMs}ms), committing buffer`);
      this.commitBuffer();
    }, this.config.maxHoldMs);
  }

  /**
   * Clear hold timer
   */
  private clearTimer(): void {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  /**
   * Commit buffered tokens as a complete sentence
   */
  private commitBuffer(): void {
    this.clearTimer();

    if (this.buffer.length === 0) return;

    const text = normalizeText(this.getBufferedText());

    if (!text) {
      this.buffer = [];
      this.sourceBuffer = [];
      return;
    }

    // Determine if sentence is final (all tokens are final)
    const isFinal = this.buffer.every(t => t.is_final);

    // Pair the matching original-language text accumulated since the last commit
    const originalText = normalizeText(this.sourceBuffer.map(t => t.text).join(''));

    const sentence: TranslationSentence = {
      text,
      originalText: originalText || undefined,
      speaker: this.currentSpeaker || undefined,
      isFinal,
    };

    // Commit the sentence
    this.onCommit(sentence);

    // Clear both buffers together so the next bubble stays paired
    this.buffer = [];
    this.sourceBuffer = [];
  }

  /**
   * Commit text directly without buffering (when disabled)
   */
  private commitDirect(text: string): void {
    const normalized = normalizeText(text);
    if (!normalized) return;

    this.onCommit({
      text: normalized,
      speaker: this.currentSpeaker || undefined,
      isFinal: true,
    });
  }
}

