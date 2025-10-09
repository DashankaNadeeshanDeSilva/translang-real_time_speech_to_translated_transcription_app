import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

