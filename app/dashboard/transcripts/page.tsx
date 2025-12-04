'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { Loader2, FileText, Trash2, Eye, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Transcript {
  id: string;
  title: string | null;
  source_language: string;
  duration_ms: number;
  created_at: string;
  translations: any[];
  source: any[];
}

export default function TranscriptsPage() {
  const { user, isLoading: authLoading } = useUser();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadTranscripts();
    }
  }, [authLoading, user]);

  const loadTranscripts = async () => {
    try {
      const response = await fetch('/api/transcripts');
      if (!response.ok) throw new Error('Failed to load transcripts');
      
      const data = await response.json();
      setTranscripts(data.transcripts || []);
    } catch (error) {
      console.error('Error loading transcripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/transcripts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete transcript');

      // Remove from list
      setTranscripts(prev => prev.filter(t => t.id !== id));
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting transcript:', error);
      alert('Failed to delete transcript');
    } finally {
      setDeleting(false);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Transcripts</h1>
        <p className="text-muted-foreground">
          View and manage your saved translation sessions
        </p>
      </div>

      {transcripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No transcripts yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start a translation session and save it to see it here
          </p>
          <Button asChild>
            <Link href="/dashboard">Start Translating</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {transcripts.map((transcript) => (
            <div
              key={transcript.id}
              className="flex items-center justify-between p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {transcript.title || 'Untitled Transcript'}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(transcript.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDuration(transcript.duration_ms)}
                  </span>
                  <span>
                    {transcript.translations.length} translations
                  </span>
                  <span className="uppercase text-xs font-medium">
                    {transcript.source_language} → en
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/transcripts/${transcript.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(transcript.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transcript?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the transcript.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleting}
              variant="destructive"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

