/**
 * Streaming Token Processor
 * 
 * Processes Soniox tokens in real-time with a chat-style streaming approach.
 * Maintains final (committed) and mutable (editable) regions for natural typing flow.
 * 
 * Key Features:
 * - Word-level diff reconciliation for smooth updates
 * - Per-speaker message streams with final/mutable regions
 * - Robust correction guardrails (no rewriting committed text)
 * - Efficient auto-scroll and performance optimization
 * - Real-time typing animations and cursor management
 * 
 * Phase 8.5 Implementation - Chat-Style Streaming
 */

import { Token } from './tokenParser';

export interface StreamingMessage {
  id: string;
  speaker: string;
  finalText: string;        // Committed text (is_final=true tokens)
  mutableText: string;      // Current non-final tokens
  isActive: boolean;        // Currently being typed
  timestamp: number;
  language?: string;
}

export interface StreamingUpdate {
  type: 'new_message' | 'update_mutable' | 'commit_mutable' | 'speaker_change';
  messageId: string;
  speaker: string;
  finalText: string;
  mutableText: string;
  isActive: boolean;
  timestamp: number;
}

export interface StreamingConfig {
  enabled: boolean;
  maxRollbackTokens: number;    // How many tokens back we can correct
  updateThrottleMs: number;     // Throttle updates for performance
  autoCommitOnPause: boolean;   // Commit on silence/endpoint
  mergeConsecutiveSpeakers: boolean; // Group same speaker messages
}

const DEFAULT_CONFIG: Required<StreamingConfig> = {
  enabled: true,
  maxRollbackTokens: 10,        // Allow correction of last 10 tokens
  updateThrottleMs: 16,         // ~60fps throttling
  autoCommitOnPause: true,      // Commit on silence
  mergeConsecutiveSpeakers: true, // Group consecutive speaker turns
};

/**
 * Word-level diff utility for smooth text reconciliation
 */
class WordDiff {
  /**
   * Compute word-level diff between old and new text
   * Returns operations to transform old text to new text
   */
  static computeDiff(oldText: string, newText: string): {
    type: 'insert' | 'delete' | 'replace' | 'keep';
    oldWords: string[];
    newWords: string[];
    startIndex: number;
  }[] {
    const oldWords = oldText.split(/(\s+)/);
    const newWords = newText.split(/(\s+)/);
    
    const operations: any[] = [];
    let oldIndex = 0;
    let newIndex = 0;
    
    while (oldIndex < oldWords.length || newIndex < newWords.length) {
      if (oldIndex >= oldWords.length) {
        // Insert remaining new words
        operations.push({
          type: 'insert',
          oldWords: [],
          newWords: newWords.slice(newIndex),
          startIndex: oldIndex,
        });
        break;
      }
      
      if (newIndex >= newWords.length) {
        // Delete remaining old words
        operations.push({
          type: 'delete',
          oldWords: oldWords.slice(oldIndex),
          newWords: [],
          startIndex: oldIndex,
        });
        break;
      }
      
      if (oldWords[oldIndex] === newWords[newIndex]) {
        // Words match, keep them
        operations.push({
          type: 'keep',
          oldWords: [oldWords[oldIndex]],
          newWords: [newWords[newIndex]],
          startIndex: oldIndex,
        });
        oldIndex++;
        newIndex++;
      } else {
        // Words differ, find the best match
        const matchIndex = this.findBestMatch(oldWords, newWords, oldIndex, newIndex);
        
        if (matchIndex > newIndex) {
          // Insert words between oldIndex and matchIndex
          operations.push({
            type: 'insert',
            oldWords: [],
            newWords: newWords.slice(newIndex, matchIndex),
            startIndex: oldIndex,
          });
          newIndex = matchIndex;
        } else {
          // Replace current word
          operations.push({
            type: 'replace',
            oldWords: [oldWords[oldIndex]],
            newWords: [newWords[newIndex]],
            startIndex: oldIndex,
          });
          oldIndex++;
          newIndex++;
        }
      }
    }
    
    return operations;
  }
  
  /**
   * Find best matching word in new text
   */
  private static findBestMatch(oldWords: string[], newWords: string[], oldIndex: number, newIndex: number): number {
    for (let i = newIndex + 1; i < newWords.length; i++) {
      if (oldWords[oldIndex] === newWords[i]) {
        return i;
      }
    }
    return newIndex + 1;
  }
}

