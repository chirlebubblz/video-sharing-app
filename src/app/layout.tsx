import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DefinitelyNotLoom | Totally Not Loom... But Not Really',
  description: 'Record screen, camera, and mixed audio with real-time chunk streaming and AI video intelligence.',
  icons: {
    icon: '/icon.svg?v=3',
    shortcut: '/icon.svg?v=3',
    apple: '/icon.svg?v=3',
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
        <link rel="icon" href="/icon.svg?v=3" type="image/svg+xml" />
        <link rel="shortcut icon" href="/icon.svg?v=3" />
        <link rel="apple-touch-icon" href="/icon.svg?v=3" />
      </head>
      <body className="bg-black text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
