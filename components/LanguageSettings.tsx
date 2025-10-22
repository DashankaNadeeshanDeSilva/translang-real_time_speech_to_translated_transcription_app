'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Globe, BookOpen, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Language Settings Component
 * 
 * Improved UI with three collapsible sections:
 * 1. Source Languages - Select dropdown for language selection
 * 2. Vocabulary & Context Hints - Textarea for custom vocabulary
 * 3. Chat Behavior - Settings for grouping window and smooth scroll
 * 
 * Uses Shadcn UI components for a modern, clean interface
 */

interface LanguageSettingsProps {
  sourceLanguage: string;
  setSourceLanguage: (lang: string) => void;
  vocabularyContext: string;
  setVocabularyContext: (context: string) => void;
  isRecording: boolean;
  vadEnabled: boolean;
  toggleVAD: () => void;
  silenceThreshold: number;
  setSilenceThreshold: (threshold: number) => void;
  sentenceMode: boolean;
  setSentenceMode: (enabled: boolean) => void;
  sentenceHoldMs: number;
  setSentenceHoldMs: (ms: number) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'auto', name: 'Auto-Detect', flag: '🌐' },
];

export function LanguageSettings({
  sourceLanguage,
  setSourceLanguage,
  vocabularyContext,
  setVocabularyContext,
  isRecording,
  vadEnabled,
  toggleVAD,
  silenceThreshold,
  setSilenceThreshold,
  sentenceMode,
  setSentenceMode,
  sentenceHoldMs,
  setSentenceHoldMs,
}: LanguageSettingsProps) {
  const [groupingWindow, setGroupingWindow] = useState(4000);
  const [smoothScroll, setSmoothScroll] = useState(true);

  const selectedLanguage = SUPPORTED_LANGUAGES.find(l => l.code === sourceLanguage);

  const handleGroupingWindowChange = (value: number[]) => {
    const newValue = value[0];
    setGroupingWindow(newValue);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chat:setGroupingWindow', { detail: newValue }));
    }
  };

  const handleSmoothScrollChange = (checked: boolean) => {
    setSmoothScroll(checked);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chat:setSmooth', { detail: checked }));
    }
  };

  return (
    <div className="w-full mb-6">
      <Accordion type="multiple" defaultValue={['source-languages']} className="w-full">
        {/* Section 1: Source Languages */}
        <div className="mb-[1cm] last:mb-0">
          <AccordionItem value="source-languages" className="border rounded-lg px-4 bg-white dark:bg-slate-800 shadow-sm relative">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="font-semibold">Source Languages</span>
              {selectedLanguage && (
                <span className="ml-2 text-sm text-muted-foreground">
                  ({selectedLanguage.flag} {selectedLanguage.name})
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <div className="space-y-4 pt-2">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="source-language" className="text-sm font-medium">
                    Source Language
                  </Label>
                  <Select
                    value={sourceLanguage}
                    onValueChange={setSourceLanguage}
                    disabled={isRecording}
                  >
                    <SelectTrigger 
                      id="source-language" 
                      className="w-full h-10"
                    >
                      <SelectValue>
                        {selectedLanguage ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{selectedLanguage.flag}</span>
                            <span className="font-medium">{selectedLanguage.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Select a language...</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{lang.flag}</span>
                            <span>{lang.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed flex items-center gap-1.5">
                  {sourceLanguage === 'auto' ? (
                    <>
                      <AlertCircle className="h-3 w-3" />
                      Language will be automatically detected from speech
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Optimized for {selectedLanguage?.name} speech recognition
                    </>
                  )}
                </p>
              </div>

              {isRecording && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-xs text-amber-900">
                    ⚠️ Language settings locked during recording. Stop to change.
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
          </AccordionItem>
        </div>

        {/* Section 2: Chat Behavior */}
        <div className="mb-[1cm] last:mb-0">
          <AccordionItem value="chat-behavior" className="border rounded-lg px-4 bg-white dark:bg-slate-800 shadow-sm relative">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-semibold">Chat Behavior</span>
              <span className="ml-2 text-xs text-muted-foreground">
                ({(groupingWindow / 1000).toFixed(1)}s)
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <div className="space-y-4 pt-2">
              {/* Message Grouping Window */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Message Grouping Window</Label>
                  <span className="text-sm text-muted-foreground">{(groupingWindow / 1000).toFixed(1)}s</span>
                </div>
                <Slider value={[groupingWindow]} onValueChange={handleGroupingWindowChange} min={1000} max={8000} step={500} disabled={isRecording} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1.0s</span>
                  <span>8.0s</span>
                </div>
              </div>

              {/* Smooth Auto-Scroll */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smooth-scroll" className="text-sm font-medium">Smooth Auto-Scroll</Label>
                  <p className="text-xs text-muted-foreground">Auto-scroll when new messages arrive</p>
                </div>
                <Switch id="smooth-scroll" checked={smoothScroll} onCheckedChange={handleSmoothScrollChange} disabled={isRecording} />
              </div>

              {/* Voice Activity Detection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="vad-toggle" className="text-sm font-medium">Voice Activity Detection</Label>
                    <p className="text-xs text-muted-foreground">Auto-finalize during pauses</p>
                  </div>
                  <Switch id="vad-toggle" checked={vadEnabled} onCheckedChange={toggleVAD} disabled={isRecording} />
                </div>
                {vadEnabled && (
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Silence Threshold</Label>
                      <span className="text-sm text-muted-foreground">{silenceThreshold}ms</span>
                    </div>
                    <Slider value={[silenceThreshold]} onValueChange={(val) => setSilenceThreshold(val[0])} min={300} max={2000} step={100} disabled={isRecording} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>300ms</span>
                      <span>2000ms</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sentence Mode */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sentence-mode" className="text-sm font-medium">Sentence Mode</Label>
                    <p className="text-xs text-muted-foreground">Stitch complete sentences</p>
                  </div>
                  <Switch id="sentence-mode" checked={sentenceMode} onCheckedChange={setSentenceMode} disabled={isRecording} />
                </div>
                {sentenceMode && (
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Sentence Hold Time</Label>
                      <span className="text-sm text-muted-foreground">{sentenceHoldMs}ms</span>
                    </div>
                    <Slider value={[sentenceHoldMs]} onValueChange={(val) => setSentenceHoldMs(val[0])} min={300} max={900} step={50} disabled={isRecording} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>300ms</span>
                      <span>900ms</span>
                    </div>
                  </div>
                )}
              </div>

              {isRecording && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-xs text-amber-900">⚠️ Settings locked during recording</p>
                </div>
              )}
            </div>
          </AccordionContent>
          </AccordionItem>
        </div>

        {/* Section 3: Vocabulary & Context Hints */}
        <div className="mb-[1cm] last:mb-0">
          <AccordionItem value="vocabulary" className="border rounded-lg px-4 bg-white dark:bg-slate-800 shadow-sm relative">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="font-semibold">Vocabulary & Context Hints</span>
              {vocabularyContext && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Active</span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="vocabulary-hints" className="text-sm font-medium">Custom Vocabulary</Label>
                <Textarea
                  id="vocabulary-hints"
                  value={vocabularyContext}
                  onChange={(e) => setVocabularyContext(e.target.value)}
                  disabled={isRecording}
                  placeholder="Enter names, technical terms, acronyms&#10;Example: Dr. Müller, Kubernetes, API"
                  className="min-h-[100px] resize-y"
                />
              </div>
              <p className="text-xs text-muted-foreground">Add custom terms to improve recognition accuracy</p>
              {isRecording && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-900" />
                  <p className="text-xs text-amber-900">Settings locked during recording</p>
                </div>
              )}
            </div>
          </AccordionContent>
          </AccordionItem>
        </div>
      </Accordion>
    </div>
  );
}
