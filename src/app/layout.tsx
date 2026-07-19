import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PortfolioProvider } from '@/context/PortfolioContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PSE Portfolio Tracker | Philippine Stock Exchange Dashboard',
  description:
    'Track your Philippine Stock Exchange (PSE) investments in real time. View portfolio performance, historical charts, market movers, and manage your watchlist.',
  keywords: 'PSE, Philippine Stock Exchange, stock portfolio, investment tracker, market data',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-theme="dark">
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            localStorage.removeItem('portfolio_holdings');
            localStorage.removeItem('portfolio_watchlist');
          } catch(e) {}
        `}} />
        <ThemeProvider>
          <AuthProvider>
            <PortfolioProvider>{children}</PortfolioProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
