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
import {
  RetryManager,
  SessionStateManager,
  classifyError,
  isRetryableError,
  getUserFriendlyMessage,
  isSessionTerminationError,
  ErrorType,
} from '@/utils/errorHandler';
import { LatencyTracker, LatencyMetrics as LatencyMetricsType } from '@/utils/latencyTracker';
import { SentenceStitcher } from '@/utils/sentenceStitcher';
import { TranslationSentenceBuffer } from '@/utils/translationSentenceBuffer';
import { StreamingTokenProcessor, StreamingMessage, StreamingUpdate } from '@/utils/streamingTokenProcessor';

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
  speaker?: string;  // Speaker label (e.g., "1", "2", "3")
}

interface UseTranslatorReturn {
  // Connection state
  isRecording: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Streaming content (Phase 8.5 - Chat-style)
  streamingMessages: StreamingMessage[];
  isStreamingMode: boolean;
  
  // Legacy content (for backward compatibility)
  committedTranslation: TranscriptLine[];
  liveTranslation: string;
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
  
  // Reconnection state (Phase 4)
  isReconnecting: boolean;
  retryCount: number;
  maxRetries: number;
  reconnectionMessage: string;
  
  // Latency metrics (Phase 5)
  latencyMetrics: LatencyMetricsType;
  showMetrics: boolean;
  toggleMetrics: () => void;
  
  // Language & context settings (Phase 6)
  sourceLanguage: string;
  setSourceLanguage: (lang: string) => void;
  vocabularyContext: string;
  setVocabularyContext: (context: string) => void;
  
  // Sentence stitching settings
  sentenceMode: boolean;
  setSentenceMode: (enabled: boolean) => void;
  sentenceHoldMs: number;
  setSentenceHoldMs: (ms: number) => void;
  
  // Streaming mode toggle (Phase 8.5)
  toggleStreamingMode: () => void;
}

