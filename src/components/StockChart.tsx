'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart, Bar, Line,
} from 'recharts';
import { api, Candle } from '@/lib/api';
import { format, subDays, parseISO } from 'date-fns';
import { ChartSkeleton } from './ui/Skeleton';

interface StockChartProps {
  symbol: string;
  currentPrice?: number;
}

type Period  = '1W' | '1M' | '3M' | '6M' | '1Y';
type ChartType = 'area' | 'ohlcv';

const PERIODS: Record<Period, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', fontSize: 12 }}>
      <div style={{ color: 'var(--ts)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 700, marginTop: 2 }}>
          {p.dataKey === 'volume'
            ? `Vol: ${Number(p.value).toLocaleString()}`
            : `₱${Number(p.value).toFixed(2)}`}
        </div>
      ))}
    </div>
  );
}

export function StockChart({ symbol, currentPrice }: StockChartProps) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [period, setPeriod]   = useState<Period>('1M');
  const [chartType, setChartType] = useState<ChartType>('area');

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const to   = new Date();
      const from = subDays(to, PERIODS[period]);
      const res  = await api.getCandles(symbol, {
        from: format(from, 'yyyy-MM-dd'),
        to:   format(to,   'yyyy-MM-dd'),
        period: 'd',
      });
      setCandles(res.data);
    } catch { setError('Failed to load chart data'); }
    finally { setLoading(false); }
  }, [symbol, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const data = candles.map(c => ({
    date:   format(parseISO(c.date), period === '1W' ? 'EEE d' : period === '1M' ? 'MMM d' : 'MMM yy'),
    close:  c.close, open: c.open, high: c.high, low: c.low, volume: c.volume,
  }));

  const first = data[0]?.close;
  const last  = data[data.length - 1]?.close;
  const pos   = !first || last >= first;
  const color = pos ? 'var(--green)' : 'var(--red)';
  const gid   = `g-${symbol}`;

  if (loading) return <ChartSkeleton />;
  if (error)   return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <div style={{ color: 'var(--tm)', fontSize: 13 }}>{error}</div>
      <button onClick={fetchData} className="btn-s" style={{ fontSize: 11, padding: '5px 14px' }}>Retry</button>
    </div>
  );
  if (!data.length) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--tm)', fontSize: 13 }}>No chart data available</span>
    </div>
  );

  /* shared axis styles */
  const tickStyle = { fill: 'var(--tm)', fontSize: 10 };
  const gridStyle = { strokeDasharray: '3 3', stroke: 'rgba(99,127,255,0.07)', vertical: false };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        {/* Chart type */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface3)', padding: 3, borderRadius: 9 }}>
          {(['area', 'ohlcv'] as ChartType[]).map(t => (
            <button key={t} onClick={() => setChartType(t)} style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: chartType === t ? 'rgba(99,129,255,0.18)' : 'transparent',
              color:      chartType === t ? 'var(--accent)' : 'var(--tm)',
              boxShadow:  chartType === t ? '0 0 0 1px rgba(99,129,255,0.35)' : 'none',
            }}>{t === 'area' ? '📈 Area' : '🕯️ OHLCV'}</button>
          ))}
        </div>
        {/* Period */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface3)', padding: 3, borderRadius: 9 }}>
          {(Object.keys(PERIODS) as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: period === p ? 'rgba(99,129,255,0.18)' : 'transparent',
              color:      period === p ? 'var(--accent)' : 'var(--tm)',
              boxShadow:  period === p ? '0 0 0 1px rgba(99,129,255,0.35)' : 'none',
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Price summary */}
      {first && last && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--tp)' }}>₱{last.toFixed(2)}</span>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
            background: pos ? 'rgba(0,214,122,0.12)' : 'rgba(255,71,87,0.12)',
            color, border: `1px solid ${pos ? 'rgba(0,214,122,0.28)' : 'rgba(255,71,87,0.28)'}`,
          }}>
            {pos ? '+' : ''}{(((last - first) / first) * 100).toFixed(2)}%
          </span>
          <span style={{ fontSize: 11, color: 'var(--tm)' }}>over {period}</span>
        </div>
      )}

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {chartType === 'area' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={['auto','auto']} tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={v => `₱${v}`} width={54} />
              <Tooltip content={<CustomTooltip />} />
              {currentPrice && <ReferenceLine y={currentPrice} stroke="rgba(99,129,255,0.45)" strokeDasharray="4 4" />}
              <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2} fill={`url(#${gid})`} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: color }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="p" domain={['auto','auto']} tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={v => `₱${v}`} width={54} />
              <YAxis yAxisId="v" orientation="right" tick={tickStyle} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : `${(v/1e3).toFixed(0)}K`} width={44} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="v" dataKey="volume" fill="rgba(99,129,255,0.18)" radius={[2,2,0,0]} />
              <Line yAxisId="p" type="monotone" dataKey="high"  stroke="rgba(0,214,122,0.5)"  strokeWidth={1} strokeDasharray="3 3" dot={false} />
              <Line yAxisId="p" type="monotone" dataKey="low"   stroke="rgba(255,71,87,0.5)"  strokeWidth={1} strokeDasharray="3 3" dot={false} />
              <Line yAxisId="p" type="monotone" dataKey="close" stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: color }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
