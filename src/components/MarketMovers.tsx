'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, Stock, MoverType } from '@/lib/api';
import { PriceChange, PriceDisplay, VolumeDisplay } from './ui/PriceDisplay';
import { TableRowSkeleton } from './ui/Skeleton';
import { StockLogo } from './ui/StockLogo';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface MarketMoversProps {
  onSelectStock?: (stock: Stock) => void;
}

const TABS: { key: MoverType; label: string; Icon: React.ElementType }[] = [
  { key: 'gainers', label: 'Top Gainers', Icon: TrendingUp  },
  { key: 'losers',  label: 'Top Losers',  Icon: TrendingDown },
  { key: 'active',  label: 'Most Active', Icon: Zap          },
];

export function MarketMovers({ onSelectStock }: MarketMoversProps) {
  const [type, setType]     = useState<MoverType>('gainers');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovers = useCallback(async () => {
    setLoading(true);
    try   { const r = await api.getMovers(type, 8); setStocks(r.data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, [type]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchMovers(); }, [fetchMovers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab pills */}
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface3)', marginBottom: 16 }}>
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`mtab${type === key ? ' active' : ''}`}
            onClick={() => setType(key)}
          >
            <Icon size={11} />{label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Symbol</th>
              <th className="right" style={{ width: '20%' }}>Price</th>
              <th className="right" style={{ width: '20%' }}>Change</th>
              <th className="right" style={{ width: '20%' }}>Volume</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)
              : stocks.map(s => (
                <tr key={s.symbol} style={{ cursor: 'pointer' }} onClick={() => onSelectStock?.(s)}>
                  <td style={{ width: '40%', maxWidth: 0 }}>
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
                  <td className="right">
                    <PriceDisplay price={s.price} style={{ fontSize: 13, fontWeight: 600, color: 'var(--tp)' }} />
                  </td>
                  <td className="right">
                    <PriceChange value={s.percent_change} size="sm" />
                  </td>
                  <td className="right">
                    <VolumeDisplay volume={s.volume} style={{ fontSize: 12, color: 'var(--ts)' }} />
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
