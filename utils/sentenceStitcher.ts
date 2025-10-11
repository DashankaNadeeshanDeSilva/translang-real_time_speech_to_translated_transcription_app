export type StitcherConfig = {
  enabled: boolean;
  holdMs?: number;            // wait for possible continuation
  maxHoldMs?: number;         // hard cap to avoid long waits
  maxChars?: number;          // safety cap for very long sentences
};

const DEFAULTS: Required<StitcherConfig> = {
  enabled: false,
  holdMs: 600,
  maxHoldMs: 1500,
  maxChars: 280,
};

const SENTENCE_END = /[.!?…]["')\]]?\s*$/;

function endsSentence(text: string) {
  return SENTENCE_END.test(text.trim());
}

function needsMerge(prev: string, next: string) {
  if (!prev.trim()) return false;
  const prevEnds = endsSentence(prev);
  const nextStartsLower = /^[a-z]/.test(next.trim());
  const nextStartsPunct = /^[,;:–-]/.test(next.trim());
  return !prevEnds || nextStartsLower || nextStartsPunct;
}

function normalizeSpaces(text: string) {
  return text.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
}

export class SentenceStitcher {
  private cfg = DEFAULTS;
  private buffer = '';
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private holdStart = 0;

  constructor(
    private onCommit: (sentence: string) => void,
    cfg?: StitcherConfig
  ) {
    this.cfg = { ...DEFAULTS, ...cfg };
  }

  updateConfig(cfg: Partial<StitcherConfig>) {
    this.cfg = { ...this.cfg, ...cfg };
  }

  reset() {
    this.clearTimer();
    this.buffer = '';
    this.holdStart = 0;
  }

  addFinalChunk(text: string) {
    if (!this.cfg.enabled) {
      // Direct commit when disabled
      const t = text.trim();
      if (t) this.onCommit(t);
      return;
    }

    const t = text.trim();
    if (!t) return;

    if (needsMerge(this.buffer, t)) {
      this.buffer = normalizeSpaces(`${this.buffer} ${t}`);
    } else {
      // previous sentence looked complete; commit and start new
      this.commitBuffer();
      this.buffer = t;
    }

    if (endsSentence(this.buffer) || this.buffer.length >= this.cfg.maxChars) {
      this.commitBuffer();
      return;
    }

    // soft hold: wait briefly for continuation
    this.startHold();
  }

  getLiveText(partial?: string) {
    if (!this.cfg.enabled) {
      return partial?.trim() || '';
    }

    const live = [this.buffer, partial?.trim()].filter(Boolean).join(' ');
    return normalizeSpaces(live);
  }

  flush(force = false) {
    if (!this.cfg.enabled || !this.buffer) return;
    if (force || performance.now() - this.holdStart >= this.cfg.maxHoldMs) {
      this.commitBuffer();
    }
  }

  private startHold() {
    this.clearTimer();
    this.holdStart = performance.now();
    this.holdTimer = setTimeout(() => this.commitBuffer(), this.cfg.holdMs);
  }

  private clearTimer() {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  private commitBuffer() {
    this.clearTimer();
    const out = normalizeSpaces(this.buffer);
    if (out) this.onCommit(out);
    this.buffer = '';
  }
}
