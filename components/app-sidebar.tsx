'use client';

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Languages,
  Sun,
  Download,
} from 'lucide-react';
import { useTheme } from './theme-provider';
import { LanguageSettings } from './LanguageSettings';
import { ExportButtonGroup } from './ExportButtonGroup';
import { TranscriptLine } from '@/hooks/useTranslator';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
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
  translations: TranscriptLine[];
  source: TranscriptLine[];
  showSource: boolean;
  hasSessionEnded: boolean;
}

export function AppSidebar({
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
  translations,
  source,
  showSource,
  hasSessionEnded,
  ...props
}: AppSidebarProps) {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Languages className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-base">TransLang</span>
            <span className="text-xs text-muted-foreground">Real-time Translation</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-4">
        <LanguageSettings
          sourceLanguage={sourceLanguage}
          setSourceLanguage={setSourceLanguage}
          vocabularyContext={vocabularyContext}
          setVocabularyContext={setVocabularyContext}
          isRecording={isRecording}
          vadEnabled={vadEnabled}
          toggleVAD={toggleVAD}
          silenceThreshold={silenceThreshold}
          setSilenceThreshold={setSilenceThreshold}
          sentenceMode={sentenceMode}
          setSentenceMode={setSentenceMode}
          sentenceHoldMs={sentenceHoldMs}
          setSentenceHoldMs={setSentenceHoldMs}
        />

        <Separator className="my-4" />

        {/* Export & Share Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-sm font-semibold">
            <Download className="h-4 w-4" />
            Export & Share
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <ExportButtonGroup
              translations={translations}
              source={source}
              includeSource={showSource}
              isRecording={isRecording}
              hasSessionEnded={hasSessionEnded}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <Label htmlFor="theme-toggle" className="text-sm cursor-pointer">
              Dark Mode
            </Label>
          </div>
          <Switch
            id="theme-toggle"
            checked={isDarkMode}
            onCheckedChange={handleThemeToggle}
          />
        </div>
        <div className="mt-2 text-center text-xs text-muted-foreground">
          v1.0.0
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
