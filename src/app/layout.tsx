import type { Metadata, Viewport } from 'next';
import { Inter, Doto } from 'next/font/google';
import { Toaster } from 'sonner';
import { SessionProvider } from '@/components/providers/SessionProvider';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const doto = Doto({
  variable: '--font-doto',
  subsets: ['latin'],
  weight: '500',
});

export const metadata: Metadata = {
  title: 'Social Bro - Content Discovery Platform',
  description: 'Discover and explore content across YouTube, TikTok, Instagram, and more',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-black">
      <body className={`${inter.variable} ${doto.variable} antialiased bg-black min-h-screen`}>
        <SessionProvider>{children}</SessionProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '13px',
              backdropFilter: 'blur(8px)',
            },
          }}
        />
      </body>
    </html>
  );
}
