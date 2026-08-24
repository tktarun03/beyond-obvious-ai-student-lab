import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SkipLink } from '@lab/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beyond the Obvious — AI Student Lab',
  description:
    'Five practical AI engineering starter projects: architecture, evaluation, security and accessibility included.',
};

/**
 * Fonts are loaded with a stylesheet link rather than next/font.
 *
 * WHY: next/font downloads the files at BUILD time, which means a student on a
 * train, or a CI runner with no egress, cannot build the repo. A link degrades
 * to the system fallback stack instead of failing. For a real deployment,
 * switch to next/font — it removes the extra round trip and the third-party
 * request, and the design system says so. This is a documented trade, not an
 * oversight.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;1,6..72,300&family=Archivo:wght@400;500;600&family=Azeret+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="deck">
        <SkipLink targetId="main" />
        {children}
      </body>
    </html>
  );
}
