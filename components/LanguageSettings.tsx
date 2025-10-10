'use client';

import { useState } from 'react';

/**
 * Language Settings Component
 * 
 * Allows users to configure source language and provide vocabulary hints.
 * 
 * Phase 6 Implementation
 */

interface LanguageSettingsProps {
  sourceLanguage: string;
  setSourceLanguage: (lang: string) => void;
  vocabularyContext: string;
  setVocabularyContext: (context: string) => void;
  isRecording: boolean;
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
}: LanguageSettingsProps) {
  const [showVocabularyInput, setShowVocabularyInput] = useState(false);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.title}>🌍 Language & Context Settings</h4>
      </div>

      <div style={styles.content}>
        {/* Source Language Selection */}
        <div style={styles.setting}>
          <label style={styles.label}>Source Language</label>
          <div style={styles.languageGrid}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSourceLanguage(lang.code)}
                disabled={isRecording}
                style={{
                  ...styles.languageButton,
                  ...(sourceLanguage === lang.code ? styles.languageButtonActive : {}),
                }}
              >
                <span style={styles.flag}>{lang.flag}</span>
                <span style={styles.langName}>{lang.name}</span>
              </button>
            ))}
          </div>
          <p style={styles.helpText}>
            {sourceLanguage === 'auto' 
              ? 'Language will be automatically detected'
              : `Optimized for ${SUPPORTED_LANGUAGES.find(l => l.code === sourceLanguage)?.name || 'selected language'}`
            }
          </p>
        </div>

        {/* Vocabulary/Context Hints */}
        <div style={styles.setting}>
          <div style={styles.settingHeader}>
            <label style={styles.label}>Vocabulary & Context Hints</label>
            <button
              onClick={() => setShowVocabularyInput(!showVocabularyInput)}
              style={styles.toggleLink}
              disabled={isRecording}
            >
              {showVocabularyInput ? '▼ Hide' : '▶ Show'}
            </button>
          </div>
          
          {showVocabularyInput && (
            <>
              <textarea
                value={vocabularyContext}
                onChange={(e) => setVocabularyContext(e.target.value)}
                disabled={isRecording}
                placeholder="Enter names, technical terms, acronyms, or context&#10;Example: Dr. Müller, Kubernetes, API, machine learning&#10;Separate with commas or new lines"
                style={styles.textarea}
                rows={4}
              />
              <p style={styles.helpText}>
                💡 Add custom vocabulary to improve accuracy for specific terms, names, or technical jargon.
              </p>
            </>
          )}
        </div>

        {/* Status */}
        {isRecording && (
          <div style={styles.warningBox}>
            <p style={styles.warningText}>
              ⚠️ Language settings locked during recording. Stop to change.
            </p>
          </div>
        )}
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
    marginBottom: '1rem',
  },
  header: {
    padding: '0.75rem 1rem',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    margin: 0,
  },
  content: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  setting: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  settingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1f2937',
  },
  languageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '0.5rem',
  },
  languageButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 0.875rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '0.8125rem',
    fontWeight: '500',
  },
  languageButtonActive: {
    backgroundColor: '#eff6ff',
    border: '2px solid #3b82f6',
    color: '#1e40af',
    fontWeight: '600',
  },
  flag: {
    fontSize: '1.125rem',
  },
  langName: {
    flex: 1,
    textAlign: 'left' as const,
  },
  toggleLink: {
    fontSize: '0.75rem',
    color: '#3b82f6',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    fontWeight: '500',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.8125rem',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    resize: 'vertical' as const,
    minHeight: '80px',
  },
  helpText: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: '0.25rem 0 0 0',
    lineHeight: '1.5',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fde047',
    borderRadius: '0.375rem',
    padding: '0.75rem',
  },
  warningText: {
    fontSize: '0.75rem',
    color: '#92400e',
    margin: 0,
    fontWeight: '500',
  },
};

