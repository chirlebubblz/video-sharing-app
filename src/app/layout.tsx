import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DefinitelyNotLoom | Totally Not Loom... But Not Really',
  description: 'Record screen, camera, and mixed audio with real-time chunk streaming and AI video intelligence.',
  icons: {
    icon: '/icon.svg?v=2',
    shortcut: '/favicon.ico?v=2',
    apple: '/icon.svg?v=2',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/icon.svg?v=2" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/icon.svg?v=2" />
      </head>
      <body className="bg-[#0b0f17] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
