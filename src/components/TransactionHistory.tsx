'use client';

import React, { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { useTransactions, TransactionRecord } from '@/context/TransactionContext';
import { Plus, Trash2, Calendar, Coins, ArrowRightLeft, FileText, Search, Calculator } from 'lucide-react';

export function TransactionHistory() {
  const { holdings } = usePortfolio();
  const { transactions, addTransaction, removeTransaction, realizedGains } = useTransactions();

  // Form State
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [priceStr, setPriceStr] = useState('');
  const [sharesStr, setSharesStr] = useState('');
  const [feesStr, setFeesStr] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search/Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-calculate fees based on standard PSE rates
  const handleAutoCalcFees = () => {
    const p = parseFloat(priceStr) || 0;
    const s = parseInt(sharesStr, 10) || 0;
    const gross = p * s;
    if (gross <= 0) return;

    const commission = Math.max(gross * 0.0025, 20);
    const vat = commission * 0.12;
    const pseFee = gross * 0.00005;
    const sccp = gross * 0.0001;
    const salesTax = type === 'SELL' ? gross * 0.006 : 0;

    const totalFees = commission + vat + pseFee + sccp + salesTax;
    setFeesStr(totalFees.toFixed(2));
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !priceStr || !sharesStr || !dateStr) return;
    setIsSubmitting(true);

    try {
      await addTransaction({
        symbol: symbol.toUpperCase(),
        type,
        price: parseFloat(priceStr),
        shares: parseInt(sharesStr, 10),
        fees: parseFloat(feesStr) || 0,
        date: dateStr,
        notes: notes.trim() || undefined
      });

      // Clear form
      setSymbol('');
      setPriceStr('');
      setSharesStr('');
      setFeesStr('');
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (n: number) => {
    return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Filter transactions
  const filteredTxs = transactions.filter(tx => 
    tx.symbol.toUpperCase().includes(searchQuery.toUpperCase())
  );

  return (
    <div className="slide-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, pointerEvents: 'auto' }}>
      
      {/* ━━━━━━━━ LEFT: LOG TRANSACTION FORM ━━━━━━━━ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Realized Profit Stat Card */}
        <div className="card panel-card" style={{ 
          padding: '20px 22px', 
          background: 'linear-gradient(135deg, var(--surface2) 0%, rgba(199,242,87,0.02) 100%)',
          border: '1px solid var(--border)' 
        }}>
          <div style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Total Realized Gains / Losses
          </div>
          <div style={{ fontSize: 24, fontWeight: 850, color: realizedGains >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-inter)', letterSpacing: '-0.04em' }}>
            {realizedGains >= 0 ? '+' : ''}₱{formatCurrency(realizedGains)}
          </div>
          <div style={{ fontSize: 9, color: 'var(--tm)', marginTop: 4 }}>
            Net profit realized from closed SELL positions (after fees)
          </div>
        </div>

        {/* Transaction logger panel */}
        <div className="card panel-card editorial-panel" style={{ padding: '20px 22px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tp)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} style={{ color: 'var(--accent)' }} /> Log Trade Transaction
          </h2>

          <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Symbol Selection */}
            <div>
              <label htmlFor="txSymbol" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Stock Symbol
              </label>
              <input
                id="txSymbol"
                type="text"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder="e.g. ALI, SM, BDO"
                className="field"
                style={{ padding: '8px 12px', fontSize: 13, textTransform: 'uppercase' }}
                required
              />
              <span style={{ fontSize: 9, color: 'var(--tm)', marginTop: 4, display: 'block' }}>
                Type symbol. If matched with your holdings, it will update shares and cost basis automatically.
              </span>
            </div>

            {/* Type Toggle BUY/SELL */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Transaction Type
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setType('BUY')}
                  style={{
                    flex: 1, padding: '8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 3,
                    border: '1px solid var(--border)',
                    background: type === 'BUY' ? 'rgba(0,214,122,0.12)' : 'var(--surface2)',
                    color: type === 'BUY' ? 'var(--green)' : 'var(--ts)',
                    borderColor: type === 'BUY' ? 'var(--green)' : 'var(--border)'
                  }}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setType('SELL')}
                  style={{
                    flex: 1, padding: '8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 3,
                    border: '1px solid var(--border)',
                    background: type === 'SELL' ? 'rgba(255,129,107,0.12)' : 'var(--surface2)',
                    color: type === 'SELL' ? 'var(--red)' : 'var(--ts)',
                    borderColor: type === 'SELL' ? 'var(--red)' : 'var(--border)'
                  }}
                >
                  SELL
                </button>
              </div>
            </div>

            {/* Price & Shares */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="txPrice" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Price per Share (₱)
                </label>
                <input
                  id="txPrice"
                  type="number"
                  step="any"
                  min="0.0001"
                  value={priceStr}
                  onChange={e => setPriceStr(e.target.value)}
                  className="field"
                  style={{ padding: '8px 12px', fontSize: 13 }}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label htmlFor="txShares" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Number of Shares
                </label>
                <input
                  id="txShares"
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
            </div>

            {/* Fees + Auto calc */}
            <div>
              <label htmlFor="txFees" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Transaction Fees & Taxes (₱)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="txFees"
                  type="number"
                  step="any"
                  min="0"
                  value={feesStr}
                  onChange={e => setFeesStr(e.target.value)}
                  className="field"
                  style={{ padding: '8px 12px', fontSize: 13, flex: 1 }}
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={handleAutoCalcFees}
                  title="Auto-calculate standard PSE fees"
                  className="btn-s"
                  style={{ padding: '0 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Calculator size={12} /> Auto Calc
                </button>
              </div>
            </div>

            {/* Date & Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12 }}>
              <div>
                <label htmlFor="txDate" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Trade Date
                </label>
                <input
                  id="txDate"
                  type="date"
                  value={dateStr}
                  onChange={e => setDateStr(e.target.value)}
                  className="field"
                  style={{ padding: '8px 12px', fontSize: 13, height: 38, background: 'var(--surface2)', color: 'var(--tp)' }}
                  required
                />
              </div>
              <div>
                <label htmlFor="txNotes" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Notes (Broker, account, etc.)
                </label>
                <input
                  id="txNotes"
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="field"
                  style={{ padding: '8px 12px', fontSize: 13 }}
                  placeholder="e.g. COL Financial, Cash Account"
                />
              </div>
            </div>

            {/* Total calculation preview */}
            {priceStr && sharesStr && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, color: 'var(--ts)' }}>
                <span>{type === 'BUY' ? 'Total Cash Cost:' : 'Net Proceeds Received:'}</span>
                <strong style={{ color: 'var(--tp)' }}>
                  ₱{formatCurrency(
                    type === 'BUY' 
                      ? (parseFloat(priceStr) * parseInt(sharesStr, 10)) + (parseFloat(feesStr) || 0)
                      : (parseFloat(priceStr) * parseInt(sharesStr, 10)) - (parseFloat(feesStr) || 0)
                  )}
                </strong>
              </div>
            )}

            <button
              type="submit"
              className="btn-p"
              style={{ padding: '10px 0', fontSize: 12, marginTop: 4 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging...' : 'Log Transaction'}
            </button>
          </form>
        </div>

      </div>

      {/* ━━━━━━━━ RIGHT: TRANSACTION LEDGER TABLE ━━━━━━━━ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        <div className="card panel-card editorial-panel" style={{ padding: '20px 22px', minHeight: 450 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tp)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} style={{ color: 'var(--accent)' }} /> Transaction Audit Logs
            </h2>
            
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 200 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--tm)' }} />
              <input
                type="text"
                placeholder="Search symbol..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="field"
                style={{ paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6, fontSize: 11, borderRadius: 20 }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Stock</th>
                  <th>Type</th>
                  <th className="right">Shares</th>
                  <th className="right">Price</th>
                  <th className="right">Fees</th>
                  <th className="right">Net Amount</th>
                  <th className="center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.map(tx => {
                  const gross = tx.shares * tx.price;
                  const netAmount = tx.type === 'BUY' ? gross + tx.fees : gross - tx.fees;
                  return (
                    <tr key={tx.id}>
                      <td style={{ fontSize: 11, color: 'var(--ts)', whiteSpace: 'nowrap' }}>
                        {new Date(tx.date).toLocaleDateString('en-PH', { year: '2-digit', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--tp)' }}>{tx.symbol}</td>
                      <td>
                        <span style={{
                          fontSize: 9,
                          padding: '1px 5px',
                          borderRadius: 6,
                          background: tx.type === 'BUY' ? 'rgba(0,214,122,0.12)' : 'rgba(255,129,107,0.12)',
                          color: tx.type === 'BUY' ? 'var(--green)' : 'var(--red)',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="right" style={{ color: 'var(--ts)' }}>{tx.shares.toLocaleString()}</td>
                      <td className="right" style={{ color: 'var(--ts)' }}>₱{tx.price.toFixed(2)}</td>
                      <td className="right" style={{ color: 'var(--tm)', fontSize: 11 }}>₱{tx.fees.toFixed(2)}</td>
                      <td className="right" style={{ fontWeight: 650, color: 'var(--tp)' }}>
                        ₱{formatCurrency(netAmount)}
                      </td>
                      <td className="center">
                        <button
                          onClick={() => removeTransaction(tx.id)}
                          title="Delete Log"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: 7, color: 'var(--red)', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,71,87,0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredTxs.length === 0 && (
              <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--tm)', fontSize: 12 }}>
                No transactions matching &quot;{searchQuery || 'any'}&quot; logged. Use the form to record stock transactions.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
