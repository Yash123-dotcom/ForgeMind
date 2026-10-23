import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'ForgeMind — Understand your Unity project. Solve problems smarter.',
    template: '%s | ForgeMind',
  },
  description:
    'AI-powered diagnostics for Unity developers. Investigate errors with project-aware debugging, deterministic rules, and evidence-backed reports.',
  applicationName: 'ForgeMind',
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-brand/20 selection:text-foreground">
        {children}
      </body>
    </html>
  );
}