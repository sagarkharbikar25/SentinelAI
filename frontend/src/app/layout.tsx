import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { DaemonProvider } from '@/context/DaemonContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NavigationProvider } from '@/context/NavigationContext';
import GlobalPromptListener from '@/components/GlobalPromptListener';

export const metadata: Metadata = {
  title: 'SentinelAI — AI Agent Security & Governance Platform',
  description: 'Security & Governance Dashboard for Monitoring, Auditing, and Securing AI Agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var p = new URLSearchParams(window.location.search).get('theme');
                var theme = (p === 'dark' || p === 'light') ? p : (localStorage.getItem('sentinel_theme') || 'light');
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'dark') document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-canvas text-ink-1 min-h-dvh flex font-sans antialiased selection:bg-brand-soft selection:text-brand-ink overflow-hidden">
        <ThemeProvider>
          <DaemonProvider>
            <NavigationProvider>
              <div className="flex w-full h-dvh overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden">
                  <Navbar />
                  <main className="flex-1 overflow-y-auto p-6 bg-canvas">
                    {children}
                  </main>
                </div>
              </div>
              <GlobalPromptListener />
            </NavigationProvider>
          </DaemonProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