export function useTranslator(): UseTranslatorReturn {
  // Connection state
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Streaming content state (Phase 8.5 - Chat-style)
  const [streamingMessages, setStreamingMessages] = useState<StreamingMessage[]>([]);
  const [isStreamingMode, setIsStreamingMode] = useState<boolean>(false); // Default to combined legacy flow
  
  // Legacy content state (for backward compatibility)
  const [committedTranslation, setCommittedTranslation] = useState<TranscriptLine[]>([]);
  const [liveTranslation, setLiveTranslation] = useState<string>('');
  const [committedSource, setCommittedSource] = useState<TranscriptLine[]>([]);
  const [liveSource, setLiveSource] = useState<string>('');
  
  // Display options
  const [showSource, setShowSource] = useState<boolean>(false);
  
  // VAD configuration (Phase 3)
  const [vadEnabled, setVadEnabled] = useState<boolean>(true);
  const [silenceThreshold, setSilenceThreshold] = useState<number>(DEFAULT_VAD_CONFIG.silenceThreshold);
  
  // Reconnection state (Phase 4)
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [reconnectionMessage, setReconnectionMessage] = useState<string>('');
  
  // Latency metrics (Phase 5)
  const [latencyMetrics, setLatencyMetrics] = useState<LatencyMetricsType>({
    captureToDisplay: null,
    audioProcessing: null,
    networkRoundTrip: null,
    rendering: null,
    averageLatency: 0,
    minLatency: Infinity,
    maxLatency: 0,
    sampleCount: 0,
    currentLatency: null,
    lastUpdateTime: Date.now(),
  });
  const [showMetrics, setShowMetrics] = useState<boolean>(false);
  
  // Language & context settings (Phase 6)
  const [sourceLanguage, setSourceLanguage] = useState<string>('de'); // Default: German
  const [vocabularyContext, setVocabularyContext] = useState<string>('');
  
  // Sentence stitching settings
  const [sentenceMode, setSentenceMode] = useState<boolean>(false); // Default: OFF
  const [sentenceHoldMs, setSentenceHoldMs] = useState<number>(600); // Default: 600ms

  // Refs to maintain state across renders
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sonioxClientRef = useRef<any>(null);
  
  // Token buffer for source (non-final tokens)
  // Translation tokens now handled by TranslationSentenceBuffer (Phase 8)
  const sourceBufferRef = useRef<Token[]>([]);
  
  // VAD and Keepalive managers (Phase 3)
  const vadManagerRef = useRef<VADManager | null>(null);
  const keepaliveManagerRef = useRef<KeepaliveManager | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Error handling managers (Phase 4)
  const retryManagerRef = useRef<RetryManager>(new RetryManager());
  const sessionStateRef = useRef<SessionStateManager>(new SessionStateManager());
  const maxRetries = 5;
  
  // Latency tracker (Phase 5)
  const latencyTrackerRef = useRef<LatencyTracker>(new LatencyTracker());
  
  // Sentence stitcher (for source text - kept for backward compatibility)
  const stitcherRef = useRef<SentenceStitcher | null>(null);
  
  // Translation sentence buffer (Phase 8 - for natural translation display)
  const translationBufferRef = useRef<TranslationSentenceBuffer | null>(null);
  
  // Streaming token processor (Phase 8.5 - Chat-style streaming)
  const streamingProcessorRef = useRef<StreamingTokenProcessor | null>(null);

  /**
   * Clear transcript and reset state
   * Phase 8.5: Updated to reset both legacy and streaming systems
   */
  const clearTranscript = useCallback(() => {
    // Clear legacy state
    setCommittedTranslation([]);
    setLiveTranslation('');
    setCommittedSource([]);
    setLiveSource('');
    
    // Clear streaming state
    setStreamingMessages([]);
    
    // Reset translation sentence buffer (Phase 8)
    if (translationBufferRef.current) {
      translationBufferRef.current.reset();
    }
    
    // Reset streaming processor (Phase 8.5)
    if (streamingProcessorRef.current) {
      streamingProcessorRef.current.reset();
    }
    
    sourceBufferRef.current = [];
    console.log('🗑️ Transcript cleared (legacy + streaming)');
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
   * Toggle metrics display (Phase 5)
   */
  const toggleMetrics = useCallback(() => {
    setShowMetrics(prev => !prev);
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

    // Cleanup sentence stitcher
    if (stitcherRef.current) {
      stitcherRef.current.reset();
      stitcherRef.current = null;
    }
    
    // Cleanup translation sentence buffer (Phase 8)
    if (translationBufferRef.current) {
      translationBufferRef.current.reset();
      translationBufferRef.current = null;
    }
    
    // Cleanup streaming processor (Phase 8.5)
    if (streamingProcessorRef.current) {
      streamingProcessorRef.current.reset();
      streamingProcessorRef.current = null;
    }
  }, []);

  /**
   * Process incoming tokens and update state
   * Phase 8.5: Enhanced with streaming token processor for chat-style display
   */
  const handleTokenUpdate = useCallback((tokens: Token[], audioProcessedMs?: number) => {
    console.log(`🔄 handleTokenUpdate called with ${tokens.length} tokens. isStreamingMode: ${isStreamingMode}, processor exists: ${!!streamingProcessorRef.current}`);
    
    // Log token details
    const translationTokens = tokens.filter(t => t.translation_status === 'translation');
    const sourceTokens = tokens.filter(t => t.translation_status === 'original');
    console.log(`   📊 ${translationTokens.length} translation tokens, ${sourceTokens.length} source tokens`);
    
    // Process tokens with streaming processor (Phase 8.5)
    if (streamingProcessorRef.current && isStreamingMode) {
      console.log(`✨ Using streaming mode - processing tokens...`);
      streamingProcessorRef.current.processTokens(tokens);
      
      // Update messages from streaming processor
      const messages = streamingProcessorRef.current.getAllMessages();
      console.log(`📮 Got ${messages.length} messages after processing`);
      setStreamingMessages(messages);
      
      // Mark token received for latency tracking (Phase 5)
      if (audioProcessedMs !== undefined) {
        latencyTrackerRef.current.markTokenReceived(audioProcessedMs);
      }
      
      console.log(`✅ Streaming mode processing complete`);
      return; // Use streaming mode only
    }
    
    console.log(`📝 Using legacy mode - processing tokens...`);

    // Legacy processing (Phase 8) - kept for backward compatibility
    const {
      newCommittedText: newSourceText,
      updatedBuffer: updatedSourceBuffer,
      liveText: newLiveSource,
      currentSpeaker,
    } = processSourceTokens(tokens, sourceBufferRef.current);

    sourceBufferRef.current = updatedSourceBuffer;

    // Update current speaker in translation buffer (Phase 8)
    console.log(`👤 Legacy mode - currentSpeaker from source tokens: ${currentSpeaker}`);
    if (translationBufferRef.current && currentSpeaker) {
      translationBufferRef.current.updateSpeaker(currentSpeaker);
      console.log(`✅ Updated translation buffer with speaker: ${currentSpeaker}`);
    } else if (!currentSpeaker) {
      console.warn(`⚠️ No speaker detected in source tokens`);
    }

    // Process translation tokens (English) - Phase 8: Use new buffer system
    const {
      finalTokens,
      nonFinalTokens,
    } = processTranslationTokens(tokens, []);

    // Add translation tokens to the sentence buffer (Phase 8)
    if (translationBufferRef.current) {
      const allTranslationTokens = [...finalTokens, ...nonFinalTokens];
      
      if (allTranslationTokens.length > 0) {
        translationBufferRef.current.addTranslationTokens(allTranslationTokens);
      }
      
      const livePreview = translationBufferRef.current.getLivePreview(nonFinalTokens);
      setLiveTranslation(livePreview);
    } else {
      // Fallback: Old behavior if buffer not initialized
      const {
        newCommittedText: newTranslationText,
        liveText: newLiveTranslation,
      } = processTranslationTokens(tokens, []);

      if (newTranslationText.trim().length > 0) {
        const newLine: TranscriptLine = {
          id: generateLineId(),
          text: cleanText(newTranslationText),
          timestamp: Date.now(),
          speaker: currentSpeaker,
        };
        setCommittedTranslation(prev => [...prev, newLine]);
      }
      
      setLiveTranslation(newLiveTranslation);
    }

    // Commit new final source text (with speaker label)
    if (newSourceText.trim().length > 0) {
      const cleanedText = cleanText(newSourceText);
      const newLine: TranscriptLine = {
        id: generateLineId(),
        text: cleanedText,
        timestamp: Date.now(),
        speaker: currentSpeaker,
      };
      
      setCommittedSource(prev => [...prev, newLine]);
      console.log(`✅ Committed source (Speaker ${currentSpeaker || 'unknown'}): ${cleanedText}`);
    }

    // Update live source
    setLiveSource(newLiveSource);
    
    // Mark token received for latency tracking (Phase 5)
    if (audioProcessedMs !== undefined) {
      latencyTrackerRef.current.markTokenReceived(audioProcessedMs);
    }
  }, [isStreamingMode]);

  /**
   * Manually finalize current utterance (Phase 3)
   * Triggers Soniox to finalize non-final tokens
   * Phase 8: Updated to flush translation buffer
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
      
      // Commit current streaming message (Phase 8.5)
      if (streamingProcessorRef.current && isStreamingMode) {
        streamingProcessorRef.current.commitCurrentMessage();
        console.log('🔄 Streaming message committed on manual finalize');
      }
      
      // Flush translation sentence buffer (Phase 8 - Legacy)
      if (translationBufferRef.current) {
        translationBufferRef.current.flush(true);
        console.log('🔄 Translation buffer flushed on manual finalize');
      }
    } catch (error) {
      console.error('❌ Error during manual finalization:', error);
    }
  }, []);

  /**
   * Commit any remaining live tokens when session ends
   * Phase 8.5: Updated to use both streaming and legacy systems
   */
  const finalizeTranscript = useCallback(() => {
    // Commit current streaming message (Phase 8.5)
    if (streamingProcessorRef.current && isStreamingMode) {
      streamingProcessorRef.current.commitCurrentMessage();
      console.log('🔄 Streaming message committed on finalize');
    }
    
    // Flush translation sentence buffer (Phase 8 - Legacy)
    if (translationBufferRef.current) {
      translationBufferRef.current.flush(true);
      console.log('🔄 Translation buffer flushed on finalize');
    }

    // Commit remaining source tokens
    const remainingSource = commitRemainingTokens(sourceBufferRef.current);
    if (remainingSource.trim().length > 0) {
      const cleanedText = cleanText(remainingSource);
      const currentSpeaker = translationBufferRef.current?.getCurrentSpeaker();
      const newLine: TranscriptLine = {
        id: generateLineId(),
        text: cleanedText,
        timestamp: Date.now(),
        speaker: currentSpeaker || undefined,
      };
      setCommittedSource(prev => [...prev, newLine]);
      console.log(`✅ Finalized source (Speaker ${currentSpeaker || 'unknown'}): ${cleanedText}`);
    }

    // Clear live text
    setLiveTranslation('');
    setLiveSource('');

    // Clear source buffer (translation buffer managed by TranslationSentenceBuffer)
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
   * Attempt to reconnect after error (Phase 4)
   */
  const attemptReconnection = useCallback(async (errorType: ErrorType) => {
    if (!retryManagerRef.current.canRetry()) {
      console.error('❌ Max retries exceeded, cannot reconnect');
      setIsReconnecting(false);
      setError('Connection failed after multiple attempts. Please try again.');
      return;
    }

    setIsReconnecting(true);
    const message = getUserFriendlyMessage(errorType);
    setReconnectionMessage(message);
    
    const stats = retryManagerRef.current.getStats();
    setRetryCount(stats.currentRetry + 1);
    
    console.log(`🔄 Attempting reconnection (${stats.currentRetry + 1}/${stats.maxRetries})...`);

    try {
      await retryManagerRef.current.scheduleRetry(async () => {
        // Finalize any pending tokens before reconnecting
        finalizeTranscript();
        
        // Save current state
        sessionStateRef.current.saveState(committedTranslation.length);
        
        // Restart translation session
        await startTranslationInternal();
      });
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      setIsReconnecting(false);
      setError('Failed to reconnect. Please try starting again.');
    }
  }, [committedTranslation.length]);

  /**
   * Internal start translation function (used for both initial start and reconnection)
   */
  const startTranslationInternal = useCallback(async () => {
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

      // Step 4: Initialize Streaming Token Processor (Phase 8.5)
      // This provides chat-style streaming with final/mutable regions
      streamingProcessorRef.current = new StreamingTokenProcessor(
        (update: StreamingUpdate) => {
          console.log(`🎯 StreamingProcessor callback triggered! Type: ${update.type}, Speaker: ${update.speaker}`);
          
          // Update messages state when streaming processor updates
          const messages = streamingProcessorRef.current?.getAllMessages() || [];
          console.log(`📦 Got ${messages.length} messages from processor`);
          
          setStreamingMessages(messages);
          console.log(`✅ Set streaming messages state with ${messages.length} messages`);
          
          console.log(`📝 Streaming update: ${update.type} for ${update.speaker}`);
          
          // Track latency for streaming updates (Phase 5)
          const latency = latencyTrackerRef.current.markDisplayed('translation');
          if (latency !== null) {
            console.log(`⏱️ Streaming latency: ${Math.round(latency)}ms`);
            setLatencyMetrics(latencyTrackerRef.current.getMetrics());
          }
        },
        {
          enabled: true,
          maxRollbackTokens: 10,
          updateThrottleMs: 16, // ~60fps
          autoCommitOnPause: true,
          mergeConsecutiveSpeakers: true,
        }
      );

      // Step 4b: Initialize Translation Sentence Buffer (Phase 8 - Legacy)
      // Keep for backward compatibility when streaming mode is disabled
      translationBufferRef.current = new TranslationSentenceBuffer(
        (sentence) => {
          const newLine: TranscriptLine = {
            id: generateLineId(),
            text: sentence.text,
            timestamp: Date.now(),
            speaker: sentence.speaker,
          };
          setCommittedTranslation((prev) => [...prev, newLine]);
          
          console.log(`✅ Translation sentence committed (Speaker ${sentence.speaker || 'unknown'}): ${sentence.text}`);
          
          // Track latency for final translations (Phase 5)
          const latency = latencyTrackerRef.current.markDisplayed('translation');
          if (latency !== null) {
            console.log(`⏱️ Translation latency: ${Math.round(latency)}ms`);
            setLatencyMetrics(latencyTrackerRef.current.getMetrics());
          }
        },
        {
          enabled: true, // Always enabled - routing controlled by handleTokenUpdate
          holdMs: sentenceHoldMs,
          maxHoldMs: Math.max(2000, Math.floor(sentenceHoldMs * 3.5)),
          maxChars: 500,
        }
      );

      // Step 5: Initialize VAD and Keepalive (Phase 3)
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

      // Step 6: Start translation stream
      console.log('🚀 Starting translation stream...');
      
      // Prepare language hints (Phase 6)
      const languageHints = sourceLanguage === 'auto' 
        ? ['de', 'en', 'es', 'fr', 'it', 'pt'] // Multi-language
        : [sourceLanguage];
      
      // Prepare context string (Phase 6)
      const contextString = vocabularyContext.trim().length > 0
        ? vocabularyContext
        : undefined;
      
      console.log(`🌍 Language hints: ${languageHints.join(', ')}`);
      if (contextString) {
        console.log(`📚 Context provided: ${contextString.substring(0, 50)}...`);
      }
      
      await client.start({
        model: 'stt-rt-preview-v2',
        
        // Translation configuration: Source → English
        translation: {
          type: 'one_way',
          target_language: 'en',
        },

        // Audio configuration
        stream: stream,
        audioFormat: 'auto',

        // Language hints for better accuracy (Phase 6: Dynamic)
        languageHints,
        
        // Enable language identification (Phase 6)
        enableLanguageIdentification: sourceLanguage === 'auto',
        
        // Context/vocabulary hints (Phase 6)
        ...(contextString && { context: contextString }),

        // Enable endpoint detection for better finalization
        enableEndpointDetection: true,
        
        // Enable speaker diarization for multi-speaker scenarios (Phase 8)
        enableSpeakerDiarization: true,

        // Callbacks
        onStarted: () => {
          console.log('✅ Translation started successfully');
          
          // Reset retry manager on successful connection (Phase 4)
          retryManagerRef.current.reset();
          setIsReconnecting(false);
          setRetryCount(0);
          setReconnectionMessage('');
          
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
          // Mark capture start for latency tracking (Phase 5)
          if (result.tokens.some(t => t.is_final)) {
            // Only track when we get final tokens
            if (!latencyTrackerRef.current.getMetrics().currentLatency) {
              latencyTrackerRef.current.markCaptureStart();
            }
          }
          
          // Process tokens and update state
          handleTokenUpdate(result.tokens, result.final_audio_proc_ms);
          
          // Keep console logging for debugging
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
          
          // Check if this is an unexpected termination (Phase 4)
          // If user didn't explicitly stop, this might be a session limit
          if (isRecording && mediaStreamRef.current) {
            console.warn('⚠️ Session terminated unexpectedly, may attempt reconnection');
            
            // Finalize any remaining tokens
            finalizeTranscript();
            
            // Save state
            sessionStateRef.current.saveState(committedTranslation.length);
            
            // Attempt reconnection if we still have media stream
            if (retryManagerRef.current.canRetry()) {
              console.log('🔄 Attempting automatic session restart...');
              attemptReconnection(ErrorType.SESSION_TERMINATED);
              return;
            }
          }
          
          // Normal termination - finalize and cleanup
          finalizeTranscript();
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
          
          // Classify error type (Phase 4)
          const errorType = classifyError(errorCode || status, message);
          console.log(`🔍 Error classified as: ${errorType}`);
          
          // Check if this is a session termination error
          const isTermination = isSessionTerminationError(message);
          
          // Determine if we should attempt reconnection
          const shouldReconnect = isRetryableError(errorType) || isTermination;
          
          if (shouldReconnect && mediaStreamRef.current) {
            console.log('🔄 Error is retryable, attempting reconnection...');
            
            // Don't cleanup media stream yet - we'll reuse it
            // Just cleanup Soniox client and managers
            cleanupManagers();
            
            // Set temporary error message
            setError(`${message} - Reconnecting...`);
            setIsRecording(false);
            setIsConnecting(false);
            
            // Attempt reconnection
            attemptReconnection(errorType);
          } else {
            // Non-retryable error - full cleanup
            console.log('❌ Error is not retryable, stopping session');
            setError(`Error ${errorCode || status}: ${message}`);
            setIsRecording(false);
            setIsConnecting(false);
            setIsReconnecting(false);
            
            // Full cleanup
            cleanupManagers();
            
            if (mediaStreamRef.current) {
              mediaStreamRef.current.getTracks().forEach(track => track.stop());
              mediaStreamRef.current = null;
            }
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
  }, [getMicrophoneAccess, fetchApiKey, handleTokenUpdate, finalizeTranscript, vadEnabled, silenceThreshold, manualFinalize, cleanupManagers, attemptReconnection, sourceLanguage, vocabularyContext, sentenceMode, sentenceHoldMs]);

  /**
   * Public start translation function
   */
  const startTranslation = useCallback(async () => {
    if (isRecording || isConnecting) {
      console.warn('⚠️ Translation already in progress');
      return;
    }

    // Reset retry manager for fresh start
    retryManagerRef.current.reset();
    sessionStateRef.current.reset();
    setRetryCount(0);
    setIsReconnecting(false);
    
    await startTranslationInternal();
  }, [isRecording, isConnecting, startTranslationInternal]);

  /**
   * Stop translation (graceful)
   */
  const stopTranslation = useCallback(async () => {
    console.log('🛑 Stopping translation gracefully...');
    
    // Cancel any pending retries (Phase 4)
    retryManagerRef.current.cancel();
    setIsReconnecting(false);
    setRetryCount(0);
    
    if (!sonioxClientRef.current && !isReconnecting) {
      console.warn('⚠️ No active translation session to stop');
      return;
    }
    
    // Finalize any remaining tokens before stopping
    finalizeTranscript();
    
    // Cleanup VAD and Keepalive
    await cleanupManagers();
    
    if (sonioxClientRef.current) {
      try {
        sonioxClientRef.current.stop();
      } catch (err) {
        console.error('❌ Error stopping translation:', err);
      }
    }

    // Clean up media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    sonioxClientRef.current = null;
    setIsRecording(false);
    setIsConnecting(false);
  }, [finalizeTranscript, cleanupManagers, isReconnecting]);

  /**
   * Cancel translation (abrupt)
   */
  const cancelTranslation = useCallback(async () => {
    console.log('⚠️ Canceling translation...');
    
    // Cancel any pending retries (Phase 4)
    retryManagerRef.current.cancel();
    setIsReconnecting(false);
    setRetryCount(0);
    
    if (!sonioxClientRef.current && !isReconnecting) {
      console.warn('⚠️ No active translation session to cancel');
      return;
    }
    
    // Cleanup VAD and Keepalive
    await cleanupManagers();
    
    if (sonioxClientRef.current) {
      try {
        sonioxClientRef.current.cancel();
      } catch (err) {
        console.error('❌ Error canceling translation:', err);
      }
    }

    // Clean up media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    sonioxClientRef.current = null;
    setIsRecording(false);
    setIsConnecting(false);
  }, [cleanupManagers, isReconnecting]);

  return {
    // Connection state
    isRecording,
    isConnecting,
    error,
    
    // Streaming content (Phase 8.5 - Chat-style)
    streamingMessages,
    isStreamingMode,
    
    // Legacy content (for backward compatibility)
    committedTranslation,
    liveTranslation,
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
    
    // Reconnection state (Phase 4)
    isReconnecting,
    retryCount,
    maxRetries,
    reconnectionMessage,
    
    // Latency metrics (Phase 5)
    latencyMetrics,
    showMetrics,
    toggleMetrics,
    
    // Language & context settings (Phase 6)
    sourceLanguage,
    setSourceLanguage,
    vocabularyContext,
    setVocabularyContext,
    
    // Sentence stitching settings
    sentenceMode,
    setSentenceMode,
    sentenceHoldMs,
    setSentenceHoldMs,
    
    // Streaming mode toggle (Phase 8.5)
    toggleStreamingMode: () => setIsStreamingMode(prev => !prev),
  };
}

