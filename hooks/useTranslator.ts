import { useState, useCallback, useRef } from 'react';
import {
  Token,
  processTranslationTokens,
  processSourceTokens,
  commitRemainingTokens,
  generateLineId,
  cleanText,
} from '@/utils/tokenParser';

/**
 * useTranslator Hook
 * 
 * Manages real-time German to English speech translation using Soniox API.
 * 
 * Features:
 * - Microphone audio capture
 * - Real-time translation streaming
 * - Token parsing and state management
 * - Live vs committed line separation
 * - Error handling and connection management
 * 
 * Phase 2 Implementation: Token parsing & UI state management
 */

interface TranslatorResult {
  tokens: Token[];
  final_audio_proc_ms?: number;
  total_audio_proc_ms?: number;
}

export interface TranscriptLine {
  id: string;
  text: string;
  timestamp: number;
}

interface UseTranslatorReturn {
  // Connection state
  isRecording: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Translation content
  committedTranslation: TranscriptLine[];
  liveTranslation: string;
  
  // Source content (optional)
  committedSource: TranscriptLine[];
  liveSource: string;
  
  // Control functions
  startTranslation: () => Promise<void>;
  stopTranslation: () => void;
  cancelTranslation: () => void;
  clearTranscript: () => void;
  
  // Display options
  showSource: boolean;
  toggleSource: () => void;
}

