'use client';

import { useState } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TranscriptLine } from '@/hooks/useTranslator';

interface SaveTranscriptButtonProps {
  translations: TranscriptLine[];
  source: TranscriptLine[];
  sourceLanguage: string;
  disabled?: boolean;
}

export function SaveTranscriptButton({
  translations,
  source,
  sourceLanguage,
  disabled,
}: SaveTranscriptButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    setSaving(true);

    try {
      // Calculate duration from timestamps
      const firstTimestamp = translations[0]?.timestamp || Date.now();
      const lastTimestamp = translations[translations.length - 1]?.timestamp || Date.now();
      const durationMs = lastTimestamp - firstTimestamp;

      const response = await fetch('/api/transcripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          source_language: sourceLanguage,
          translations,
          source,
          duration_ms: durationMs,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save transcript');
      }

      // Show success state
      setSaved(true);
      setTimeout(() => {
        setOpen(false);
        setSaved(false);
        setTitle('');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving transcript:', error);
      alert(`Failed to save transcript: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const canSave = translations.length > 0;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled || !canSave}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Save className="h-4 w-4" />
        Save Transcript
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Transcript</DialogTitle>
            <DialogDescription>
              Give your transcript a name so you can find it later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Meeting with Team, Interview Notes..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !saving) {
                    handleSave();
                  }
                }}
                disabled={saving}
                autoFocus
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>{translations.length} translated lines</p>
              <p>{source.length} source lines</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

