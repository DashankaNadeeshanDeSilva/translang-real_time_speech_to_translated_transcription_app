import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'TransLang - Real-Time Speech Translation',
  description: 'Real-time German to English speech translation powered by Soniox',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="translang-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