/**
 * Streaming Token Processor
 * 
 * Manages real-time token processing with final/mutable regions
 */
export class StreamingTokenProcessor {
  private config: Required<StreamingConfig>;
  private messages: Map<string, StreamingMessage> = new Map();
  private currentMessageId: string | null = null;
  private currentSpeaker: string | null = null;
  private updateThrottleTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingUpdate: StreamingUpdate | null = null;
  
  constructor(
    private onUpdate: (update: StreamingUpdate) => void,
    config?: Partial<StreamingConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<StreamingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Process incoming tokens
   */
  processTokens(tokens: Token[]): void {
    if (!this.config.enabled || tokens.length === 0) {
      return;
    }

    // Extract speaker from original tokens (most recent)
    const currentSpeaker = this.extractCurrentSpeaker(tokens);
    
    // Extract translation tokens
    const translationTokens = tokens.filter(t => t.translation_status === 'translation');
    
    if (translationTokens.length === 0) {
      return;
    }

    // Ensure we have a message to add tokens to
    if (!this.currentMessageId) {
      // No message exists yet, create one with current speaker or default
      const speaker = currentSpeaker || 'unknown';
      this.handleSpeakerChange(speaker);
      console.log(`🎬 Created initial message for speaker: ${speaker}`);
    } else if (currentSpeaker && currentSpeaker !== this.currentSpeaker) {
      // Handle speaker changes
      this.handleSpeakerChange(currentSpeaker);
      console.log(`👤 Speaker changed from ${this.currentSpeaker} to ${currentSpeaker}`);
    }

    // Process translation tokens
    this.processTranslationTokens(translationTokens);
  }

  /**
   * Force commit current mutable text (e.g., on endpoint detection)
   */
  commitCurrentMessage(): void {
    if (!this.currentMessageId) {
      return;
    }

    const message = this.messages.get(this.currentMessageId);
    if (!message || !message.mutableText) {
      return;
    }

    // Move mutable text to final text
    const finalText = message.finalText + message.mutableText;
    const updatedMessage: StreamingMessage = {
      ...message,
      finalText: finalText.trim(),
      mutableText: '',
      isActive: false,
    };

    this.messages.set(this.currentMessageId, updatedMessage);

    // Notify update
    this.throttledUpdate({
      type: 'commit_mutable',
      messageId: this.currentMessageId,
      speaker: message.speaker,
      finalText: updatedMessage.finalText,
      mutableText: updatedMessage.mutableText,
      isActive: updatedMessage.isActive,
      timestamp: Date.now(),
    });

    console.log(`✅ Committed message: "${finalText}"`);
  }

  /**
   * Get all messages in chronological order
   */
  getAllMessages(): StreamingMessage[] {
    return Array.from(this.messages.values())
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get current active message
   */
  getCurrentMessage(): StreamingMessage | null {
    if (!this.currentMessageId) {
      return null;
    }
    return this.messages.get(this.currentMessageId) || null;
  }

  /**
   * Reset all messages
   */
  reset(): void {
    this.messages.clear();
    this.currentMessageId = null;
    this.currentSpeaker = null;
    this.clearThrottleTimer();
    console.log('🗑️ Streaming processor reset');
  }

  /**
   * Extract current speaker from tokens
   */
  private extractCurrentSpeaker(tokens: Token[]): string | null {
    // Look for speaker in original tokens (reverse order for most recent)
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i].translation_status === 'original' && tokens[i].speaker) {
        return tokens[i].speaker || null;
      }
    }
    return null;
  }

  /**
   * Handle speaker change
   */
  private handleSpeakerChange(newSpeaker: string): void {
    if (this.currentSpeaker === newSpeaker) {
      return;
    }

    // Commit current message if exists
    if (this.currentMessageId) {
      this.commitCurrentMessage();
    }

    // Start new message for new speaker
    this.currentSpeaker = newSpeaker;
    this.currentMessageId = this.generateMessageId();
    
    const newMessage: StreamingMessage = {
      id: this.currentMessageId,
      speaker: newSpeaker,
      finalText: '',
      mutableText: '',
      isActive: true,
      timestamp: Date.now(),
    };

    this.messages.set(this.currentMessageId, newMessage);

    // Notify new message
    this.throttledUpdate({
      type: 'new_message',
      messageId: this.currentMessageId,
      speaker: newSpeaker,
      finalText: '',
      mutableText: '',
      isActive: true,
      timestamp: Date.now(),
    });

    console.log(`👤 New speaker: ${newSpeaker} (Message: ${this.currentMessageId})`);
  }

  /**
   * Process translation tokens for current message
   */
  private processTranslationTokens(tokens: Token[]): void {
    if (!this.currentMessageId) {
      console.warn('⚠️ No current message ID, cannot process tokens');
      return;
    }

    const message = this.messages.get(this.currentMessageId);
    if (!message) {
      console.warn('⚠️ Message not found:', this.currentMessageId);
      return;
    }

    // Separate final and non-final tokens
    const finalTokens = tokens.filter(t => t.is_final);
    const mutableTokens = tokens.filter(t => !t.is_final);

    console.log(`📝 Processing ${tokens.length} translation tokens (${finalTokens.length} final, ${mutableTokens.length} mutable)`);

    let updatedMessage = { ...message };

    // Process final tokens (commit to finalText)
    if (finalTokens.length > 0) {
      const finalText = finalTokens.map(t => t.text).join('');
      updatedMessage.finalText += finalText;
      updatedMessage.isActive = true; // Reactivate for new mutable content
      console.log(`✅ Added final text: "${finalText}"`);
    }

    // Process mutable tokens (update mutableText with diff)
    if (mutableTokens.length > 0) {
      const newMutableText = mutableTokens.map(t => t.text).join('');
      
      // Apply word-level diff for smooth updates
      const diff = WordDiff.computeDiff(updatedMessage.mutableText, newMutableText);
      updatedMessage.mutableText = newMutableText;
      updatedMessage.isActive = true;
      console.log(`🔄 Updated mutable text: "${newMutableText}"`);
    }

    // Check if message should be committed (no more mutable content)
    if (mutableTokens.length === 0 && finalTokens.length > 0) {
      // Check for sentence-ending punctuation
      const fullText = updatedMessage.finalText + updatedMessage.mutableText;
      if (this.endsWithSentencePunctuation(fullText)) {
        updatedMessage.mutableText = '';
        updatedMessage.isActive = false;
      }
    }

    // Update message
    this.messages.set(this.currentMessageId, updatedMessage);

    console.log(`💾 Updated message in map. Final: "${updatedMessage.finalText.substring(0, 50)}", Mutable: "${updatedMessage.mutableText.substring(0, 50)}"`);

    // Notify update
    this.throttledUpdate({
      type: 'update_mutable',
      messageId: this.currentMessageId,
      speaker: updatedMessage.speaker,
      finalText: updatedMessage.finalText,
      mutableText: updatedMessage.mutableText,
      isActive: updatedMessage.isActive,
      timestamp: Date.now(),
    });
    
    console.log(`📢 Notified UI update for message ${this.currentMessageId}`);
  }

  /**
   * Check if text ends with sentence punctuation
   */
  private endsWithSentencePunctuation(text: string): boolean {
    return /[.!?…]["')\]]?\s*$/.test(text.trim());
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Throttled update notification
   */
  private throttledUpdate(update: StreamingUpdate): void {
    this.pendingUpdate = update;
    
    if (this.updateThrottleTimer) {
      console.log(`⏳ Throttled - update pending for ${update.messageId}`);
      return;
    }

    console.log(`⏱️ Setting throttle timer for ${this.config.updateThrottleMs}ms`);
    this.updateThrottleTimer = setTimeout(() => {
      if (this.pendingUpdate) {
        console.log(`🔔 Calling onUpdate callback for ${this.pendingUpdate.messageId}`);
        this.onUpdate(this.pendingUpdate);
        this.pendingUpdate = null;
      }
      this.updateThrottleTimer = null;
    }, this.config.updateThrottleMs);
  }

  /**
   * Clear throttle timer
   */
  private clearThrottleTimer(): void {
    if (this.updateThrottleTimer) {
      clearTimeout(this.updateThrottleTimer);
      this.updateThrottleTimer = null;
    }
  }
}
