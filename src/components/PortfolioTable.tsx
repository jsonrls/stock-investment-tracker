'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePortfolio, PortfolioHolding } from '@/context/PortfolioContext';
import { api, Stock } from '@/lib/api';
import { PriceChange, PriceDisplay } from './ui/PriceDisplay';
import { TableRowSkeleton } from './ui/Skeleton';
import { StockLogo } from './ui/StockLogo';
import { Trash2, BarChart2, RefreshCw, Share2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ShareHoldingModal } from './ShareHoldingModal';

interface Enriched extends PortfolioHolding {
  currentPrice?: number;
  percentChange?: number;
  marketValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

const COLORS: Record<string, string> = {
  Cash: 'var(--green)',
  Stock: 'var(--accent)',
  REIT: '#ff9f43',
  ETF: '#a55eea',
  Other: '#747d8c'
};

export function PortfolioTable({ 
  onSelectStock,
  onStatsChange 
}: { 
  onSelectStock?: (symbol: string, name: string) => void;
  onStatsChange?: (stats: {
    totalCost: number;
    cashVal: number;
    initialInvestment: number;
    overallPortVal: number;
    overallGL: number;
    overallGLP: number;
    holdingsCount: number;
  }) => void;
}) {
  const { holdings, removeHolding, initialInvestment, updateInitialInvestment } = usePortfolio();
  const [enriched, setEnriched]     = useState<Enriched[]>([]);
  const [loading, setLoading]       = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [tempCapital, setTempCapital] = useState('');
  const [selectedShareHolding, setSelectedShareHolding] = useState<Enriched | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrices = useCallback(async () => {
    if (holdings.length === 0) { setEnriched([]); setLoading(false); return; }
    try {
      const pseSymbols = holdings.filter(h => !h.isCustom).map(h => h.symbol);
      const map: Record<string, Stock> = {};
      if (pseSymbols.length > 0) {
        const res = await api.pollQuotes(pseSymbols);
        res.stocks.forEach(s => { map[s.symbol] = s; });
      }

      setEnriched(holdings.map(h => {
        let cur = h.avgPrice;
        let pctChange = 0;

        if (!h.isCustom && map[h.symbol]) {
          const s = map[h.symbol];
          cur = s.price;
          pctChange = s.percent_change;
        }

        const mv = cur * h.shares;
        const cb = h.avgPrice * h.shares;
        const gl = mv - cb;
        const glp = cb > 0 ? (gl / cb) * 100 : 0;

        return {
          ...h,
          currentPrice: cur,
          percentChange: !h.isCustom ? pctChange : undefined,
          marketValue: mv,
          gainLoss: gl,
          gainLossPercent: glp
        };
      }));
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Error fetching prices in PortfolioTable:', e);
    } finally {
      setLoading(false);
    }
  }, [holdings]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPrices();
    interval.current = setInterval(fetchPrices, 60_000);
    return () => { if (interval.current) clearInterval(interval.current); };
  }, [fetchPrices]);

  const totalVal  = enriched.reduce((s, h) => s + (h.marketValue ?? 0), 0);
  const totalCost = enriched.reduce((s, h) => s + h.avgPrice * h.shares, 0);
  const holdingsGL = totalVal - totalCost;
  const holdingsGLP = totalCost > 0 ? (holdingsGL / totalCost) * 100 : 0;

  // Capital & Cash calculations
  const cashVal = Math.max(0, initialInvestment - totalCost);
  const overallPortVal = totalVal + cashVal;
  const overallGL = overallPortVal - initialInvestment;
  const overallGLP = initialInvestment > 0 ? (overallGL / initialInvestment) * 100 : 0;

  useEffect(() => {
    if (onStatsChange && !loading) {
      onStatsChange({
        totalCost,
        cashVal,
        initialInvestment,
        overallPortVal,
        overallGL,
        overallGLP,
        holdingsCount: holdings.length
      });
    }
  }, [totalCost, cashVal, initialInvestment, overallPortVal, overallGL, overallGLP, holdings.length, loading, onStatsChange]);

