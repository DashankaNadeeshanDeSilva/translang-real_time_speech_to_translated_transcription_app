'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { FileText, FileJson, FileCode, Copy, Check, Download } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  translations: TranscriptLine[];
  source?: TranscriptLine[];
  includeSource: boolean;
}

export function ExportDialog({
  open,
  onOpenChange,
  translations,
  source = [],
  includeSource,
}: ExportDialogProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  const hasTranslations = translations.length > 0;
  const stats = hasTranslations ? getTranscriptStats(translations) : null;

  const handleExportTXT = async () => {
    setExportingFormat('txt');
    try {
      const content = exportAsText(translations, includeSource ? source : undefined);
      const filename = generateFilename('txt');
      downloadFile(content, filename, 'text/plain');
      setTimeout(() => setExportingFormat(null), 1000);
    } catch (err) {
      console.error('Export TXT failed:', err);
      setExportingFormat(null);
    }
  };

  const handleExportJSON = async () => {
    setExportingFormat('json');
    try {
      const content = exportAsJSON(translations, includeSource ? source : undefined);
      const filename = generateFilename('json');
      downloadFile(content, filename, 'application/json');
      setTimeout(() => setExportingFormat(null), 1000);
    } catch (err) {
      console.error('Export JSON failed:', err);
      setExportingFormat(null);
    }
  };

  const handleExportSRT = async () => {
    setExportingFormat('srt');
    try {
      const content = exportAsSRT(translations);
      const filename = generateFilename('srt');
      downloadFile(content, filename, 'text/plain');
      setTimeout(() => setExportingFormat(null), 1000);
    } catch (err) {
      console.error('Export SRT failed:', err);
      setExportingFormat(null);
    }
  };

  const handleCopy = async () => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export & Share
          </DialogTitle>
          <DialogDescription>
            Your translation session has ended. Export your transcripts in various formats.
          </DialogDescription>
        </DialogHeader>

        {stats && (
          <div className="py-3 px-4 bg-muted rounded-md text-sm">
            <p className="font-medium">Session Summary:</p>
            <p className="text-muted-foreground">
              {stats.totalLines} lines • {stats.totalWords} words • {stats.totalCharacters} characters
            </p>
          </div>
        )}

        <div className="space-y-3 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleExportTXT}
              variant="outline"
              className="h-20 flex flex-col gap-2"
              disabled={exportingFormat === 'txt'}
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm">
                {exportingFormat === 'txt' ? 'Exporting...' : 'Export TXT'}
              </span>
            </Button>

            <Button
              onClick={handleExportJSON}
              variant="outline"
              className="h-20 flex flex-col gap-2"
              disabled={exportingFormat === 'json'}
            >
              <FileJson className="h-5 w-5" />
              <span className="text-sm">
                {exportingFormat === 'json' ? 'Exporting...' : 'Export JSON'}
              </span>
            </Button>

            <Button
              onClick={handleExportSRT}
              variant="outline"
              className="h-20 flex flex-col gap-2"
              disabled={exportingFormat === 'srt'}
            >
              <FileCode className="h-5 w-5" />
              <span className="text-sm">
                {exportingFormat === 'srt' ? 'Exporting...' : 'Export SRT'}
              </span>
            </Button>

            <Button
              onClick={handleCopy}
              variant={copyStatus === 'copied' ? 'default' : 'outline'}
              className="h-20 flex flex-col gap-2"
            >
              {copyStatus === 'copied' ? (
                <>
                  <Check className="h-5 w-5" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5" />
                  <span className="text-sm">Copy Text</span>
                </>
              )}
            </Button>
          </div>

          <div className="pt-2 border-t">
            <Button
              onClick={() => onOpenChange(false)}
              variant="secondary"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

