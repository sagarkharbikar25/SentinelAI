import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

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
      <body className="bg-[#0A0E17] text-[#DFE2F0] min-h-screen flex flex-col font-sans antialiased selection:bg-[#93CCFF]/20 selection:text-white">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 overflow-y-auto bg-[#0F131D]/80">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
