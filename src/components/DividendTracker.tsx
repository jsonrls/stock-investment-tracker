'use client';

import React, { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { useDividends, DividendRecord } from '@/context/DividendContext';
import { useAuth } from '@/context/AuthContext';
import { LoginBlock } from './LoginBlock';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, Trash2, Calendar, Coins, Percent, Landmark, BarChart2 } from 'lucide-react';

export function DividendTracker({ onSignInClick }: { onSignInClick?: () => void }) {
  const { user } = useAuth();
  const { holdings } = usePortfolio();
  const { dividends, addDividend, removeDividend } = useDividends();

  // Form State
  const [symbol, setSymbol] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [sharesStr, setSharesStr] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'Cash' | 'Stock'>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is not logged in, require log in to sync database
  if (!user) {
    return (
      <LoginBlock
        title="Unlock your Dividend Tracker"
        description="Sign in to record dividend payments, calculate your portfolio's Yield on Cost, and view visual dividend income projections."
        features={[
          "Log cash and stock dividends",
          "Yield on Cost (YoC) tracker",
          "Dividend passive income growth charts"
        ]}
        noCard={true}
        onSignInClick={onSignInClick}
      />
    );
  }

  // Pre-fill shares owned when stock selection changes
  const handleSymbolChange = (sym: string) => {
    setSymbol(sym);
    const holding = holdings.find(h => h.symbol === sym);
    if (holding) {
      setSharesStr(holding.shares.toString());
    } else {
      setSharesStr('');
    }
  };

  const handleAddDividend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !amountStr || !sharesStr || !dateStr) return;
    setIsSubmitting(true);

    try {
      await addDividend({
        symbol: symbol.toUpperCase(),
        amountPerShare: parseFloat(amountStr),
        sharesOwned: parseInt(sharesStr, 10),
        paymentDate: dateStr,
        type
      });
      // Reset form (except date)
      setSymbol('');
      setAmountStr('');
      setSharesStr('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const formatCurrency = (n: number) => {
    return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Total Portfolio Cost Basis
  const totalCost = holdings.reduce((sum, h) => sum + h.avgPrice * h.shares, 0);

  // Dividends aggregations
  const totalDividends = dividends.reduce((sum, d) => sum + d.totalAmount, 0);
  
  // Last 12 months dividends
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const lastYearDividends = dividends.filter(d => new Date(d.paymentDate) >= oneYearAgo);
  const lastYearTotal = lastYearDividends.reduce((sum, d) => sum + d.totalAmount, 0);

  // Yield on Cost (YoC)
  const yieldOnCost = totalCost > 0 ? (lastYearTotal / totalCost) * 100 : 0;

  // Chart Data: Group dividends by month/year
  const monthlyData = (() => {
    const map: Record<string, number> = {};
    dividends.forEach(d => {
      const date = new Date(d.paymentDate);
      if (isNaN(date.getTime())) return;
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); // e.g. "Oct 25"
      map[key] = (map[key] || 0) + d.totalAmount;
    });

    // Sort chronologically
    return Object.entries(map)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => {
        const dateA = new Date('01 ' + a.month);
        const dateB = new Date('01 ' + b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-12); // Limit to last 12 active months
  })();

  // Group dividends by stock
  const stockDividends = (() => {
    const map: Record<string, number> = {};
    dividends.forEach(d => {
      map[d.symbol] = (map[d.symbol] || 0) + d.totalAmount;
    });
    return Object.entries(map)
      .map(([stock, total]) => ({ stock, total }))
      .sort((a, b) => b.total - a.total);
  })();

  return (
    <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, pointerEvents: 'auto' }}>
      
      {/* ══════════ KPI METRICS SECTION ══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Card 1: Cumulative Payouts */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--surface2) 0%, rgba(199,242,87,0.02) 100%)' }}>
          <div style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Total Dividends Earned
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>
            ₱{formatCurrency(totalDividends)}
          </div>
          <div style={{ fontSize: 9, color: 'var(--tm)', marginTop: 4 }}>All-time passive payouts</div>
        </div>

        {/* Card 2: LTM Dividends */}
        <div className="stat-card">
          <div style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            LTM Dividend Income
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tp)' }}>
            ₱{formatCurrency(lastYearTotal)}
          </div>
          <div style={{ fontSize: 9, color: 'var(--tm)', marginTop: 4 }}>Last 12 months total</div>
        </div>

        {/* Card 3: Yield on Cost */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--surface2) 0%, rgba(215,255,100,0.03) 100%)' }}>
          <div style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Yield on Cost (YoC)
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>
            {yieldOnCost.toFixed(2)}%
          </div>
          <div style={{ fontSize: 9, color: 'var(--tm)', marginTop: 4 }}>Based on holdings cost basis</div>
        </div>

        {/* Card 4: Dividend Count */}
        <div className="stat-card">
          <div style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Payout Occurrences
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tp)' }}>
            {dividends.length}
          </div>
          <div style={{ fontSize: 9, color: 'var(--tm)', marginTop: 4 }}>Recorded ledger entries</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        
        {/* ━━━━━━━━ LEFT: ADD DIVIDEND FORM ━━━━━━━━ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card panel-card editorial-panel" style={{ padding: '20px 22px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tp)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} style={{ color: 'var(--accent)' }} /> Record Dividend Payout
            </h2>

            <form onSubmit={handleAddDividend} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Select Holding */}
              <div>
                <label htmlFor="divSymbol" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Select Stock from Portfolio
                </label>
                <select
                  id="divSymbol"
                  value={symbol}
                  onChange={e => handleSymbolChange(e.target.value)}
                  className="field"
                  style={{ padding: '8px 12px', fontSize: 13, height: 38, background: 'var(--surface2)', color: 'var(--tp)' }}
                  required
                >
                  <option value="">-- Choose Stock --</option>
                  {holdings.map(h => (
                    <option key={h.symbol} value={h.symbol}>
                      {h.symbol} - {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type, Amount, and Shares Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12 }}>
                <div>
                  <label htmlFor="divType" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                    Dividend Type
                  </label>
                  <select
                    id="divType"
                    value={type}
                    onChange={e => setType(e.target.value as 'Cash' | 'Stock')}
                    className="field"
                    style={{ padding: '8px 12px', fontSize: 13, height: 38, background: 'var(--surface2)', color: 'var(--tp)' }}
                  >
                    <option value="Cash">Cash (₱)</option>
                    <option value="Stock">Stock (Shares)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="divAmount" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                    Rate per Share
                  </label>
                  <input
                    id="divAmount"
                    type="number"
                    step="any"
                    min="0.0001"
                    value={amountStr}
                    onChange={e => setAmountStr(e.target.value)}
                    className="field"
                    style={{ padding: '8px 12px', fontSize: 13 }}
                    placeholder="₱0.00 / Share"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12 }}>
                <div>
                  <label htmlFor="divShares" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                    Shares Owned
                  </label>
                  <input
                    id="divShares"
                    type="number"
                    min="1"
                    value={sharesStr}
                    onChange={e => setSharesStr(e.target.value)}
                    className="field"
                    style={{ padding: '8px 12px', fontSize: 13 }}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="divDate" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                    Payment Date
                  </label>
                  <input
                    id="divDate"
                    type="date"
                    value={dateStr}
                    onChange={e => setDateStr(e.target.value)}
                    className="field"
                    style={{ padding: '8px 12px', fontSize: 13, height: 38, background: 'var(--surface2)', color: 'var(--tp)' }}
                    required
                  />
                </div>
              </div>

              {/* Total payout preview */}
              {amountStr && sharesStr && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, color: 'var(--ts)' }}>
                  <span>Calculated Payout:</span>
                  <strong style={{ color: 'var(--green)' }}>
                    ₱{formatCurrency(parseFloat(amountStr) * parseInt(sharesStr, 10))}
                  </strong>
                </div>
              )}

              <button
                type="submit"
                className="btn-p"
                style={{ padding: '10px 0', fontSize: 12, marginTop: 4 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Recording...' : 'Add Payout Entry'}
              </button>
            </form>
          </div>
        </div>

        {/* ━━━━━━━━ RIGHT: CHARTS & TOP PERFORMERS ━━━━━━━━ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Dividend Payout Chart */}
          <div className="card panel-card" style={{ padding: '20px 22px' }}>
            <h3 style={{ fontSize: 12, fontWeight: 750, color: 'var(--tp)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart2 size={14} style={{ color: 'var(--accent)' }} /> Monthly Dividend Distribution
            </h3>

            {monthlyData.length === 0 ? (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--tm)' }}>
                Record dividends on the left to display passive income distribution
              </div>
            ) : (
              <div style={{ height: 180, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,239,231,0.04)" />
                    <XAxis dataKey="month" stroke="var(--tm)" fontSize={9} tickLine={false} />
                    <YAxis stroke="var(--tm)" fontSize={9} tickLine={false} tickFormatter={v => `₱${v}`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }}
                      labelStyle={{ fontWeight: 700, color: 'var(--tp)' }}
                      formatter={(v: any) => [`₱${parseFloat(v).toLocaleString()}`, 'Amount'] }
                    />
                    <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
                      {monthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="var(--green)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top Dividend Stocks list */}
          <div className="card panel-card" style={{ padding: '16px 20px' }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--tp)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Landmark size={13} style={{ color: 'var(--accent)' }} /> Top Paying Securities
            </h3>

            {stockDividends.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--tm)' }}>
                No stock dividend allocations recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stockDividends.slice(0, 4).map((item, idx) => {
                  const pct = totalDividends > 0 ? (item.total / totalDividends) * 100 : 0;
                  return (
                    <div key={item.stock} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, width: 16, height: 16, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--ts)' }}>
                          {idx + 1}
                        </span>
                        <strong style={{ color: 'var(--tp)' }}>{item.stock}</strong>
                      </div>
                      <div style={{ color: 'var(--ts)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--tp)', marginRight: 4 }}>₱{formatCurrency(item.total)}</span>
                        ({pct.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ══════════ DIVIDEND HISTORY LEDGER TABLE ══════════ */}
      <div className="card panel-card editorial-panel" style={{ padding: '20px 22px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tp)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} style={{ color: 'var(--accent)' }} /> Dividend History Ledger
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Type</th>
                <th className="right">Shares Owned</th>
                <th className="right">Payout Rate</th>
                <th className="right">Total Amount</th>
                <th>Payment Date</th>
                <th className="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dividends.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 700, color: 'var(--tp)' }}>{d.symbol}</td>
                  <td>
                    <span style={{
                      fontSize: 9,
                      padding: '1px 5px',
                      borderRadius: 6,
                      background: d.type === 'Cash' ? 'rgba(0,214,122,0.12)' : 'rgba(255,165,0,0.12)',
                      color: d.type === 'Cash' ? 'var(--green)' : 'orange',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {d.type}
                    </span>
                  </td>
                  <td className="right" style={{ color: 'var(--ts)' }}>{d.sharesOwned.toLocaleString()}</td>
                  <td className="right" style={{ color: 'var(--ts)' }}>₱{d.amountPerShare.toFixed(4)}</td>
                  <td className="right" style={{ fontWeight: 650, color: 'var(--green)' }}>₱{formatCurrency(d.totalAmount)}</td>
                  <td>{new Date(d.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="center">
                    <button
                      onClick={() => removeDividend(d.id)}
                      title="Delete Entry"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: 7, color: 'var(--red)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,71,87,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {dividends.length === 0 && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--tm)', fontSize: 12 }}>
              No dividend payouts logged yet. Use the form above to add your first passive income entry.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
