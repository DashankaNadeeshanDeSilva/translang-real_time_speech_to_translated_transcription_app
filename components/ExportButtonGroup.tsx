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
} from '@/utils/exportUtils';
import { FileText, FileJson, FileCode, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ExportButtonGroupProps {
  translations: TranscriptLine[];
  source?: TranscriptLine[];
  includeSource: boolean;
  isRecording: boolean;
  hasSessionEnded?: boolean;
}

export function ExportButtonGroup({
  translations,
  source = [],
  includeSource,
  isRecording,
  hasSessionEnded = false,
}: ExportButtonGroupProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const hasTranslations = translations.length > 0;
  // Only enable if session has ended AND has translations
  const isDisabled = !hasSessionEnded || !hasTranslations;

  const handleExportTXT = () => {
    if (isDisabled) return;
    try {
      const content = exportAsText(translations, includeSource ? source : undefined);
      const filename = generateFilename('txt');
      downloadFile(content, filename, 'text/plain');
    } catch (err) {
      console.error('Export TXT failed:', err);
    }
  };

  const handleExportJSON = () => {
    if (isDisabled) return;
    try {
      const content = exportAsJSON(translations, includeSource ? source : undefined);
      const filename = generateFilename('json');
      downloadFile(content, filename, 'application/json');
    } catch (err) {
      console.error('Export JSON failed:', err);
    }
  };

  const handleExportSRT = () => {
    if (isDisabled) return;
    try {
      const content = exportAsSRT(translations);
      const filename = generateFilename('srt');
      downloadFile(content, filename, 'text/plain');
    } catch (err) {
      console.error('Export SRT failed:', err);
    }
  };

  const handleCopy = async () => {
    if (isDisabled) return;
    try {
      const content = exportAsText(translations, includeSource ? source : undefined);
      await copyToClipboard(content);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleExportTXT}
                disabled={isDisabled}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                TXT
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export as plain text</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleExportJSON}
                disabled={isDisabled}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <FileJson className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export as JSON with metadata</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleExportSRT}
                disabled={isDisabled}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <FileCode className="h-4 w-4 mr-2" />
                SRT
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export as SRT subtitle file</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleCopy}
                disabled={isDisabled}
                variant={copyStatus === 'copied' ? 'default' : 'outline'}
                size="sm"
                className="w-full"
              >
                {copyStatus === 'copied' ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy to clipboard</TooltipContent>
          </Tooltip>
        </div>

        {!hasSessionEnded && hasTranslations && (
          <p className="text-xs text-muted-foreground text-center">
            Stop session to export
          </p>
        )}
        {!hasTranslations && hasSessionEnded && (
          <p className="text-xs text-muted-foreground text-center">
            No translations to export
          </p>
        )}
        {!hasSessionEnded && !hasTranslations && (
          <p className="text-xs text-muted-foreground text-center">
            Start translating first
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}

