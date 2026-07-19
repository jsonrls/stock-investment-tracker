'use client';

import { useState, useCallback } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { PortfolioTable } from '@/components/PortfolioTable';
import { MarketMovers } from '@/components/MarketMovers';
import { StocksTable } from '@/components/StocksTable';
import { Watchlist } from '@/components/Watchlist';
import { StockDetailPanel } from '@/components/StockDetailPanel';
import { AddHoldingModal } from '@/components/AddHoldingModal';
import { ShareHoldingModal } from '@/components/ShareHoldingModal';
import { MarketSummary } from '@/components/MarketSummary';
import { AuthModal } from '@/components/AuthModal';
import { UserDropdown } from '@/components/UserDropdown';
import { useAuth } from '@/context/AuthContext';
import { Stock } from '@/lib/api';
import {
  LayoutDashboard, BarChart2, Star, TrendingUp,
  ChevronRight, Search, X, LogIn, Share2,
} from 'lucide-react';

type Tab = 'dashboard' | 'market' | 'portfolio' | 'watchlist';

const NAV_TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'market',    label: 'Market',    icon: <TrendingUp    size={18} /> },
  { key: 'portfolio', label: 'Portfolio', icon: <BarChart2     size={18} /> },
  { key: 'watchlist', label: 'Watchlist', icon: <Star          size={18} /> },
];



interface OverallStats {
  holdingsCount: number;
  totalCost: number;
  cashVal: number;
  initialInvestment: number;
  overallGL: number;
  overallGLP: number;
}

