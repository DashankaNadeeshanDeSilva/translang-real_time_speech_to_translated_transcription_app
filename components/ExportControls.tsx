'use client';

import { useState } from 'react';
import { TranscriptLine } from '@/hooks/useTranslator';
import {
  exportAsText,
  exportAsJSON,
  exportAsSRT,
  downloadFile,
  copyToClipboard,
  generateFilename,
  getTranscriptStats,
} from '@/utils/exportUtils';

/**
 * Export Controls Component
 * 
 * Provides buttons for exporting and copying transcripts.
 * 
 * Phase 6 Implementation
 */

interface ExportControlsProps {
  translations: TranscriptLine[];
  source?: TranscriptLine[];
  includeSource: boolean;
}

export function ExportControls({
  translations,
  source = [],
  includeSource,
}: ExportControlsProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const [exportStatus, setExportStatus] = useState<string>('');

  const hasTranslations = translations.length > 0;
  const stats = hasTranslations ? getTranscriptStats(translations) : null;

  /**
   * Export as TXT
   */
  const handleExportTXT = () => {
    try {
      const content = exportAsText(
        translations,
        includeSource ? source : undefined
      );
      const filename = generateFilename('txt');
      downloadFile(content, filename, 'text/plain');
      setExportStatus(`✅ Exported as ${filename}`);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('❌ Export failed');
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  /**
   * Export as JSON
   */
  const handleExportJSON = () => {
    try {
      const content = exportAsJSON(
        translations,
        includeSource ? source : undefined,
        { stats }
      );
      const filename = generateFilename('json');
      downloadFile(content, filename, 'application/json');
      setExportStatus(`✅ Exported as ${filename}`);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('❌ Export failed');
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  /**
   * Export as SRT
   */
  const handleExportSRT = () => {
    try {
      const startTime = translations.length > 0 ? translations[0].timestamp : 0;
      const content = exportAsSRT(translations, startTime);
      const filename = generateFilename('srt');
      downloadFile(content, filename, 'text/srt');
      setExportStatus(`✅ Exported as ${filename}`);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('❌ Export failed');
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  /**
   * Copy to clipboard
   */
  const handleCopyToClipboard = async () => {
    setCopyStatus('copying');
    
    try {
      const content = exportAsText(
        translations,
        includeSource ? source : undefined
      );
      const success = await copyToClipboard(content);
      
      if (success) {
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
      } else {
        setCopyStatus('error');
        setTimeout(() => setCopyStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Copy failed:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  if (!hasTranslations) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.title}>💾 Export & Share</h4>
        {stats && (
          <div style={styles.stats}>
            {stats.totalLines} lines • {stats.totalWords} words
          </div>
        )}
      </div>

      <div style={styles.content}>
        {/* Export Buttons */}
        <div style={styles.buttonGroup}>
          <button
            onClick={handleExportTXT}
            style={styles.exportButton}
            title="Export as plain text file"
          >
            📄 Export TXT
          </button>
          
          <button
            onClick={handleExportJSON}
            style={styles.exportButton}
            title="Export as JSON with metadata"
          >
            📋 Export JSON
          </button>
          
          <button
            onClick={handleExportSRT}
            style={styles.exportButton}
            title="Export as SRT subtitle file"
          >
            🎬 Export SRT
          </button>
          
          <button
            onClick={handleCopyToClipboard}
            style={{
              ...styles.copyButton,
              backgroundColor: 
                copyStatus === 'success' ? '#10b981' :
                copyStatus === 'error' ? '#ef4444' :
                '#3b82f6',
            }}
            disabled={copyStatus === 'copying'}
            title="Copy transcript to clipboard"
          >
            {copyStatus === 'idle' && '📋 Copy'}
            {copyStatus === 'copying' && '⏳ Copying...'}
            {copyStatus === 'success' && '✅ Copied!'}
            {copyStatus === 'error' && '❌ Failed'}
          </button>
        </div>

        {/* Export Status */}
        {exportStatus && (
          <div style={styles.statusBox}>
            {exportStatus}
          </div>
        )}

        {/* Export Info */}
        <div style={styles.infoBox}>
          <p style={styles.infoTitle}>📥 Export Formats:</p>
          <ul style={styles.infoList}>
            <li><strong>TXT</strong> - Plain text, easy to read</li>
            <li><strong>JSON</strong> - With metadata, timestamps, source text</li>
            <li><strong>SRT</strong> - Subtitle format for videos</li>
            <li><strong>Copy</strong> - Quick paste into other apps</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    marginTop: '1rem',
  },
  header: {
    padding: '0.75rem 1rem',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    margin: 0,
  },
  stats: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  content: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  exportButton: {
    padding: '0.625rem 1rem',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.8125rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flex: '1',
    minWidth: '110px',
  },
  copyButton: {
    padding: '0.625rem 1rem',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.8125rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flex: '1',
    minWidth: '110px',
  },
  statusBox: {
    padding: '0.5rem 0.75rem',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    color: '#166534',
    textAlign: 'center' as const,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #dbeafe',
    borderRadius: '0.375rem',
    padding: '0.75rem',
  },
  infoTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 0.375rem 0',
  },
  infoList: {
    fontSize: '0.6875rem',
    color: '#1e40af',
    margin: '0 0 0 1.125rem',
    padding: 0,
    lineHeight: '1.6',
  },
};

