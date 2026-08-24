import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DefinitelyNotLoom | Totally Not Loom... But Not Really',
  description: 'Record screen, camera, and mixed audio with real-time chunk streaming and AI video intelligence.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className="bg-[#0b0f17] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