export default function Home() {
  const { user }                  = useAuth();
  const [tab, setTab]             = useState<Tab>('dashboard');
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; name: string } | null>(null);
  const [addStock, setAddStock]   = useState<Stock | null>(null);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [showOverallShare, setShowOverallShare] = useState(false);

  const handleSelectStock    = useCallback((symbol: string, name: string) => setSelectedStock({ symbol, name }), []);
  const handleSelectStockObj = useCallback((stock: Stock) => setSelectedStock({ symbol: stock.symbol, name: stock.name }), []);
  const handleAddToPortfolio = useCallback((stock: Stock) => { setAddStock(stock); setSelectedStock(null); }, []);
  const handleSearchSelect   = useCallback((stock: Stock) => { handleSelectStockObj(stock); setMobileSearch(false); }, [handleSelectStockObj]);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', transition: 'background 0.3s' }}>

      {/* ── Ambient blobs ── */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,129,255,0.07) 0%, transparent 70%)', transition: 'opacity 0.3s' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,214,122,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* ══════════ HEADER ══════════ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--header-bg)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--border)', transition: 'background 0.3s' }}>
        <div className="header-inner" style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16, height: 64 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6381ff, #4f6bff)', boxShadow: '0 0 18px rgba(99,129,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              📈
            </div>
            <div className="logo-text">
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tp)', lineHeight: 1.2, whiteSpace: 'nowrap', transition: 'color 0.3s' }}>PSE Portfolio</div>
              <div style={{ fontSize: 11, color: 'var(--tm)', lineHeight: 1.2, transition: 'color 0.3s' }}>Philippine Stock Exchange</div>
            </div>
          </div>

          {/* Desktop search */}
          <div className="header-search-full" style={{ flex: 1, maxWidth: 440 }}>
            <SearchBar onSelectStock={handleSelectStockObj} placeholder="Search PSE stocks…" />
          </div>

          {/* Mobile search icon */}
          <button
            className="header-search-icon"
            onClick={() => setMobileSearch(true)}
            style={{ display: 'none', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: 'var(--ts)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Search size={17} />
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Auth Button */}
          {user ? (
            <UserDropdown />
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="btn-p" style={{ padding: '7px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, cursor: 'pointer' }}>
              <LogIn size={12} /> <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* ══════════ TOP TAB NAV (desktop + tablet) ══════════ */}
      <nav className="top-tab-nav" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 64, zIndex: 40, overflowX: 'auto', transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex' }}>
          {NAV_TABS.map(t => (
            <button key={t.key} className={`ntab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
              {t.icon}<span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="main-content" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div className="main-wrap" style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 40px' }}>

          {/* ━━━━━━ DASHBOARD ━━━━━━ */}
          {tab === 'dashboard' && (
            <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Live Market Summary */}
              <MarketSummary />

              {/* Movers + Watchlist */}
              <div className="dash-movers-row" style={{ display: 'grid', gap: 16 }}>
                <div className="card panel-card" style={{ padding: '20px 22px', minHeight: 380 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tp)' }}>Market Movers</h2>
                    <button onClick={() => setTab('market')} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      View All <ChevronRight size={13} />
                    </button>
                  </div>
                  <MarketMovers onSelectStock={s => handleSelectStock(s.symbol, s.name)} />
                </div>
                <div className="card panel-card" style={{ padding: '20px 22px', minHeight: 300 }}>
                  <Watchlist onSelectStock={handleSelectStock} />
                </div>
              </div>
            </div>
          )}

          {/* ━━━━━━ MARKET ━━━━━━ */}
          {tab === 'market' && (
            <div className="market-layout slide-in" style={{ display: 'grid', gap: 16 }}>
              <div className="card panel-card" style={{ padding: '20px 22px', minHeight: 520 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tp)', marginBottom: 16 }}>All PSE Stocks</h2>
                <StocksTable onSelectStock={handleSelectStockObj} onAddToPortfolio={handleAddToPortfolio} />
              </div>
              <div className="card panel-card" style={{ padding: '20px 22px', minHeight: 360 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tp)', marginBottom: 16 }}>Market Movers</h2>
                <MarketMovers onSelectStock={s => handleSelectStock(s.symbol, s.name)} />
              </div>
            </div>
          )}

          {/* ━━━━━━ PORTFOLIO ━━━━━━ */}
          {tab === 'portfolio' && (
            <div className="card panel-card slide-in" style={{ padding: '20px 22px', minHeight: 520 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tp)' }}>My Portfolio</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {overallStats && (
                    <button
                      onClick={() => setShowOverallShare(true)}
                      title="Share Portfolio PNL"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 8,
                        color: 'var(--green)', transition: 'background 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,214,122,0.12)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <Share2 size={14} />
                    </button>
                  )}
                  <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, background: 'rgba(99,129,255,0.12)', color: 'var(--accent)', border: '1px solid rgba(99,129,255,0.28)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    PSE Holdings
                  </span>
                </div>
              </div>
              <PortfolioTable onSelectStock={handleSelectStock} onStatsChange={setOverallStats} />
            </div>
          )}

          {/* ━━━━━━ WATCHLIST ━━━━━━ */}
          {tab === 'watchlist' && (
            <div className="watchlist-layout slide-in" style={{ display: 'grid', gap: 16 }}>
              <div className="card panel-card" style={{ padding: '20px 22px', minHeight: 400 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tp)', marginBottom: 16 }}>Browse & Add Stocks</h2>
                <StocksTable onSelectStock={handleSelectStockObj} onAddToPortfolio={handleAddToPortfolio} />
              </div>
              <div className="card panel-card" style={{ padding: '20px 22px' }}>
                <Watchlist onSelectStock={handleSelectStock} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '12px 24px', textAlign: 'center', position: 'relative', zIndex: 1, transition: 'border-color 0.3s' }}>
        <p style={{ fontSize: 11, color: 'var(--tm)' }}>
          Data sourced from Phisix · Quotes are delayed/end-of-day · Not investment advice
        </p>
      </footer>

      {/* ══════════ MOBILE BOTTOM NAV ══════════ */}
      <nav className="bottom-nav">
        {NAV_TABS.map(t => (
          <button key={t.key} className={`bnav-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* ══════════ MOBILE SEARCH OVERLAY ══════════ */}
      {mobileSearch && (
        <div className="mobile-search-overlay" onClick={e => e.target === e.currentTarget && setMobileSearch(false)}>
          <div className="mobile-search-box">
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <SearchBar onSelectStock={handleSearchSelect} placeholder="Search PSE stocks…" />
              </div>
              <button onClick={() => setMobileSearch(false)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 12px', cursor: 'pointer', color: 'var(--ts)', display: 'flex', alignItems: 'center' }}>
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ OVERLAYS ══════════ */}
      {selectedStock && (
        <StockDetailPanel
          symbol={selectedStock.symbol}
          name={selectedStock.name}
          onClose={() => setSelectedStock(null)}
          onAddToPortfolio={handleAddToPortfolio}
        />
      )}
      {addStock && (
        <AddHoldingModal stock={addStock} onClose={() => setAddStock(null)} />
      )}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
      {showOverallShare && overallStats && (
        <ShareHoldingModal
          holding={{
            symbol: 'PORTFOLIO',
            name: 'Overall Portfolio Summary',
            shares: overallStats.holdingsCount,
            avgPrice: overallStats.totalCost,
            currentPrice: overallStats.cashVal,
            marketValue: overallStats.initialInvestment,
            gainLoss: overallStats.overallGL,
            gainLossPercent: overallStats.overallGLP,
            category: 'Summary'
          }}
          onClose={() => setShowOverallShare(false)}
        />
      )}
    </div>
  );
}
