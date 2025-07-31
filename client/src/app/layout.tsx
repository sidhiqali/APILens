import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/Providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'APILens - API Monitoring & Change Detection',
  description:
    'Advanced API monitoring, change detection, and documentation platform',
  keywords:
    'API monitoring, change detection, API documentation, OpenAPI, REST API',
  authors: [{ name: 'APILens Team' }],
  openGraph: {
    title: 'APILens - API Monitoring & Change Detection',
    description:
      'Advanced API monitoring, change detection, and documentation platform',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'APILens - API Monitoring & Change Detection',
    description:
      'Advanced API monitoring, change detection, and documentation platform',
  },
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900 antialiased`}
      >
        <Providers>
          <main className="min-h-full">{children}</main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
