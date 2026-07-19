'use client';

import { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Stock } from '@/lib/api';
import { X, PlusCircle } from 'lucide-react';

interface AddHoldingModalProps {
  stock: Stock;
  onClose: () => void;
}

export function AddHoldingModal({ stock, onClose }: AddHoldingModalProps) {
  const { addHolding } = usePortfolio();
  const [shares, setShares]     = useState('');
  
  const detectCategory = (sym: string): string => {
    const s = sym.toUpperCase();
    if (s === 'FMETF') return 'ETF';
    if (s.endsWith('RT') || s.includes('REIT')) return 'REIT';
    return 'Stock';
  };

  const initialCategory = detectCategory(stock.symbol);
  const [category, setCategory] = useState(initialCategory);
  const [avgPrice, setAvgPrice] = useState(stock.price.toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sh = parseFloat(shares);
    const pr = parseFloat(avgPrice);
    if (isNaN(sh) || sh <= 0 || isNaN(pr) || pr <= 0) return;

    addHolding({ 
      symbol: stock.symbol, 
      name: stock.name, 
      shares: sh, 
      avgPrice: pr, 
      category, 
      isCustom: false 
    });
    onClose();
  };

  const totalCost = parseFloat(shares || '0') * parseFloat(avgPrice || '0');
  const currentVal = parseFloat(shares || '0') * stock.price;
  const fmt = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="card slide-in modal-card" style={{ width: '100%', maxWidth: 420, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tp)' }}>Add to Portfolio</h2>
            <p style={{ fontSize: 12, color: 'var(--tm)', marginTop: 3 }}>
              {stock.symbol} — {stock.name}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tm)', padding: 4, borderRadius: 8 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="field"
              style={{ padding: '10px 13px', fontSize: 14, background: 'var(--surface2)', color: 'var(--tp)', width: '100%' }}
              required
            >
              <option value="Stock">Stock / Equities</option>
              <option value="REIT">REIT (Real Estate)</option>
              <option value="ETF">ETF (Exchange Traded Fund)</option>
              <option value="Other">Other / Alternative</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
              Number of Shares
            </label>
            <input type="number" min="1" step="1" value={shares} onChange={e => setShares(e.target.value)}
              placeholder="e.g. 100" className="field" style={{ padding: '10px 13px', fontSize: 14 }} required autoFocus />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
              Average Buy Price (PHP)
            </label>
            <input type="number" min="0.01" step="0.01" value={avgPrice} onChange={e => setAvgPrice(e.target.value)}
              placeholder="e.g. 120.00" className="field" style={{ padding: '10px 13px', fontSize: 14 }} required />
          </div>

          {totalCost > 0 && (
            <div style={{ background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--tm)' }}>Total Cost</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tp)' }}>₱{fmt(totalCost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--tm)' }}>Current Value</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>₱{fmt(currentVal)}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-s" style={{ flex: 1, padding: '11px 0', fontSize: 13 }}>Cancel</button>
            <button type="submit" className="btn-p" style={{ flex: 1, padding: '11px 0', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <PlusCircle size={15} /> Add Holding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
