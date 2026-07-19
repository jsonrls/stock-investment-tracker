'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { api, Stock } from '@/lib/api';
import { PriceChange, PriceDisplay } from './ui/PriceDisplay';
import { TableRowSkeleton } from './ui/Skeleton';
import { StockLogo } from './ui/StockLogo';
import { Eye, Star, RefreshCw, BarChart2, EyeOff } from 'lucide-react';

export function Watchlist({ onSelectStock }: { onSelectStock?: (symbol: string, name: string) => void }) {
  const { watchlist, removeFromWatchlist } = usePortfolio();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (watchlist.length === 0) { setStocks([]); setLoading(false); return; }
    setLoading(true);
    try   { const r = await api.pollQuotes(watchlist); setStocks(r.stocks); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, [watchlist]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={14} style={{ color: 'var(--gold)' }} fill="var(--gold)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--tp)' }}>Watchlist</span>
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
          <table className="tbl">
            <tbody>
              {loading
                ? Array.from({ length: Math.max(watchlist.length, 3) }).map((_, i) => <TableRowSkeleton key={i} cols={3} />)
                : stocks.map(s => (
                  <tr key={s.symbol}>
                    <td style={{ width: '55%', maxWidth: 0, paddingRight: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <StockLogo symbol={s.symbol} size={28} />
                        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--tp)' }}>{s.symbol}</div>
                          <div style={{ 
                            fontSize: 11, 
                            color: 'var(--tm)', 
                            marginTop: 2,
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
                    <td className="right" style={{ width: '15%', paddingLeft: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
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
                ))
              }
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
