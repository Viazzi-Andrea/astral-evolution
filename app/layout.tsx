import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AnimatedBackground } from '@/components/ui/animated-background';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Astral Evolution | Astrología Evolutiva Personalizada',
  description: 'Descubre tu camino evolutivo con auditorías astrales personalizadas. Cálculos astronómicos precisos de tu carta natal, tránsitos y sinastría de parejas.',
  openGraph: {
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
          <AnimatedBackground />
          <div className="relative z-10">
            <Header />
            <main className="pt-16">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
