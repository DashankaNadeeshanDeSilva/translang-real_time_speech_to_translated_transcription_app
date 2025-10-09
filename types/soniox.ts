/**
 * Type definitions for Soniox API integration
 * These will be expanded as we implement each phase
 */

export interface TemporaryKeyResponse {
  apiKey: string;
  expiresAt?: string;
  note?: string;
}

export interface TranslationToken {
  text: string;
  isFinal: boolean;
  timestamp?: number;
  speaker?: string;
}

export interface TranscriptLine {
  id: string;
  text: string;
  isFinal: boolean;
  timestamp: number;
}

// Soniox SDK configuration types (to be refined in Phase 1)
export interface SonioxConfig {
  apiKey: string | (() => Promise<string>);
  language?: string;
  translationLanguage?: string;
  sampleRate?: number;
  enableVAD?: boolean;
}

// WebSocket message types
export interface SonioxMessage {
  type: 'token' | 'finalize' | 'error' | 'config';
  data?: any;
}