  const handleSaveCapital = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempCapital);
    if (!isNaN(val) && val >= 0) {
      updateInitialInvestment(val);
    }
    setIsEditingCapital(false);
  };

  const fmt = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

  // Pie chart data preparation
  const valuesByCategory: Record<string, number> = {
    Cash: cashVal,
    Stock: 0,
    REIT: 0,
    ETF: 0,
    Other: 0
  };

  enriched.forEach(h => {
    const cat = h.category || 'Stock';
    if (valuesByCategory[cat] !== undefined) {
      valuesByCategory[cat] += h.marketValue ?? 0;
    } else {
      valuesByCategory['Other'] += h.marketValue ?? 0;
    }
  });

  const chartData = Object.entries(valuesByCategory)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      
      {/* Top Section Layout: Stats (Left) + Allocation Chart (Right) */}
      <div style={{ display: 'flex', gap: 16, flexDirection: 'row', flexWrap: 'wrap' }}>
        
        {/* Left: 4 stat cards */}
        <div style={{ flex: '1 1 500px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {/* Card 1: Initial Investment (Editable) */}
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => { if (!isEditingCapital) { setTempCapital(String(initialInvestment)); setIsEditingCapital(true); } }}>
            <div style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              Initial Investment
            </div>
            {isEditingCapital ? (
              <form onSubmit={handleSaveCapital} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }} onClick={e => e.stopPropagation()}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={tempCapital}
                  onChange={e => setTempCapital(e.target.value)}
                  className="field"
                  style={{ padding: '4px 8px', fontSize: 13, width: '100%', height: 28, background: 'var(--surface2)', color: 'var(--tp)' }}
                  autoFocus
                  onBlur={() => setTimeout(() => setIsEditingCapital(false), 200)}
                />
                <button type="submit" className="btn-p" style={{ padding: '0 8px', fontSize: 11, height: 28 }}>Save</button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--tp)' }}>₱{fmt(initialInvestment)}</div>
                <span title="Edit Initial Investment" style={{ fontSize: 11, color: 'var(--accent)' }}>✏️</span>
              </div>
            )}
            <div style={{ fontSize: 10, color: 'var(--tm)', marginTop: 4 }}>Capital Funded</div>
          </div>

          {/* Card 2: Portfolio Value */}
          <div className="stat-card">
            <div style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              Total Portfolio Value
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--tp)' }}>₱{fmt(overallPortVal)}</div>
            <div style={{ fontSize: 10, color: 'var(--tm)', marginTop: 4 }}>Stocks Value: ₱{fmt(totalVal)}</div>
          </div>

          {/* Card 3: Overall Gain / Loss */}
          <div className="stat-card">
            <div style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              Net Profit / Loss
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: overallGL >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {overallGL >= 0 ? '+' : ''}₱{fmt(Math.abs(overallGL))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--tm)', marginTop: 4 }}>Holdings G/L: {holdingsGL >= 0 ? '+' : ''}₱{fmt(Math.abs(holdingsGL))}</div>
          </div>

          {/* Card 4: Overall Return */}
          <div className="stat-card">
            <div style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              Net Portfolio Return
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: overallGLP >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {overallGLP >= 0 ? '+' : ''}{overallGLP.toFixed(2)}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--tm)', marginTop: 4 }}>Holdings Return: {holdingsGLP >= 0 ? '+' : ''}{holdingsGLP.toFixed(2)}%</div>
          </div>
        </div>

        {/* Right: Pie Chart Card */}
        <div
          className="card"
          style={{
            flex: '1 1 320px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            pointerEvents: 'none'
          }}
        >
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--tp)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
            Asset Allocation
          </h3>
          
          {chartData.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, color: 'var(--tm)', fontSize: 12 }}>
              Add holdings or fund capital to view allocation
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ height: 160, width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#747d8c'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text showing total value */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 9, color: 'var(--tm)', textTransform: 'uppercase', fontWeight: 600 }}>Total</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--tp)', marginTop: 1 }}>₱{fmt(overallPortVal).split('.')[0]}</div>
                </div>
              </div>

              {/* Custom Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                {chartData.map(d => {
                  const pct = overallPortVal > 0 ? (d.value / overallPortVal) * 100 : 0;
                  return (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[d.name] }} />
                        <span style={{ fontWeight: 600, color: 'var(--tp)' }}>{d.name}</span>
                      </div>
                      <div style={{ color: 'var(--tm)' }}>
                        <span style={{ color: 'var(--tp)', fontWeight: 700, marginRight: 4 }}>₱{fmt(d.value)}</span>
                        ({pct.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
      </div>

      {/* Refresh row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--tm)' }}>
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Fetching prices…'}
        </span>
        <button onClick={fetchPrices} className="btn-s" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 12px' }}>
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl" style={{ minWidth: 800 }}>
          <thead>
            <tr>
              <th>Symbol</th>
              <th className="right">Shares</th>
              <th className="right">Avg Price</th>
              <th className="right">Current</th>
              <th className="right">Day %</th>
              <th className="right">Mkt Value</th>
              <th className="right">Gain/Loss</th>
              <th className="right">Return</th>
              <th className="center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: Math.max(holdings.length, 3) }).map((_, i) => <TableRowSkeleton key={i} cols={9} />)
              : enriched.map(h => (
                <tr key={h.symbol}>
                  <td style={{ maxWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      {!h.isCustom && h.category !== 'Cash' && <StockLogo symbol={h.symbol} size={28} />}
                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--tp)' }}>{h.symbol}</div>
                          <span style={{ 
                            fontSize: 9, 
                            padding: '1px 5px', 
                            borderRadius: 6, 
                            background: h.category === 'Cash' ? 'rgba(0,214,122,0.12)' : h.category === 'REIT' ? 'rgba(255,165,0,0.12)' : h.category === 'ETF' ? 'rgba(99,129,255,0.12)' : 'var(--surface3)', 
                            color: h.category === 'Cash' ? 'var(--green)' : h.category === 'REIT' ? 'orange' : h.category === 'ETF' ? 'var(--accent)' : 'var(--ts)', 
                            fontWeight: 700, 
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            {h.category}
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: 11, 
                          color: 'var(--tm)', 
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {h.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="right" style={{ color: 'var(--ts)' }}>{h.shares.toLocaleString()}</td>
                  <td className="right" style={{ color: 'var(--ts)' }}>₱{h.avgPrice.toFixed(2)}</td>
                  <td className="right">
                    {h.currentPrice !== undefined
                      ? <PriceDisplay price={h.currentPrice} style={{ fontWeight: 600, color: 'var(--tp)' }} />
                      : <span style={{ color: 'var(--tm)' }}>—</span>}
                  </td>
                  <td className="right">
                    {h.percentChange !== undefined ? <PriceChange value={h.percentChange} size="sm" /> : '—'}
                  </td>
                  <td className="right" style={{ fontWeight: 600, color: 'var(--tp)' }}>
                    {h.marketValue !== undefined ? `₱${fmt(h.marketValue)}` : '—'}
                  </td>
                  <td className="right" style={{ fontWeight: 600, color: h.gainLoss !== undefined ? (h.gainLoss >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--tm)' }}>
                    {h.gainLoss !== undefined ? `${h.gainLoss >= 0 ? '+' : ''}₱${fmt(Math.abs(h.gainLoss))}` : '—'}
                  </td>
                  <td className="right">
                    {h.gainLossPercent !== undefined ? <PriceChange value={h.gainLossPercent} size="sm" showIcon={false} /> : '—'}
                  </td>
                  <td className="center">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      {!h.isCustom && (
                        <button onClick={() => onSelectStock?.(h.symbol, h.name)} title="View Chart"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: 7, color: 'var(--accent)', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,129,255,0.12)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                          <BarChart2 size={14} />
                        </button>
                      )}
                      <button onClick={() => setSelectedShareHolding(h)} title="Share Holding"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: 7, color: 'var(--green)', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,214,122,0.12)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <Share2 size={14} />
                      </button>
                      <button onClick={() => removeHolding(h.symbol)} title="Remove"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: 7, color: 'var(--red)', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,71,87,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!loading && enriched.length === 0 && (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
            <div style={{ fontWeight: 600, color: 'var(--ts)', marginBottom: 4 }}>No holdings yet</div>
            <div style={{ fontSize: 12, color: 'var(--tm)' }}>Search for a stock and add it to your portfolio to view metrics</div>
          </div>
        )}
      </div>
      {selectedShareHolding && (
        <ShareHoldingModal holding={selectedShareHolding} onClose={() => setSelectedShareHolding(null)} />
      )}
    </div>
  );
}
