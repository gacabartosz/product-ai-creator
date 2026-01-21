import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Product Creator - AI E-commerce Content',
  description: 'AI-powered product creation - mats, fences, mattresses, beds',
  keywords: ['AI', 'e-commerce', 'PrestaShop', 'maty wiklinowe', 'ploty', 'materace', 'lozka'],
  openGraph: {
    title: 'Product Creator - AI E-commerce Content',
    description: 'Automatyczne tworzenie opisow produktow - maty wiklinowe, ploty, materace, lozka. AI generuje opisy.',
    url: 'https://bartoszgaca.pl/product-ai-creator',
    siteName: 'Product Creator',
    locale: 'pl_PL',
    type: 'website',
    images: [
      {
        url: 'https://bartoszgaca.pl/product-ai-creator/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Product Creator - AI dla produktow',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Product Creator',
    description: 'AI dla produktow - maty, ploty, materace',
    images: ['https://bartoszgaca.pl/product-ai-creator/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            },
            className: 'crystal-toast',
          }}
        />
      </body>
    </html>
  );
}
