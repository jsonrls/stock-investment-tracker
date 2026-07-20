'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, Stock } from '@/lib/api';
import { TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';

function getMarketStatus() {
  // PSE trading hours: Mon–Fri 09:30–15:30 PHT (UTC+8)
  const now = new Date();
  const ph = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const day = ph.getDay(); // 0=Sun, 6=Sat
  const h   = ph.getHours();
  const m   = ph.getMinutes();
  const mins = h * 60 + m;
  if (day === 0 || day === 6) return { label: 'Closed', sub: 'Weekend', color: 'var(--tm)' };
  if (mins < 9 * 60 + 30)    return { label: 'Pre-Market', sub: 'Opens 09:30 PHT', color: 'var(--gold)' };
  if (mins <= 15 * 60 + 30)  return { label: 'Open', sub: 'Closes 15:30 PHT', color: 'var(--green)' };
  return { label: 'Closed', sub: 'Opens 09:30 PHT', color: 'var(--tm)' };
}

interface Summary {
  gainers: number;
  losers:  number;
  neutral: number;
  asOf:    string | null;
  topGainer: Stock | null;
  topLoser:  Stock | null;
}

export function MarketSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [market, setMarket]   = useState(getMarketStatus());
  const [now, setNow]         = useState(new Date());

  // Tick clock every second
  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date());
      setMarket(getMarketStatus());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const fetch = useCallback(async () => {
    try {
      const [g, l] = await Promise.all([
        api.getMovers('gainers', 50),
        api.getMovers('losers',  50),
      ]);
      const gainers  = g.data.filter(s => s.percent_change > 0).length;
      const losers   = l.data.filter(s => s.percent_change < 0).length;
      const neutral  = g.data.filter(s => s.percent_change === 0).length;
      const topGainer = g.data[0] ?? null;
      const topLoser  = l.data[0] ?? null;
      const asOf = g.as_of ?? l.as_of ?? null;
      setSummary({ gainers, losers, neutral, asOf, topGainer, topLoser });
    } catch {
      // silently fail — show skeleton until retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const phTime = now.toLocaleTimeString('en-PH', {
    timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const phDate = now.toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric',
  });

  const total = (summary?.gainers ?? 0) + (summary?.losers ?? 0) + (summary?.neutral ?? 0);
  const gPct  = total > 0 ? ((summary?.gainers ?? 0) / total) * 100 : 0;

  return (
    <div className="kpi-grid" style={{ display: 'grid', gap: 14 }}>

      {/* Market Status */}
      <div className="card kpi-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: market.color, flexShrink: 0, boxShadow: market.label === 'Open' ? `0 0 6px ${market.color}` : 'none' }} />
          <span style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Market Status</span>
        </div>
        <div className="kpi-value" style={{ fontSize: 24, fontWeight: 800, color: market.color, letterSpacing: '-0.4px' }}>{market.label}</div>
        <div style={{ fontSize: 12, color: 'var(--tm)', marginTop: 5 }}>{market.sub}</div>
      </div>

      {/* PHT Clock */}
      <div className="card kpi-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <Clock size={10} style={{ color: 'var(--tm)', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Philippine Time</span>
        </div>
        <div className="kpi-value" style={{ fontSize: 24, fontWeight: 800, color: 'var(--tp)', letterSpacing: '-0.4px', fontVariantNumeric: 'tabular-nums' }}>{phTime}</div>
        <div style={{ fontSize: 12, color: 'var(--ts)', marginTop: 5 }}>{phDate}</div>
      </div>

      {/* Advance / Decline */}
      <div className="card kpi-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <Activity size={10} style={{ color: 'var(--tm)', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Advance / Decline</span>
        </div>
        {loading ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="skel" style={{ display: 'block', height: 28, width: 80 }} />
          </div>
        ) : (
          <>
            <div className="kpi-value" style={{ fontSize: 24, fontWeight: 800, color: 'var(--tp)', letterSpacing: '-0.4px' }}>
              <span style={{ color: 'var(--green)' }}>{summary?.gainers ?? '—'}</span>
              <span style={{ color: 'var(--tm)', fontWeight: 400, fontSize: 18 }}> / </span>
              <span style={{ color: 'var(--red)' }}>{summary?.losers ?? '—'}</span>
            </div>
            {/* Mini bar */}
            <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: 'var(--surface3)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${gPct}%`, background: 'var(--green)', borderRadius: 99, transition: 'width 0.8s ease' }} />
            </div>
          </>
        )}
      </div>

      {/* Top Mover */}
      <div className="card kpi-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <TrendingUp size={10} style={{ color: 'var(--tm)', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top Gainer Today</span>
        </div>
        {loading ? (
          <span className="skel" style={{ display: 'block', height: 28, width: 90 }} />
        ) : summary?.topGainer ? (
          <>
            <div className="kpi-value" style={{ fontSize: 22, fontWeight: 800, color: 'var(--tp)', letterSpacing: '-0.4px' }}>{summary.topGainer.symbol}</div>
            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--ts)' }}>₱{summary.topGainer.price.toFixed(2)}</span>
              <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 99, background: 'rgba(0,214,122,0.12)', color: 'var(--green)', border: '1px solid rgba(0,214,122,0.25)', fontWeight: 700 }}>
                +{summary.topGainer.percent_change.toFixed(2)}%
              </span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--tm)' }}>—</div>
        )}
      </div>

    </div>
  );
}