export function useTranslator(): UseTranslatorReturn {
  // Connection state
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Translation content state
  const [committedTranslation, setCommittedTranslation] = useState<TranscriptLine[]>([]);
  const [liveTranslation, setLiveTranslation] = useState<string>('');
  
  // Source content state (optional German original)
  const [committedSource, setCommittedSource] = useState<TranscriptLine[]>([]);
  const [liveSource, setLiveSource] = useState<string>('');
  
  // Display options
  const [showSource, setShowSource] = useState<boolean>(false);

  // Refs to maintain state across renders
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sonioxClientRef = useRef<any>(null);
  
  // Token buffers (non-final tokens)
  const translationBufferRef = useRef<Token[]>([]);
  const sourceBufferRef = useRef<Token[]>([]);

  /**
   * Clear transcript and reset state
   */
  const clearTranscript = useCallback(() => {
    setCommittedTranslation([]);
    setLiveTranslation('');
    setCommittedSource([]);
    setLiveSource('');
    translationBufferRef.current = [];
    sourceBufferRef.current = [];
    console.log('🗑️ Transcript cleared');
  }, []);

  /**
   * Toggle source (German original) display
   */
  const toggleSource = useCallback(() => {
    setShowSource(prev => !prev);
  }, []);

  /**
   * Process incoming tokens and update state
   */
  const handleTokenUpdate = useCallback((tokens: Token[]) => {
    // Process translation tokens (English)
    const {
      newCommittedText: newTranslationText,
      updatedBuffer: updatedTranslationBuffer,
      liveText: newLiveTranslation,
    } = processTranslationTokens(tokens, translationBufferRef.current);

    // Process source tokens (German)
    const {
      newCommittedText: newSourceText,
      updatedBuffer: updatedSourceBuffer,
      liveText: newLiveSource,
    } = processSourceTokens(tokens, sourceBufferRef.current);

    // Update translation buffer
    translationBufferRef.current = updatedTranslationBuffer;

    // Update source buffer
    sourceBufferRef.current = updatedSourceBuffer;

    // Commit new final translation text
    if (newTranslationText.trim().length > 0) {
      const cleanedText = cleanText(newTranslationText);
      const newLine: TranscriptLine = {
        id: generateLineId(),
        text: cleanedText,
        timestamp: Date.now(),
      };
      
      setCommittedTranslation(prev => [...prev, newLine]);
      console.log('✅ Committed translation:', cleanedText);
    }

    // Commit new final source text
    if (newSourceText.trim().length > 0) {
      const cleanedText = cleanText(newSourceText);
      const newLine: TranscriptLine = {
        id: generateLineId(),
        text: cleanedText,
        timestamp: Date.now(),
      };
      
      setCommittedSource(prev => [...prev, newLine]);
      console.log('✅ Committed source:', cleanedText);
    }

    // Update live translation
    setLiveTranslation(newLiveTranslation);

    // Update live source
    setLiveSource(newLiveSource);
  }, []);

  /**
   * Commit any remaining live tokens when session ends
   */
  const finalizeTranscript = useCallback(() => {
    // Commit remaining translation tokens
    const remainingTranslation = commitRemainingTokens(translationBufferRef.current);
    if (remainingTranslation.trim().length > 0) {
      const cleanedText = cleanText(remainingTranslation);
      const newLine: TranscriptLine = {
        id: generateLineId(),
        text: cleanedText,
        timestamp: Date.now(),
      };
      setCommittedTranslation(prev => [...prev, newLine]);
      console.log('✅ Finalized translation:', cleanedText);
    }

    // Commit remaining source tokens
    const remainingSource = commitRemainingTokens(sourceBufferRef.current);
    if (remainingSource.trim().length > 0) {
      const cleanedText = cleanText(remainingSource);
      const newLine: TranscriptLine = {
        id: generateLineId(),
        text: cleanedText,
        timestamp: Date.now(),
      };
      setCommittedSource(prev => [...prev, newLine]);
      console.log('✅ Finalized source:', cleanedText);
    }

    // Clear live text
    setLiveTranslation('');
    setLiveSource('');

    // Clear buffers
    translationBufferRef.current = [];
    sourceBufferRef.current = [];
  }, []);

  /**
   * Fetch temporary API key from our backend
   */
  const fetchApiKey = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/soniox-temp-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch API key: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.apiKey) {
        throw new Error('API key not found in response');
      }

      console.log('✅ Successfully fetched Soniox API key');
      return data.apiKey;
    } catch (err) {
      console.error('❌ Error fetching API key:', err);
      throw err;
    }
  }, []);

  /**
   * Request microphone access
   */
  const getMicrophoneAccess = useCallback(async (): Promise<MediaStream> => {
    try {
      console.log('🎤 Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000, // Optimal for speech recognition
        },
      });

      console.log('✅ Microphone access granted');
      return stream;
    } catch (err) {
      console.error('❌ Microphone access denied:', err);
      throw new Error('Microphone access denied. Please grant permission and try again.');
    }
  }, []);

  /**
   * Start translation session
   */
  const startTranslation = useCallback(async () => {
    if (isRecording || isConnecting) {
      console.warn('⚠️ Translation already in progress');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Step 1: Get microphone access
      const stream = await getMicrophoneAccess();
      mediaStreamRef.current = stream;

      // Step 2: Dynamically import Soniox SDK (browser-only)
      console.log('📦 Loading Soniox SDK...');
      const { RecordTranscribe } = await import('@soniox/speech-to-text-web');

      // Step 3: Initialize Soniox client
      console.log('🔗 Initializing Soniox client...');
      const client = new RecordTranscribe({
        apiKey: fetchApiKey,
      });

      sonioxClientRef.current = client;

      // Step 4: Start translation stream
      console.log('🚀 Starting translation stream...');
      await client.start({
        model: 'stt-rt-preview-v2',
        
        // Translation configuration: German → English
        translation: {
          type: 'one_way',
          target_language: 'en',
        },

        // Audio configuration
        stream: stream,
        audioFormat: 'auto',

        // Language hints for better accuracy
        languageHints: ['de'], // Primarily German input

        // Enable endpoint detection for better finalization
        enableEndpointDetection: true,

        // Callbacks
        onStarted: () => {
          console.log('✅ Translation started successfully');
          setIsConnecting(false);
          setIsRecording(true);
        },

        onPartialResult: (result: TranslatorResult) => {
          // Process tokens and update state
          handleTokenUpdate(result.tokens);
          
          // Keep console logging for debugging (Phase 2)
          console.log('📝 Partial result received:');
          
          // Log translation-specific details
          result.tokens.forEach((token, idx) => {
            const prefix = token.is_final ? '🔒' : '⏳';
            const statusEmoji = 
              token.translation_status === 'original' ? '🗣️' : 
              token.translation_status === 'translation' ? '🌐' : '⚪';
            
            console.log(
              `  ${prefix} ${statusEmoji} [${idx}] "${token.text}" ` +
              `(${token.translation_status}, ${token.language || 'unknown'})` +
              (token.source_language ? ` from ${token.source_language}` : '')
            );
          });

          if (result.final_audio_proc_ms !== undefined) {
            console.log(`⏱️ Audio processed: ${result.final_audio_proc_ms}ms`);
          }
        },

        onFinished: () => {
          console.log('✅ Translation session finished');
          
          // Finalize any remaining tokens
          finalizeTranscript();
          
          setIsRecording(false);
          setIsConnecting(false);
          
          // Clean up media stream
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
          }
        },

        onError: (status: any, message: string, errorCode?: number) => {
          console.error('❌ Translation error:', status, message, errorCode);
          setError(`Error ${errorCode || status}: ${message}`);
          setIsRecording(false);
          setIsConnecting(false);
          
          // Clean up on error
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
          }
        },
      });

    } catch (err: any) {
      console.error('❌ Failed to start translation:', err);
      setError(err.message || 'Failed to start translation');
      setIsConnecting(false);
      setIsRecording(false);

      // Clean up on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [isRecording, isConnecting, getMicrophoneAccess, fetchApiKey, handleTokenUpdate, finalizeTranscript]);

  /**
   * Stop translation (graceful)
   */
  const stopTranslation = useCallback(() => {
    if (!sonioxClientRef.current) {
      console.warn('⚠️ No active translation session to stop');
      return;
    }

    console.log('🛑 Stopping translation gracefully...');
    
    // Finalize any remaining tokens before stopping
    finalizeTranscript();
    
    try {
      sonioxClientRef.current.stop();
    } catch (err) {
      console.error('❌ Error stopping translation:', err);
    }

    // Clean up media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    sonioxClientRef.current = null;
  }, [finalizeTranscript]);

  /**
   * Cancel translation (abrupt)
   */
  const cancelTranslation = useCallback(() => {
    if (!sonioxClientRef.current) {
      console.warn('⚠️ No active translation session to cancel');
      return;
    }

    console.log('⚠️ Canceling translation...');
    try {
      sonioxClientRef.current.cancel();
    } catch (err) {
      console.error('❌ Error canceling translation:', err);
    }

    // Clean up media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    sonioxClientRef.current = null;
    setIsRecording(false);
    setIsConnecting(false);
  }, []);

  return {
    // Connection state
    isRecording,
    isConnecting,
    error,
    
    // Translation content
    committedTranslation,
    liveTranslation,
    
    // Source content
    committedSource,
    liveSource,
    
    // Control functions
    startTranslation,
    stopTranslation,
    cancelTranslation,
    clearTranscript,
    
    // Display options
    showSource,
    toggleSource,
  };
}

