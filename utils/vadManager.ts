/**
 * VAD (Voice Activity Detection) Manager
 * 
 * Manages voice activity detection using @echogarden/fvad-wasm library.
 * Detects speech vs silence to enable intelligent finalization and
 * resource optimization during translation sessions.
 * 
 * Phase 3 Implementation
 */

export interface VADConfig {
  sampleRate: number;
  frameDuration: 10 | 20 | 30; // milliseconds
  mode: 0 | 1 | 2 | 3; // 0=least aggressive, 3=most aggressive
  silenceThreshold: number; // milliseconds of silence before triggering finalization
  debounceDelay: number; // milliseconds to wait before allowing another finalization
}

export interface VADResult {
  isSpeech: boolean;
  silenceDuration: number;
  shouldFinalize: boolean;
}

export const DEFAULT_VAD_CONFIG: VADConfig = {
  sampleRate: 16000,
  frameDuration: 30, // 30ms frames for good balance
  mode: 3, // Most aggressive - better for translation use case
  silenceThreshold: 800, // 800ms of silence triggers finalization
  debounceDelay: 300, // Wait 300ms before allowing another finalization
};

/**
 * VAD Manager Class
 * 
 * Handles initialization, frame processing, and silence detection
 */
export class VADManager {
  private vad: any = null;
  private config: VADConfig;
  private silenceStartTime: number | null = null;
  private lastFinalizeTime: number = 0;
  private isInitialized: boolean = false;

  constructor(config: Partial<VADConfig> = {}) {
    this.config = { ...DEFAULT_VAD_CONFIG, ...config };
  }

  /**
   * Initialize VAD engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ VAD already initialized');
      return;
    }

    try {
      console.log('🎙️ Initializing VAD...');
      
      // Dynamically import VAD library (browser-only)
      const { Vad } = await import('@echogarden/fvad-wasm');
      
      // Initialize VAD with configuration
      this.vad = await Vad.create({
        sampleRate: this.config.sampleRate,
        frameDuration: this.config.frameDuration,
        mode: this.config.mode,
      });

      this.isInitialized = true;
      console.log('✅ VAD initialized successfully');
      console.log(`   Sample Rate: ${this.config.sampleRate}Hz`);
      console.log(`   Frame Duration: ${this.config.frameDuration}ms`);
      console.log(`   Mode: ${this.config.mode} (aggressiveness)`);
      console.log(`   Silence Threshold: ${this.config.silenceThreshold}ms`);
    } catch (error) {
      console.error('❌ Failed to initialize VAD:', error);
      throw new Error('VAD initialization failed');
    }
  }

  /**
   * Process audio frame and detect speech/silence
   * 
   * @param audioData - PCM audio data (Int16Array or Float32Array)
   * @returns VAD result with speech detection and finalization recommendation
   */
  processFrame(audioData: Int16Array | Float32Array): VADResult {
    if (!this.isInitialized || !this.vad) {
      throw new Error('VAD not initialized. Call initialize() first.');
    }

    // Convert Float32Array to Int16Array if needed
    const pcmData = audioData instanceof Float32Array
      ? this.float32ToInt16(audioData)
      : audioData;

    // Detect speech in frame
    const isSpeech = this.vad.processFrame(pcmData);

    const now = Date.now();
    let silenceDuration = 0;
    let shouldFinalize = false;

    if (isSpeech) {
      // Speech detected - reset silence timer
      if (this.silenceStartTime !== null) {
        console.log('🗣️ Speech resumed after silence');
      }
      this.silenceStartTime = null;
      silenceDuration = 0;
    } else {
      // Silence detected
      if (this.silenceStartTime === null) {
        // Start of silence
        this.silenceStartTime = now;
        console.log('🤫 Silence started');
      } else {
        // Continuing silence - calculate duration
        silenceDuration = now - this.silenceStartTime;

        // Check if silence duration exceeds threshold
        if (silenceDuration >= this.config.silenceThreshold) {
          // Check if enough time has passed since last finalization (debounce)
          const timeSinceLastFinalize = now - this.lastFinalizeTime;
          
          if (timeSinceLastFinalize >= this.config.debounceDelay) {
            shouldFinalize = true;
            this.lastFinalizeTime = now;
            console.log(`⏸️ Silence threshold reached (${silenceDuration}ms) - should finalize`);
          }
        }
      }
    }

    return {
      isSpeech,
      silenceDuration,
      shouldFinalize,
    };
  }

  /**
   * Convert Float32Array (-1 to 1) to Int16Array PCM
   */
  private float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp to -1 to 1 range
      const clamped = Math.max(-1, Math.min(1, float32Array[i]));
      // Convert to 16-bit PCM
      int16Array[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
    }
    return int16Array;
  }

  /**
   * Update VAD configuration
   */
  updateConfig(newConfig: Partial<VADConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 VAD config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): VADConfig {
    return { ...this.config };
  }

  /**
   * Reset VAD state
   */
  reset(): void {
    this.silenceStartTime = null;
    this.lastFinalizeTime = 0;
    console.log('🔄 VAD state reset');
  }

  /**
   * Cleanup and destroy VAD instance
   */
  async destroy(): Promise<void> {
    if (this.vad) {
      try {
        await this.vad.destroy();
        this.vad = null;
        this.isInitialized = false;
        console.log('🗑️ VAD destroyed');
      } catch (error) {
        console.error('❌ Error destroying VAD:', error);
      }
    }
  }

  /**
   * Check if VAD is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

/**
 * Calculate frame size in samples
 */
export function calculateFrameSize(
  sampleRate: number,
  frameDuration: number
): number {
  return (sampleRate * frameDuration) / 1000;
}

/**
 * Split audio buffer into frames
 */
export function splitIntoFrames(
  audioBuffer: Float32Array,
  frameSize: number
): Float32Array[] {
  const frames: Float32Array[] = [];
  
  for (let i = 0; i < audioBuffer.length; i += frameSize) {
    const frame = audioBuffer.slice(i, i + frameSize);
    
    // Only add complete frames
    if (frame.length === frameSize) {
      frames.push(frame);
    }
  }
  
  return frames;
}

/**
 * Resample audio to target sample rate (simple linear interpolation)
 * Note: For production, consider using a proper resampling library
 */
export function resampleAudio(
  input: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number
): Float32Array {
  if (sourceSampleRate === targetSampleRate) {
    return input;
  }

  const ratio = sourceSampleRate / targetSampleRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const position = i * ratio;
    const index = Math.floor(position);
    const fraction = position - index;

    if (index + 1 < input.length) {
      // Linear interpolation
      output[i] = input[index] * (1 - fraction) + input[index + 1] * fraction;
    } else {
      output[i] = input[index];
    }
  }

  return output;
}

