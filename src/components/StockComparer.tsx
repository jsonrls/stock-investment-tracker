'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { api, Stock, Candle } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeftRight, TrendingUp, BarChart2, Calendar, AlertCircle } from 'lucide-react';

interface ComparerStats {
  returnPct: number;
  avgVolume: number;
  volatility: number; // std dev of returns
  maxPrice: number;
  minPrice: number;
}

export function StockComparer() {
  const [stockA, setStockA] = useState<Stock | null>(null);
  const [stockB, setStockB] = useState<Stock | null>(null);

  const [candlesA, setCandlesA] = useState<Candle[]>([]);
  const [candlesB, setCandlesB] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prefill default comparison (e.g. ALI vs SM)
  useEffect(() => {
    const init = async () => {
      try {
        const [a, b] = await Promise.all([
          api.getStock('ALI'),
          api.getStock('SM')
        ]);
        setStockA(a);
        setStockB(b);
      } catch (e) {}
    };
    init();
  }, []);

  // Fetch 1-year daily candles for selected stocks
  useEffect(() => {
    if (!stockA || !stockB) return;

    const fetchHistories = async () => {
      setLoading(true);
      setError('');
      try {
        const to = new Date();
        const from = new Date();
        from.setFullYear(to.getFullYear() - 1); // 1 year history

        const fromStr = from.toISOString().split('T')[0];
        const toStr = to.toISOString().split('T')[0];

        const [resA, resB] = await Promise.all([
          api.getCandles(stockA.symbol, { period: 'd', from: fromStr, to: toStr }),
          api.getCandles(stockB.symbol, { period: 'd', from: fromStr, to: toStr })
        ]);

        if (resA && resA.data && resB && resB.data) {
          // Sort chronologically
          const sortedA = [...resA.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          const sortedB = [...resB.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setCandlesA(sortedA);
          setCandlesB(sortedB);
        } else {
          setError('Failed to load historical data for one of the stocks.');
        }
      } catch (e) {
        console.error(e);
        setError('Error fetching historical candles for comparison.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistories();
  }, [stockA, stockB]);

  // Compute comparison stats
  const stats = useMemo(() => {
    const calculateStats = (candles: Candle[]): ComparerStats | null => {
      if (candles.length === 0) return null;

      const firstClose = candles[0].close;
      const lastClose = candles[candles.length - 1].close;
      const returnPct = ((lastClose - firstClose) / firstClose) * 100;

      const volumes = candles.map(c => c.volume);
      const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;

      const prices = candles.map(c => c.close);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);

      // Compute simple daily volatility (std dev of daily returns)
      const dailyReturns: number[] = [];
      for (let i = 1; i < candles.length; i++) {
        const prev = candles[i - 1].close;
        const curr = candles[i].close;
        if (prev > 0) {
          dailyReturns.push((curr - prev) / prev);
        }
      }
      const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / dailyReturns.length;
      const volatility = Math.sqrt(variance) * 100 * Math.sqrt(252); // Annualized volatility %

      return { returnPct, avgVolume, volatility, maxPrice, minPrice };
    };

    return {
      a: calculateStats(candlesA),
      b: calculateStats(candlesB)
    };
  }, [candlesA, candlesB]);

  // Generate normalized chart data (Base 100)
  const chartData = useMemo(() => {
    if (candlesA.length === 0 || candlesB.length === 0) return [];

    // Align dates
    const dateMapB = new Map<string, number>();
    candlesB.forEach(c => {
      const dateOnly = c.date.split('T')[0];
      dateMapB.set(dateOnly, c.close);
    });

    const firstA = candlesA[0].close;
    let firstB = candlesB[0]?.close || 1;

    const points: any[] = [];
    candlesA.forEach(cA => {
      const dateStr = cA.date.split('T')[0];
      const closeB = dateMapB.get(dateStr);
      if (closeB !== undefined) {
        const normA = (cA.close / firstA) * 100;
        const normB = (closeB / firstB) * 100;
        points.push({
          date: new Date(cA.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          [stockA?.symbol || 'A']: parseFloat(normA.toFixed(2)),
          [stockB?.symbol || 'B']: parseFloat(normB.toFixed(2))
        });
      }
    });

    return points;
  }, [candlesA, candlesB, stockA, stockB]);

  const formatCurrency = (n: number) => {
    return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatVolume = (v: number) => {
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
    return v.toFixed(0);
  };

  return (
    <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, pointerEvents: 'auto' }}>
      
      {/* ══════════ STOCK SELECTORS ══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'center' }}>
        {/* Selector Stock A */}
        <div className="card panel-card" style={{ padding: '16px 20px', borderLeft: '3px solid #3b82f6' }}>
          <label style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            STOCK A (Base Line)
          </label>
          <SearchBar onSelectStock={setStockA} placeholder="Select Stock A..." />
          {stockA && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: '#3b82f6' }}>{stockA.symbol}</span>
              <span style={{ color: 'var(--ts)' }}>₱{formatCurrency(stockA.price)}</span>
            </div>
          )}
        </div>

        {/* VS Arrow Divider */}
        <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--tm)' }}>
          <ArrowLeftRight size={24} />
        </div>

        {/* Selector Stock B */}
        <div className="card panel-card" style={{ padding: '16px 20px', borderLeft: '3px solid #f59e0b' }}>
          <label style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            STOCK B (Comparison Line)
          </label>
          <SearchBar onSelectStock={setStockB} placeholder="Select Stock B..." />
          {stockB && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: '#f59e0b' }}>{stockB.symbol}</span>
              <span style={{ color: 'var(--ts)' }}>₱{formatCurrency(stockB.price)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ COMPARISON GRID ══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        
        {/* Left Side: Side-by-Side Metrics Table */}
        <div className="card panel-card editorial-panel" style={{ padding: '20px 22px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tp)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={16} style={{ color: 'var(--accent)' }} /> Side-by-Side Analytics
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 8, fontSize: 12, color: 'var(--ts)' }}>
            <div style={{ fontWeight: 700, color: 'var(--tm)' }}>Metric (LTM)</div>
            <div style={{ fontWeight: 700, color: '#3b82f6', textAlign: 'right' }}>{stockA?.symbol || 'Stock A'}</div>
            <div style={{ fontWeight: 700, color: '#f59e0b', textAlign: 'right' }}>{stockB?.symbol || 'Stock B'}</div>

            {/* Price */}
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0' }}>Current Price</div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0', textAlign: 'right', fontWeight: 650, color: 'var(--tp)' }}>
              ₱{stockA ? formatCurrency(stockA.price) : '—'}
            </div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0', textAlign: 'right', fontWeight: 650, color: 'var(--tp)' }}>
              ₱{stockB ? formatCurrency(stockB.price) : '—'}
            </div>

            {/* Day Change */}
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0' }}>Day Change (%)</div>
            <div style={{ 
              borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0', textAlign: 'right', fontWeight: 650,
              color: (stockA?.percent_change ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'
            }}>
              {stockA ? `${stockA.percent_change >= 0 ? '+' : ''}${stockA.percent_change.toFixed(2)}%` : '—'}
            </div>
            <div style={{ 
              borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0', textAlign: 'right', fontWeight: 650,
              color: (stockB?.percent_change ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'
            }}>
              {stockB ? `${stockB.percent_change >= 0 ? '+' : ''}${stockB.percent_change.toFixed(2)}%` : '—'}
            </div>

            {/* 1 Year Return */}
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0' }}>1-Year Quote Return</div>
            <div style={{ 
              borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0', textAlign: 'right', fontWeight: 650,
              color: (stats.a?.returnPct ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'
            }}>
              {stats.a ? `${stats.a.returnPct >= 0 ? '+' : ''}${stats.a.returnPct.toFixed(2)}%` : '—'}
            </div>
            <div style={{ 
              borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0', textAlign: 'right', fontWeight: 650,
              color: (stats.b?.returnPct ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'
            }}>
              {stats.b ? `${stats.b.returnPct >= 0 ? '+' : ''}${stats.b.returnPct.toFixed(2)}%` : '—'}
            </div>

            {/* Average Volume */}
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0' }}>Average Daily Vol.</div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0', textAlign: 'right', color: 'var(--tp)' }}>
              {stats.a ? formatVolume(stats.a.avgVolume) : '—'}
            </div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0', textAlign: 'right', color: 'var(--tp)' }}>
              {stats.b ? formatVolume(stats.b.avgVolume) : '—'}
            </div>

            {/* Volatility */}
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0' }}>Annualized Volatility</div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0', textAlign: 'right', color: 'var(--tp)' }}>
              {stats.a ? `${stats.a.volatility.toFixed(2)}%` : '—'}
            </div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '8px 0', textAlign: 'right', color: 'var(--tp)' }}>
              {stats.b ? `${stats.b.volatility.toFixed(2)}%` : '—'}
            </div>

            {/* 52w Range */}
            <div style={{ padding: '8px 0' }}>1-Year price Range</div>
            <div style={{ padding: '8px 0', textAlign: 'right', fontSize: 10, color: 'var(--tp)', lineHeight: 1.3 }}>
              {stats.a ? (
                <>
                  <span>Hi: ₱{formatCurrency(stats.a.maxPrice)}</span>
                  <br />
                  <span>Lo: ₱{formatCurrency(stats.a.minPrice)}</span>
                </>
              ) : '—'}
            </div>
            <div style={{ padding: '8px 0', textAlign: 'right', fontSize: 10, color: 'var(--tp)', lineHeight: 1.3 }}>
              {stats.b ? (
                <>
                  <span>Hi: ₱{formatCurrency(stats.b.maxPrice)}</span>
                  <br />
                  <span>Lo: ₱{formatCurrency(stats.b.minPrice)}</span>
                </>
              ) : '—'}
            </div>
          </div>
        </div>

        {/* Right Side: Normalized Overlay Price Performance Chart */}
        <div className="card panel-card" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontSize: 12, fontWeight: 750, color: 'var(--tp)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={14} style={{ color: 'var(--accent)' }} /> Normalized Quote Growth (Base 100)
          </h3>

          {loading ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--tm)' }}>
              <div style={{ width: 14, height: 14, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: 8 }} />
              Comparing price logs…
            </div>
          ) : error ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--red)', textAlign: 'center' }}>
              <AlertCircle size={14} style={{ marginRight: 6 }} /> {error}
            </div>
          ) : chartData.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--tm)' }}>
              Select Stock A and Stock B to map comparative trends
            </div>
          ) : (
            <div style={{ height: 220, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,239,231,0.04)" />
                  <XAxis dataKey="date" stroke="var(--tm)" fontSize={9} tickLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="var(--tm)" fontSize={9} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }}
                    labelStyle={{ fontWeight: 700, color: 'var(--tp)' }}
                    formatter={(v: any, name?: any) => [`${v}%`, name]}
                  />
                  <Line
                    type="monotone"
                    dataKey={stockA?.symbol || 'A'}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={stockB?.symbol || 'B'}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--ts)', justifyContent: 'center', marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 3, background: '#3b82f6' }} />
              <span>{stockA?.symbol || 'Stock A'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 3, background: '#f59e0b' }} />
              <span>{stockB?.symbol || 'Stock B'}</span>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
