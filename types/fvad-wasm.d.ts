/**
 * Type declarations for @echogarden/fvad-wasm
 * Voice Activity Detection library
 */

declare module '@echogarden/fvad-wasm' {
  export class Vad {
    static create(config: {
      mode?: number;
      frameDuration?: number;
      sampleRate?: number;
    }): Promise<Vad>;

    processFrame(audioFrame: Float32Array): Promise<{ isSpeech: boolean }>;
    destroy(): Promise<void>;
  }
}

