import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/components/AppProvider';
import { AppShell } from '@/components/AppShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'Trust & Peace workspaces',
  description: 'Deep Work Workspace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="flex min-h-screen bg-background text-on-background font-body-md" suppressHydrationWarning>
        <AppProvider>
          <AppShell>
            {children}
          </AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
