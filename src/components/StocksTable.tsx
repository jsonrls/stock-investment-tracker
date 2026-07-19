'use client';

import { useState, useCallback, useEffect } from 'react';
import { api, Stock } from '@/lib/api';
import { PriceChange, PriceDisplay, VolumeDisplay } from './ui/PriceDisplay';
import { TableRowSkeleton } from './ui/Skeleton';
import { StockLogo } from './ui/StockLogo';
import { usePortfolio } from '@/context/PortfolioContext';
import { Star, BarChart2, PlusCircle, ChevronUp, ChevronDown, Check } from 'lucide-react';

type SortField = 'symbol' | 'name' | 'price' | 'percent_change' | 'volume';

interface StocksTableProps {
  onSelectStock?: (stock: Stock) => void;
  onAddToPortfolio?: (stock: Stock) => void;
}

export function StocksTable({ onSelectStock, onAddToPortfolio }: StocksTableProps) {
  const { holdings, addToWatchlist, removeFromWatchlist, isInWatchlist } = usePortfolio();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort]       = useState<SortField>('percent_change');
  const [order, setOrder]     = useState<'asc' | 'desc'>('desc');
  const [page, setPage]       = useState(0);
  const [total, setTotal]     = useState(0);
  const PAGE = 20;

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listStocks({ sort, order, limit: PAGE, offset: page * PAGE });
      setStocks(res.data);
      setTotal(res.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [sort, order, page]);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  const handleSort = (f: SortField) => {
    if (sort === f) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSort(f); setOrder('desc'); }
    setPage(0);
  };

  const SortIcon = ({ f }: { f: SortField }) =>
    sort !== f ? null : order === 'asc'
      ? <ChevronUp size={11} style={{ display: 'inline', marginLeft: 2 }} />
      : <ChevronDown size={11} style={{ display: 'inline', marginLeft: 2 }} />;

  const totalPages = Math.ceil(total / PAGE);

  const thBtn = (f: SortField, label: string) => (
    <button onClick={() => handleSort(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit', display: 'flex', alignItems: 'center', gap: 2 }}>
      {label}<SortIcon f={f} />
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th>{thBtn('symbol',  'Symbol')}</th>
              <th>{thBtn('name',    'Company')}</th>
              <th className="right">{thBtn('price',  'Price')}</th>
              <th className="right">{thBtn('percent_change', 'Change')}</th>
              <th className="right">{thBtn('volume', 'Volume')}</th>
              <th className="center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: PAGE }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              : stocks.map(s => (
                <tr key={s.symbol} style={{ cursor: 'pointer' }} onClick={() => onSelectStock?.(s)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StockLogo symbol={s.symbol} size={24} />
                      <span style={{ padding: '2px 8px', borderRadius: 7, background: 'rgba(99,129,255,0.12)', color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>
                        {s.symbol}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--ts)', fontSize: 12 }}>{s.name.length > 28 ? s.name.slice(0, 28) + '…' : s.name}</td>
                  <td className="right">
                    <PriceDisplay price={s.price} style={{ fontWeight: 700, color: 'var(--tp)' }} />
                  </td>
                  <td className="right"><PriceChange value={s.percent_change} size="sm" /></td>
                  <td className="right"><VolumeDisplay volume={s.volume} style={{ color: 'var(--ts)', fontSize: 12 }} /></td>
                  <td className="center" onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <button onClick={() => onSelectStock?.(s)} title="Chart"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: 6, color: 'var(--accent)' }}>
                        <BarChart2 size={13} />
                      </button>
                      <button
                        onClick={() => isInWatchlist(s.symbol) ? removeFromWatchlist(s.symbol) : addToWatchlist(s.symbol)}
                        title={isInWatchlist(s.symbol) ? 'Unwatch' : 'Watch'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: 6, color: 'var(--gold)' }}>
                        <Star size={13} fill={isInWatchlist(s.symbol) ? 'var(--gold)' : 'none'} />
                      </button>
                      <button onClick={() => onAddToPortfolio?.(s)} title={holdings.some(h => h.symbol === s.symbol) ? "Add more to Portfolio" : "Add to Portfolio"}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: 6, color: 'var(--green)' }}>
                          {holdings.some(h => h.symbol === s.symbol) ? <Check size={13} /> : <PlusCircle size={13} />}
                        </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--tm)' }}>Page {page + 1} of {totalPages} ({total} stocks)</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-s"
              style={{ fontSize: 11, padding: '5px 12px', opacity: page === 0 ? 0.4 : 1 }}>
              ← Prev
            </button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="btn-s"
              style={{ fontSize: 11, padding: '5px 12px', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
