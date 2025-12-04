'use client';

import { useState } from 'react';
import { TranslatorControls } from '@/components/TranslatorControls';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useTranslator } from '@/hooks/useTranslator';

export default function Home() {
  const [hasSessionEnded, setHasSessionEnded] = useState(false);

  const {
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
    committedTranslation,
    committedSource,
    showSource,
  } = useTranslator();

  return (
    <SidebarProvider>
      <AppSidebar
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
        translations={committedTranslation}
        source={committedSource}
        showSource={showSource}
        hasSessionEnded={hasSessionEnded}
      />
      <SidebarInset>
        <header className="bg-white dark:bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-6 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Real-Time Translation</h1>
        </header>
        <main className="flex flex-1 flex-col p-6 bg-white dark:bg-background h-[calc(100vh-4rem)]">
          <TranslatorControls onSessionEnd={setHasSessionEnded} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

