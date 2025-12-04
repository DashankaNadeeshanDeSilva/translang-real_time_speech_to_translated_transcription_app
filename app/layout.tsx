import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Auth0Provider } from '@auth0/nextjs-auth0';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'TransLang - Real-Time Speech Translation',
  description: 'Real-time speech to translated transcription powered by Soniox AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <Auth0Provider>
            <ThemeProvider defaultTheme="system" storageKey="translang-theme">
              {children}
            </ThemeProvider>
          </Auth0Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
