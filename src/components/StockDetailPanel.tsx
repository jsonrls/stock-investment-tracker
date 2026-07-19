'use client';

import { useState, useEffect } from 'react';
import { api, Stock } from '@/lib/api';
import { StockChart } from './StockChart';
import { PriceChange, PriceDisplay } from './ui/PriceDisplay';
import { StockLogo } from './ui/StockLogo';
import { usePortfolio } from '@/context/PortfolioContext';
import { X, Star, PlusCircle, Clock, Check } from 'lucide-react';

interface StockDetailPanelProps {
  symbol: string;
  name: string;
  onClose: () => void;
  onAddToPortfolio?: (stock: Stock) => void;
}

export function StockDetailPanel({ symbol, name, onClose, onAddToPortfolio }: StockDetailPanelProps) {
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const { holdings, addToWatchlist, removeFromWatchlist, isInWatchlist } = usePortfolio();
  const inWl = isInWatchlist(symbol);
  const isHeld = holdings.some(h => h.symbol === symbol);

  useEffect(() => {
    setLoading(true);
    api.getStock(symbol)
      .then(setStock)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [symbol]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="card slide-in detail-panel" style={{
        width: '100%', maxWidth: 800, height: '85vh', maxHeight: 720,
        display: 'flex', flexDirection: 'column',
        borderRadius: '20px 20px 0 0',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <StockLogo symbol={symbol} size={44} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--tp)' }}>{symbol}</h2>
                {!loading && stock && <PriceChange value={stock.percent_change} />}
              </div>
              <div style={{ fontSize: 12, color: 'var(--tm)', marginTop: 2 }}>{name}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => inWl ? removeFromWatchlist(symbol) : addToWatchlist(symbol)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                background: inWl ? 'rgba(245,197,24,0.12)' : 'var(--surface2)',
                border: `1px solid ${inWl ? 'rgba(245,197,24,0.35)' : 'var(--border)'}`,
                color: inWl ? 'var(--gold)' : 'var(--ts)',
              }}
            >
              <Star size={13} fill={inWl ? 'currentColor' : 'none'} />
              {inWl ? 'Watching' : 'Watch'}
            </button>
            {stock && (
              <button onClick={() => onAddToPortfolio?.(stock)} className={isHeld ? "btn-s" : "btn-p"}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '7px 12px',
                  fontSize: 12,
                  borderColor: isHeld ? 'var(--green)' : undefined,
                  color: isHeld ? 'var(--green)' : undefined,
                  cursor: 'pointer'
                }}>
                {isHeld ? <Check size={13} /> : <PlusCircle size={13} />}
                {isHeld ? 'Added' : 'Add'}
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '7px', borderRadius: 8, color: 'var(--tm)' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '12px 22px', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', gap: 20 }}>
              {[120, 70, 50].map((w, i) => <span key={i} className="skel" style={{ display: 'block', height: 20, width: w }} />)}
            </div>
          ) : stock ? (
            <>
              <div>
                <div style={{ fontSize: 11, color: 'var(--tm)', marginBottom: 3 }}>Last Price</div>
                <PriceDisplay price={stock.price} style={{ fontSize: 22, fontWeight: 800, color: 'var(--tp)' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--tm)', marginBottom: 3 }}>Volume</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts)' }}>{stock.volume.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--tm)', marginBottom: 3 }}>Currency</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts)' }}>{stock.currency}</div>
              </div>
              {stock.as_of && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
                  <Clock size={11} style={{ color: 'var(--tm)' }} />
                  <span style={{ fontSize: 11, color: 'var(--tm)' }}>
                    {new Date(stock.as_of).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Chart */}
        <div style={{ flex: 1, minHeight: 0, padding: '16px 20px 20px' }}>
          <StockChart symbol={symbol} currentPrice={stock?.price} />
        </div>
      </div>
    </div>
  );
}
