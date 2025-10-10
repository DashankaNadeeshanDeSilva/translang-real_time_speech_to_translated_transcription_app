/**
 * Export Utilities
 * 
 * Functions for exporting transcripts in various formats:
 * - Plain text (.txt)
 * - JSON with metadata (.json)
 * - SRT subtitle format (.srt)
 * 
 * Phase 6 Implementation
 */

import { TranscriptLine } from '@/hooks/useTranslator';

/**
 * Export transcript as plain text
 */
export function exportAsText(
  translations: TranscriptLine[],
  includeSource?: TranscriptLine[]
): string {
  let text = '=== TransLang Translation Transcript ===\n\n';
  
  if (includeSource && includeSource.length > 0) {
    // Interleave source and translation
    text += 'Format: [German] Original → [English] Translation\n\n';
    
    const maxLength = Math.max(translations.length, includeSource.length);
    for (let i = 0; i < maxLength; i++) {
      if (includeSource[i]) {
        text += `[DE] ${includeSource[i].text}\n`;
      }
      if (translations[i]) {
        text += `[EN] ${translations[i].text}\n`;
      }
      text += '\n';
    }
  } else {
    // Translation only
    text += 'English Translations:\n\n';
    translations.forEach((line, index) => {
      text += `${index + 1}. ${line.text}\n`;
    });
  }
  
  text += `\n=== End of Transcript (${translations.length} lines) ===\n`;
  text += `Generated: ${new Date().toLocaleString()}\n`;
  
  return text;
}

/**
 * Export transcript as JSON with metadata
 */
export function exportAsJSON(
  translations: TranscriptLine[],
  source?: TranscriptLine[],
  metadata?: any
): string {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    metadata: {
      totalLines: translations.length,
      sourceLanguage: 'de',
      targetLanguage: 'en',
      ...metadata,
    },
    translations: translations.map((line, index) => ({
      index,
      id: line.id,
      text: line.text,
      timestamp: line.timestamp,
      source: source && source[index] ? source[index].text : null,
    })),
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Export transcript as SRT subtitle format
 */
export function exportAsSRT(
  translations: TranscriptLine[],
  startTime: number = 0
): string {
  let srt = '';
  
  translations.forEach((line, index) => {
    // SRT index (1-based)
    srt += `${index + 1}\n`;
    
    // Calculate timestamps (estimate 3 seconds per line if not tracked)
    const relativeTime = line.timestamp - startTime;
    const start = formatSRTTime(relativeTime);
    const end = formatSRTTime(relativeTime + 3000); // 3 seconds duration
    
    srt += `${start} --> ${end}\n`;
    srt += `${line.text}\n\n`;
  });
  
  return srt;
}

/**
 * Format time for SRT (HH:MM:SS,mmm)
 */
function formatSRTTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ms = milliseconds % 1000;
  
  return `${padZero(hours, 2)}:${padZero(minutes, 2)}:${padZero(seconds, 2)},${padZero(ms, 3)}`;
}

/**
 * Pad number with zeros
 */
function padZero(num: number, length: number): string {
  return num.toString().padStart(length, '0');
}

/**
 * Download file to user's computer
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(format: 'txt' | 'json' | 'srt'): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  
  return `translang-transcript-${dateStr}_${timeStr}.${format}`;
}

/**
 * Get transcript statistics
 */
export function getTranscriptStats(translations: TranscriptLine[]): {
  totalLines: number;
  totalWords: number;
  totalCharacters: number;
  averageLineLength: number;
  longestLine: number;
} {
  const totalLines = translations.length;
  const allText = translations.map(t => t.text).join(' ');
  const totalWords = allText.split(/\s+/).filter(w => w.length > 0).length;
  const totalCharacters = allText.length;
  
  const lineLengths = translations.map(t => t.text.length);
  const averageLineLength = lineLengths.length > 0
    ? lineLengths.reduce((sum, len) => sum + len, 0) / lineLengths.length
    : 0;
  const longestLine = lineLengths.length > 0 ? Math.max(...lineLengths) : 0;
  
  return {
    totalLines,
    totalWords,
    totalCharacters,
    averageLineLength: Math.round(averageLineLength),
    longestLine,
  };
}

/**
 * Validate export data
 */
export function validateExportData(translations: TranscriptLine[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!translations || translations.length === 0) {
    errors.push('No translations to export');
  }
  
  if (translations && translations.some(t => !t.text || t.text.trim().length === 0)) {
    errors.push('Some translations are empty');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

