import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { DaemonProvider } from '@/context/DaemonContext';

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
    <html lang="en" className="dark">
      <body className="bg-canvas text-text-primary min-h-dvh flex font-sans antialiased selection:bg-accent/20 selection:text-white overflow-hidden">
        <DaemonProvider>
          <div className="flex w-full h-dvh overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden">
              <Navbar />
              <main className="flex-1 overflow-y-auto p-6 bg-canvas">
                {children}
              </main>
            </div>
          </div>
        </DaemonProvider>
      </body>
    </html>
  );
}
