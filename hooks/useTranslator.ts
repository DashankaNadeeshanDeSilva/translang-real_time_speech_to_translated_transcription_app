import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Token,
  processTranslationTokens,
  processSourceTokens,
  commitRemainingTokens,
  generateLineId,
  cleanText,
} from '@/utils/tokenParser';
import { VADManager, DEFAULT_VAD_CONFIG } from '@/utils/vadManager';
import { KeepaliveManager } from '@/utils/keepaliveManager';

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
  
  // VAD configuration (Phase 3)
  vadEnabled: boolean;
  toggleVAD: () => void;
  silenceThreshold: number;
  setSilenceThreshold: (threshold: number) => void;
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
  
  // VAD configuration (Phase 3)
  const [vadEnabled, setVadEnabled] = useState<boolean>(true);
  const [silenceThreshold, setSilenceThreshold] = useState<number>(DEFAULT_VAD_CONFIG.silenceThreshold);

  // Refs to maintain state across renders
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sonioxClientRef = useRef<any>(null);
  
  // Token buffers (non-final tokens)
  const translationBufferRef = useRef<Token[]>([]);
  const sourceBufferRef = useRef<Token[]>([]);
  
  // VAD and Keepalive managers (Phase 3)
  const vadManagerRef = useRef<VADManager | null>(null);
  const keepaliveManagerRef = useRef<KeepaliveManager | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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
   * Toggle VAD (Voice Activity Detection)
   */
  const toggleVAD = useCallback(() => {
    setVadEnabled(prev => {
      const newValue = !prev;
      console.log(newValue ? '🎙️ VAD enabled' : '🔇 VAD disabled');
      return newValue;
    });
  }, []);

  /**
   * Cleanup VAD and Keepalive managers
   */
  const cleanupManagers = useCallback(async () => {
    // Stop and cleanup keepalive
    if (keepaliveManagerRef.current) {
      keepaliveManagerRef.current.stop();
      keepaliveManagerRef.current = null;
    }

    // Destroy and cleanup VAD
    if (vadManagerRef.current) {
      await vadManagerRef.current.destroy();
      vadManagerRef.current = null;
    }

    // Cleanup audio processing
    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current = null;
    }

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
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
   * Manually finalize current utterance (Phase 3)
   * Triggers Soniox to finalize non-final tokens
   */
  const manualFinalize = useCallback(() => {
    if (!sonioxClientRef.current) {
      return;
    }

    try {
      console.log('⏸️ Manual finalization triggered');
      
      // Check if client has finalize method
      if (typeof sonioxClientRef.current.finalize === 'function') {
        sonioxClientRef.current.finalize();
        console.log('✅ Finalization command sent to Soniox');
      } else {
        console.warn('⚠️ Client does not support manual finalization');
      }
    } catch (error) {
      console.error('❌ Error during manual finalization:', error);
    }
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

      // Step 4: Initialize VAD and Keepalive (Phase 3)
      if (vadEnabled) {
        try {
          console.log('🎙️ Initializing VAD...');
          const vadManager = new VADManager({
            silenceThreshold,
            sampleRate: 16000,
          });
          await vadManager.initialize();
          vadManagerRef.current = vadManager;

          // Initialize Keepalive manager
          const keepaliveManager = new KeepaliveManager();
          keepaliveManager.start(client);
          keepaliveManagerRef.current = keepaliveManager;

        } catch (vadError) {
          console.warn('⚠️ VAD initialization failed, continuing without VAD:', vadError);
          vadManagerRef.current = null;
        }
      }

      // Step 5: Start translation stream
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

          // Setup VAD audio processing (Phase 3)
          if (vadEnabled && vadManagerRef.current && mediaStreamRef.current) {
            try {
              console.log('🎙️ Setting up VAD audio processing...');
              
              // Create audio context for VAD processing
              const audioContext = new AudioContext({ sampleRate: 16000 });
              audioContextRef.current = audioContext;

              // Create source from media stream
              const source = audioContext.createMediaStreamSource(mediaStreamRef.current);

              // Create script processor for VAD
              const bufferSize = 4096;
              const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
              audioProcessorRef.current = processor;

              processor.onaudioprocess = (event) => {
                if (!vadManagerRef.current || !sonioxClientRef.current) {
                  return;
                }

                const inputData = event.inputBuffer.getChannelData(0);
                
                try {
                  // Process audio frame with VAD
                  const vadResult = vadManagerRef.current.processFrame(inputData);
                  
                  // If silence threshold reached, trigger manual finalization
                  if (vadResult.shouldFinalize) {
                    console.log(`⏸️ Silence detected (${vadResult.silenceDuration}ms) - finalizing`);
                    manualFinalize();
                  }
                } catch (vadError) {
                  console.error('❌ VAD processing error:', vadError);
                }
              };

              // Connect audio pipeline
              source.connect(processor);
              processor.connect(audioContext.destination);

              console.log('✅ VAD audio processing active');
            } catch (error) {
              console.error('❌ Failed to setup VAD audio processing:', error);
            }
          }
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
          
          // Cleanup VAD and Keepalive
          cleanupManagers();
          
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
          
          // Cleanup VAD and Keepalive
          cleanupManagers();
          
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

      // Cleanup VAD and Keepalive
      await cleanupManagers();

      // Clean up on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [isRecording, isConnecting, getMicrophoneAccess, fetchApiKey, handleTokenUpdate, finalizeTranscript, vadEnabled, silenceThreshold, manualFinalize, cleanupManagers]);

  /**
   * Stop translation (graceful)
   */
  const stopTranslation = useCallback(async () => {
    if (!sonioxClientRef.current) {
      console.warn('⚠️ No active translation session to stop');
      return;
    }

    console.log('🛑 Stopping translation gracefully...');
    
    // Finalize any remaining tokens before stopping
    finalizeTranscript();
    
    // Cleanup VAD and Keepalive
    await cleanupManagers();
    
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
  }, [finalizeTranscript, cleanupManagers]);

  /**
   * Cancel translation (abrupt)
   */
  const cancelTranslation = useCallback(async () => {
    if (!sonioxClientRef.current) {
      console.warn('⚠️ No active translation session to cancel');
      return;
    }

    console.log('⚠️ Canceling translation...');
    
    // Cleanup VAD and Keepalive
    await cleanupManagers();
    
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
  }, [cleanupManagers]);

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
    
    // VAD configuration (Phase 3)
    vadEnabled,
    toggleVAD,
    silenceThreshold,
    setSilenceThreshold,
  };
}

