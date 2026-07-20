import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PortfolioProvider } from '@/context/PortfolioContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { DividendProvider } from '@/context/DividendContext';
import { TransactionProvider } from '@/context/TransactionContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Trackfolio | Philippine Stock Exchange Dashboard',
  description:
    'Track your Philippine Stock Exchange (PSE) investments in real time. View portfolio performance, historical charts, market movers, and manage your watchlist.',
  keywords: 'PSE, Philippine Stock Exchange, stock portfolio, investment tracker, market data',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            window.addEventListener('unhandledrejection',function(e){
              var r=e.reason;
              if(!r){e.preventDefault();return}
              if(typeof r==='object'){
                if(r.code===4001||r.code==='4001'){e.preventDefault();return}
                var m=r.message;
                if(typeof m==='string'){
                  var l=m.toLowerCase();
                  if(l.indexOf('user rejected')!==-1||l.indexOf('user denied')!==-1||l.indexOf('user cancel')!==-1||l.indexOf('rejected the request')!==-1){e.preventDefault();return}
                }
                if(r.stack&&typeof r.stack==='string'&&(r.stack.indexOf('chrome-extension://')!==-1||r.stack.indexOf('moz-extension://')!==-1)){e.preventDefault();return}
                try{if(Object.keys(r).length===0){e.preventDefault();return}}catch(x){}
              }
            });
          })();
        `}} />
      </head>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            localStorage.removeItem('portfolio_holdings');
            localStorage.removeItem('portfolio_watchlist');
          } catch(e) {}
        `}} />
        <ThemeProvider>
          <AuthProvider>
            <PortfolioProvider>
              <DividendProvider>
                <TransactionProvider>{children}</TransactionProvider>
              </DividendProvider>
            </PortfolioProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
