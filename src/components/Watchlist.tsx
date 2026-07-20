'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { api, Stock } from '@/lib/api';
import { PriceChange, PriceDisplay } from './ui/PriceDisplay';
import { TableRowSkeleton } from './ui/Skeleton';
import { StockLogo } from './ui/StockLogo';
import { Eye, Star, RefreshCw, BarChart2, EyeOff, Bell, BellRing, Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LoginBlock } from './LoginBlock';

interface AlertSettings {
  targetBuy?: number;
  targetSell?: number;
}

export function Watchlist({ 
  onSelectStock,
  onSignInClick
}: { 
  onSelectStock?: (symbol: string, name: string) => void;
  onSignInClick?: () => void;
}) {
  const { user } = useAuth();
  const { watchlist, removeFromWatchlist } = usePortfolio();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  // Watchlist alerts state
  const [alerts, setAlerts] = useState<Record<string, AlertSettings>>({});
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [tempBuy, setTempBuy] = useState('');
  const [tempSell, setTempSell] = useState('');

  // Load alerts from localStorage
  useEffect(() => {
    if (!user) return;
    const storageKey = `pse_watchlist_alerts_${user.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setAlerts(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing watchlist alerts', e);
      }
    }
  }, [user]);

  const fetch = useCallback(async () => {
    if (!user) return;
    if (watchlist.length === 0) { setStocks([]); setLoading(false); return; }
    setLoading(true);
    try { 
      const r = await api.pollQuotes(watchlist); 
      setStocks(r.stocks); 
    } catch { 
      /* ignore */ 
    } finally { 
      setLoading(false); 
    }
  }, [watchlist, user]);

  useEffect(() => { 
    fetch(); 
  }, [fetch]);

  const startEdit = (s: Stock) => {
    setEditingSymbol(s.symbol);
    const curr = alerts[s.symbol];
    setTempBuy(curr?.targetBuy !== undefined ? curr.targetBuy.toString() : '');
    setTempSell(curr?.targetSell !== undefined ? curr.targetSell.toString() : '');
  };

  const saveAlert = (sym: string) => {
    const storageKey = `pse_watchlist_alerts_${user?.id || 'anon'}`;
    const updated = {
      ...alerts,
      [sym]: {
        targetBuy: tempBuy ? parseFloat(tempBuy) : undefined,
        targetSell: tempSell ? parseFloat(tempSell) : undefined
      }
    };
    setAlerts(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setEditingSymbol(null);
  };

  if (!user) {
    return (
      <LoginBlock 
        title="Unlock your Watchlist" 
        description="Sign in to customize your watchlist, monitor price alerts, and follow PSE stocks across all your devices."
        features={[
          "Track stocks you're interested in",
          "Real-time price & performance updates",
          "Automatic cloud synchronization"
        ]}
        noCard={true}
        onSignInClick={onSignInClick}
      />
    );
  }

  const formatCurrency = (n: number) => {
    return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={14} style={{ color: 'var(--gold)' }} fill="var(--gold)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--tp)' }}>Watchlist Alerts</span>
          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'var(--surface3)', color: 'var(--tm)', fontWeight: 600 }}>{watchlist.length}</span>
        </div>
        <button onClick={fetch} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, color: 'var(--tm)' }}>
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {watchlist.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Eye size={22} style={{ color: 'var(--tm)', margin: '0 auto 8px' }} />
            <div style={{ fontSize: 12, color: 'var(--tm)' }}>Watchlist is empty</div>
          </div>
        ) : (
          <table className="tbl" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              {loading
                ? Array.from({ length: Math.max(watchlist.length, 3) }).map((_, i) => <TableRowSkeleton key={i} cols={3} />)
                : stocks.map(s => {
                    const alertSettings = alerts[s.symbol];
                    const isBuyMet = alertSettings?.targetBuy !== undefined && s.price <= alertSettings.targetBuy;
                    const isSellMet = alertSettings?.targetSell !== undefined && s.price >= alertSettings.targetSell;
                    const hasActiveAlert = alertSettings?.targetBuy !== undefined || alertSettings?.targetSell !== undefined;

                    return (
                      <React.Fragment key={s.symbol}>
                        <tr style={{ borderBottom: editingSymbol === s.symbol ? 'none' : '1px solid var(--border)' }}>
                          <td style={{ width: '50%', maxWidth: 0, paddingRight: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                              <StockLogo symbol={s.symbol} size={28} />
                              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--tp)' }}>{s.symbol}</div>
                                  {isBuyMet && (
                                    <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: 'rgba(0,214,122,0.12)', color: 'var(--green)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                      Buy Target Met
                                    </span>
                                  )}
                                  {isSellMet && (
                                    <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,129,107,0.12)', color: 'var(--red)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                      Sell Target Met
                                    </span>
                                  )}
                                </div>
                                <div style={{ 
                                  fontSize: 11, 
                                  color: 'var(--tm)', 
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {s.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="right" style={{ width: '30%' }}>
                            <PriceDisplay price={s.price} style={{ fontSize: 13, fontWeight: 600, color: 'var(--tp)', display: 'block' }} />
                            <PriceChange value={s.percent_change} size="sm" />
                          </td>
                          <td className="right" style={{ width: '20%', paddingLeft: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                              {/* Price alert settings toggle button */}
                              <button 
                                onClick={() => startEdit(s)}
                                title="Configure price targets"
                                style={{ 
                                  background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, 
                                  color: hasActiveAlert ? 'var(--gold)' : 'var(--tm)',
                                  transition: 'background 0.15s' 
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                              >
                                {hasActiveAlert ? <BellRing size={13} fill="var(--gold)" /> : <Bell size={13} />}
                              </button>
                              <button onClick={() => onSelectStock?.(s.symbol, s.name)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: 'var(--accent)' }}>
                                <BarChart2 size={13} />
                              </button>
                              <button onClick={() => removeFromWatchlist(s.symbol)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: 'var(--gold)' }}>
                                <EyeOff size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline Alert Editor Panel */}
                        {editingSymbol === s.symbol && (
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td colSpan={3} style={{ padding: '8px 12px', background: 'var(--surface2)' }}>
                              <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ts)', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Configure Alert targets for {s.symbol}</span>
                                  <span style={{ color: 'var(--tm)' }}>Current: ₱{formatCurrency(s.price)}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1, minWidth: 120 }}>
                                    <span style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700 }}>BUY TARGET (≤):</span>
                                    <input
                                      type="number"
                                      step="any"
                                      value={tempBuy}
                                      onChange={e => setTempBuy(e.target.value)}
                                      placeholder="None"
                                      className="field"
                                      style={{ padding: '4px 8px', fontSize: 11, flex: 1 }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1, minWidth: 120 }}>
                                    <span style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700 }}>SELL TARGET (≥):</span>
                                    <input
                                      type="number"
                                      step="any"
                                      value={tempSell}
                                      onChange={e => setTempSell(e.target.value)}
                                      placeholder="None"
                                      className="field"
                                      style={{ padding: '4px 8px', fontSize: 11, flex: 1 }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button 
                                      onClick={() => saveAlert(s.symbol)} 
                                      className="btn-p" 
                                      style={{ 
                                        padding: '4px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2, height: 26 
                                      }}
                                    >
                                      <Check size={11} /> Save
                                    </button>
                                    <button 
                                      onClick={() => setEditingSymbol(null)} 
                                      className="btn-s" 
                                      style={{ 
                                        padding: '4px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2, height: 26 
                                      }}
                                    >
                                      <X size={11} /> Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
              }
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
