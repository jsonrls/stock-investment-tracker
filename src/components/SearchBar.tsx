'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { api, Stock } from '@/lib/api';
import { PriceChange, PriceDisplay } from './ui/PriceDisplay';
import { StockLogo } from './ui/StockLogo';

interface SearchBarProps {
  onSelectStock?: (stock: Stock) => void;
  placeholder?: string;
}

export function SearchBar({ onSelectStock, placeholder = 'Search stocks…' }: SearchBarProps) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const ref   = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try   { const r = await api.searchStocks(query, 8); setResults(r.data); setOpen(true); }
      catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  const pick = (s: Stock) => { onSelectStock?.(s); setQuery(''); setOpen(false); setResults([]); };
  const clear = () => { setQuery(''); setOpen(false); setResults([]); };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--tm)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="field"
          style={{ paddingLeft: 36, paddingRight: query ? 34 : 12, paddingTop: 9, paddingBottom: 9, fontSize: 13 }}
        />
        {query && (
          <button onClick={clear} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tm)', display: 'flex' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div className="slide-in" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
          background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--tm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--tm)' }}>No results for &quot;{query}&quot;</div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {results.map(s => (
                <li key={s.symbol}>
                  <button onClick={() => pick(s)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: '1px solid var(--border)', transition: 'background 0.12s', textAlign: 'left',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,129,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
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
                    <div style={{ textAlign: 'right' }}>
                      <PriceDisplay price={s.price} style={{ fontSize: 13, fontWeight: 600, color: 'var(--tp)', display: 'block' }} />
                      <PriceChange value={s.percent_change} size="sm" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
