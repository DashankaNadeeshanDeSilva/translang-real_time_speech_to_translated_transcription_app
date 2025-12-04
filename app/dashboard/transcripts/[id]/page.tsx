'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Download, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { exportAsText, exportAsJSON } from '@/utils/exportUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TranscriptLine {
  id: string;
  text: string;
  timestamp: number;
  speaker?: string;
}

interface Transcript {
  id: string;
  title: string | null;
  source_language: string;
  duration_ms: number;
  created_at: string;
  translations: TranscriptLine[];
  source: TranscriptLine[];
}

export default function ViewTranscriptPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    if (!authLoading && user && params.id) {
      loadTranscript();
    }
  }, [authLoading, user, params.id]);

  const loadTranscript = async () => {
    try {
      const response = await fetch(`/api/transcripts/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/dashboard/transcripts');
          return;
        }
        throw new Error('Failed to load transcript');
      }
      
      const data = await response.json();
      setTranscript(data.transcript);
    } catch (error) {
      console.error('Error loading transcript:', error);
      router.push('/dashboard/transcripts');
    } finally {
      setLoading(false);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = (format: 'text' | 'json') => {
    if (!transcript) return;

    const title = transcript.title || 'Untitled Transcript';
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}`;
    
    if (format === 'json') {
      const jsonContent = exportAsJSON(transcript.translations, showSource ? transcript.source : undefined);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const textContent = exportAsText(transcript.translations, showSource ? transcript.source : undefined);
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!transcript) {
    return null;
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/transcripts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transcripts
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {transcript.title || 'Untitled Transcript'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(transcript.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(transcript.duration_ms)}
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
              onClick={() => setShowSource(!showSource)}
            >
              {showSource ? 'Hide' : 'Show'} Source
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('text')}>
                  Export as Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Transcript Content */}
      <div className="space-y-4">
        {transcript.translations.map((line) => (
          <div key={line.id} className="space-y-2">
            {/* Translation */}
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <div className="flex items-start justify-between gap-4">
                <p className="text-lg flex-1">{line.text}</p>
                {line.speaker && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200">
                    Speaker {line.speaker}
                  </span>
                )}
              </div>
            </div>

            {/* Source (if enabled) */}
            {showSource && transcript.source[transcript.translations.indexOf(line)] && (
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  {transcript.source[transcript.translations.indexOf(line)].text}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {transcript.translations.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>No translations in this transcript</p>
        </div>
      )}
    </div>
  );
}

