'use client';

import { useState, useEffect, useMemo } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { api, Stock, Candle } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Coins, TrendingUp, Calendar, ArrowUpRight, BarChart3, HelpCircle } from 'lucide-react';

type PlannerMode = 'future' | 'history';

interface FuturePoint {
  period: string;
  contributions: number;
  value: number;
}

interface HistoryPoint {
  date: string;
  price: number;
  sharesBought: number;
  cumShares: number;
  cumContributions: number;
  portfolioValue: number;
}

export function PCAPlanner() {
  const [mode, setMode] = useState<PlannerMode>('future');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  
  // Future Projection state
  const [futContribution, setFutContribution] = useState('5000');
  const [futFrequency, setFutFrequency] = useState<'monthly' | 'weekly' | 'quarterly'>('monthly');
  const [futYears, setFutYears] = useState('5');
  const [futGrowth, setFutGrowth] = useState('8');
  const [futDividend, setFutDividend] = useState('2');

  // Historical Backtest state
  const [histContribution, setHistContribution] = useState('5000');
  const [histYears, setHistYears] = useState('3');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Default prefill: search a stock or prefill standard ALI
  useEffect(() => {
    api.getStock('ALI')
      .then(setSelectedStock)
      .catch(() => {});
  }, []);

  // Fetch history when stock or histYears changes
  useEffect(() => {
    if (mode !== 'history' || !selectedStock) return;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      setHistoryError('');
      try {
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setFullYear(toDate.getFullYear() - parseInt(histYears, 10));

        // Split date range into max 360-day segments to safely bypass API date limits
        const chunks: { from: string; to: string }[] = [];
        let currentFrom = new Date(fromDate);
        
        while (currentFrom < toDate) {
          const nextTo = new Date(currentFrom);
          nextTo.setDate(currentFrom.getDate() + 360);
          const actualTo = nextTo > toDate ? toDate : nextTo;
          
          chunks.push({
            from: currentFrom.toISOString().split('T')[0],
            to: actualTo.toISOString().split('T')[0]
          });
          
          const temp = new Date(actualTo);
          temp.setDate(temp.getDate() + 1);
          currentFrom = temp;
        }

        const promises = chunks.map(chunk =>
          api.getCandles(selectedStock.symbol, {
            period: 'm',
            from: chunk.from,
            to: chunk.to
          })
        );

        const responses = await Promise.all(promises);
        const allCandles: Candle[] = [];
        responses.forEach(res => {
          if (res && res.data) {
            allCandles.push(...res.data);
          }
        });

        // Deduplicate candles by date and sort chronologically
        const uniqueCandlesMap = new Map<string, Candle>();
        allCandles.forEach(c => {
          if (c && c.date) {
            uniqueCandlesMap.set(c.date, c);
          }
        });

        const sorted = Array.from(uniqueCandlesMap.values())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (sorted.length > 0) {
          setCandles(sorted);
        } else {
          setCandles([]);
          setHistoryError('No historical data found for this period.');
        }
      } catch (err) {
        console.error('Error fetching backtest candles in PCAPlanner:', err);
        setHistoryError('Failed to fetch historical quotes for backtesting.');
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [mode, selectedStock, histYears]);

  // Future Projection Calculation
  const futureData = useMemo(() => {
    const pContribution = parseFloat(futContribution) || 0;
    const pYears = parseInt(futYears, 10) || 5;
    const pGrowth = (parseFloat(futGrowth) || 0) / 100;
    const pDividend = (parseFloat(futDividend) || 0) / 100;

    let periodsPerYear = 12;
    if (futFrequency === 'weekly') periodsPerYear = 52;
    if (futFrequency === 'quarterly') periodsPerYear = 4;

    const totalPeriods = pYears * periodsPerYear;
    const ratePerPeriod = (pGrowth + pDividend) / periodsPerYear;

    const points: FuturePoint[] = [];
    let cumContributions = 0;
    let portfolioValue = 0;

    // Point 0
    points.push({
      period: 'Start',
      contributions: 0,
      value: 0
    });

    for (let i = 1; i <= totalPeriods; i++) {
      cumContributions += pContribution;
      // Compound existing portfolio and add new contribution
      portfolioValue = (portfolioValue + pContribution) * (1 + ratePerPeriod);

      // Save key intervals for the chart (limit points to prevent clutter)
      if (i === 1 || i % Math.max(1, Math.floor(totalPeriods / 12)) === 0 || i === totalPeriods) {
        let label = '';
        if (futFrequency === 'monthly') {
          const yr = Math.floor(i / 12);
          const mo = i % 12;
          label = yr > 0 ? `Yr ${yr}${mo > 0 ? ` M${mo}` : ''}` : `M${mo}`;
        } else if (futFrequency === 'weekly') {
          const yr = Math.floor(i / 52);
          label = yr > 0 ? `Yr ${yr}` : `W${i}`;
        } else {
          const yr = Math.floor(i / 4);
          label = yr > 0 ? `Yr ${yr} Q${i % 4 || 4}` : `Q${i}`;
        }

        points.push({
          period: label,
          contributions: Math.round(cumContributions),
          value: Math.round(portfolioValue)
        });
      }
    }

    return {
      points,
      totalCapital: cumContributions,
      estimatedVal: portfolioValue,
      totalProfit: portfolioValue - cumContributions,
      roi: cumContributions > 0 ? ((portfolioValue - cumContributions) / cumContributions) * 100 : 0
    };
  }, [futContribution, futFrequency, futYears, futGrowth, futDividend]);

  // Historical Backtest Calculation
  const historyResults = useMemo(() => {
    if (mode !== 'history' || candles.length === 0 || !selectedStock) {
      return null;
    }

    const pContribution = parseFloat(histContribution) || 0;
    let leftoverCash = 0;
    let accumulatedShares = 0;
    let totalInvested = 0;
    const points: HistoryPoint[] = [];

    candles.forEach(candle => {
      const dateLabel = new Date(candle.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      totalInvested += pContribution;
      
      const fundsAvailable = pContribution + leftoverCash;
      const sharesToBuy = Math.floor(fundsAvailable / candle.close);
      const spent = sharesToBuy * candle.close;
      leftoverCash = fundsAvailable - spent;
      accumulatedShares += sharesToBuy;

      points.push({
        date: dateLabel,
        price: candle.close,
        sharesBought: sharesToBuy,
        cumShares: accumulatedShares,
        cumContributions: totalInvested,
        portfolioValue: Math.round((accumulatedShares * candle.close) + leftoverCash)
      });
    });

    const finalPrice = selectedStock.price; // current live price
    const finalPortfolioVal = (accumulatedShares * finalPrice) + leftoverCash;
    const netReturn = finalPortfolioVal - totalInvested;
    const returnPct = totalInvested > 0 ? (netReturn / totalInvested) * 100 : 0;
    const avgCost = accumulatedShares > 0 ? (totalInvested - leftoverCash) / accumulatedShares : 0;

    // Compare with Lump Sum: buying all shares on Day 1
    const firstCandlePrice = candles[0].close;
    const lumpSumShares = Math.floor(totalInvested / firstCandlePrice);
    const lumpSumLeftover = totalInvested - (lumpSumShares * firstCandlePrice);
    const lumpSumVal = (lumpSumShares * finalPrice) + lumpSumLeftover;
    const lumpSumReturn = lumpSumVal - totalInvested;
    const lumpSumReturnPct = totalInvested > 0 ? (lumpSumReturn / totalInvested) * 100 : 0;

    return {
      points,
      totalInvested,
      finalValue: finalPortfolioVal,
      accumulatedShares,
      leftoverCash,
      avgCost,
      netReturn,
      returnPct,
      lumpSumVal,
      lumpSumReturn,
      lumpSumReturnPct
    };
  }, [mode, candles, histContribution, selectedStock]);

  const chartData = useMemo(() => {
    if (mode === 'future') {
      return futureData.points.map(p => ({
        label: p.period,
        contributions: p.contributions,
        value: p.value
      }));
    } else {
      return (historyResults?.points || []).map(p => ({
        label: p.date,
        contributions: p.cumContributions,
        value: p.portfolioValue
      }));
    }
  }, [mode, futureData.points, historyResults?.points]);

  const formatCurrency = (n: number) => {
    return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, pointerEvents: 'auto' }}>
      
      {/* ══════════ PLANNER TABS ══════════ */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 16 }}>
        <button
          onClick={() => setMode('future')}
          className={`ntab${mode === 'future' ? ' active' : ''}`}
          style={{ paddingBottom: 10, borderBottomWidth: 3 }}
        >
          <Coins size={14} style={{ marginRight: 6 }} /> Future DCA Planner
        </button>
        <button
          onClick={() => setMode('history')}
          className={`ntab${mode === 'history' ? ' active' : ''}`}
          style={{ paddingBottom: 10, borderBottomWidth: 3 }}
        >
          <Calendar size={14} style={{ marginRight: 6 }} /> Historical Backtester
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        
        {/* ━━━━━━━━ LEFT: INPUT CONTROLS ━━━━━━━━ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div className="card panel-card editorial-panel" style={{ padding: '20px 22px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tp)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              {mode === 'future' ? <Coins size={18} style={{ color: 'var(--accent)' }} /> : <Calendar size={18} style={{ color: 'var(--accent)' }} />}
              {mode === 'future' ? 'DCA Savings Target' : 'Historical Backtest Setup'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Selected Stock (for market details & prefilling) */}
              <div>
                <label style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Select Target Stock
                </label>
                <SearchBar onSelectStock={setSelectedStock} placeholder="Search PSE stock..." />
                {selectedStock && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, padding: '6px 12px', background: 'rgba(215,255,100,0.06)', border: '1px solid var(--border)', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--ts)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{selectedStock.symbol}</span>
                      <span>{selectedStock.name}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 650, color: 'var(--tp)' }}>
                      ₱{formatCurrency(selectedStock.price)}
                    </div>
                  </div>
                )}
              </div>

              {/* Frequencies and Contributions */}
              {mode === 'future' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                    <div>
                      <label htmlFor="futCont" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                        Contribution Amount (₱)
                      </label>
                      <input
                        id="futCont"
                        type="number"
                        min="1"
                        value={futContribution}
                        onChange={e => setFutContribution(e.target.value)}
                        className="field"
                        style={{ padding: '8px 12px', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label htmlFor="futFreq" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                        Frequency
                      </label>
                      <select
                        id="futFreq"
                        value={futFrequency}
                        onChange={e => setFutFrequency(e.target.value as 'monthly' | 'weekly' | 'quarterly')}
                        className="field"
                        style={{ padding: '8px 12px', fontSize: 13, height: 38, background: 'var(--surface2)', color: 'var(--tp)' }}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                    <div>
                      <label htmlFor="futPeriod" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                        Investment Period ({futYears} Years)
                      </label>
                      <input
                        id="futPeriod"
                        type="range"
                        min="1"
                        max="20"
                        value={futYears}
                        onChange={e => setFutYears(e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label htmlFor="futGrowthVal" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                        Annual Growth (%)
                      </label>
                      <input
                        id="futGrowthVal"
                        type="number"
                        min="0"
                        max="50"
                        value={futGrowth}
                        onChange={e => setFutGrowth(e.target.value)}
                        className="field"
                        style={{ padding: '8px 12px', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label htmlFor="futDivVal" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                        Dividend Yield (%)
                      </label>
                      <input
                        id="futDivVal"
                        type="number"
                        min="0"
                        max="20"
                        value={futDividend}
                        onChange={e => setFutDividend(e.target.value)}
                        className="field"
                        style={{ padding: '8px 12px', fontSize: 13 }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                    <div>
                      <label htmlFor="histCont" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                        Monthly Contribution (₱)
                      </label>
                      <input
                        id="histCont"
                        type="number"
                        min="1"
                        value={histContribution}
                        onChange={e => setHistContribution(e.target.value)}
                        className="field"
                        style={{ padding: '8px 12px', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label htmlFor="histPeriod" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                        Testing Duration
                      </label>
                      <select
                        id="histPeriod"
                        value={histYears}
                        onChange={e => setHistYears(e.target.value)}
                        className="field"
                        style={{ padding: '8px 12px', fontSize: 13, height: 38, background: 'var(--surface2)', color: 'var(--tp)' }}
                      >
                        <option value="1">Last 1 Year</option>
                        <option value="2">Last 2 Years</option>
                        <option value="3">Last 3 Years</option>
                        <option value="5">Last 5 Years</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>

          {/* Dynamic educational notice card */}
          <div className="card panel-card" style={{ padding: '16px 20px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--tp)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <HelpCircle size={13} style={{ color: 'var(--accent)' }} /> What is DCA / PCA?
            </h3>
            <p style={{ fontSize: 11, color: 'var(--ts)', lineHeight: 1.6, margin: 0 }}>
              <strong>Peso Cost Averaging (PCA)</strong> is a disciplined strategy where you invest a fixed amount of money at regular intervals. 
              By doing so, you automatically buy <strong>more shares</strong> when prices are low, and <strong>fewer shares</strong> when prices are high, lowering your average cost over time and removing emotional timing issues.
            </p>
          </div>

        </div>

        {/* ━━━━━━━━ RIGHT: ANALYTICS & PROJECTION ━━━━━━━━ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {mode === 'future' ? (
            // FUTURE PROJECTION METRICS
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="stat-card" style={{ minHeight: 90 }}>
                <div style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Total Funded Capital
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--tp)' }}>
                  ₱{formatCurrency(futureData.totalCapital)}
                </div>
                <div style={{ fontSize: 9, color: 'var(--tm)', marginTop: 4 }}>Principal amount</div>
              </div>
              
              <div className="stat-card" style={{ minHeight: 90, background: 'linear-gradient(135deg, var(--surface2) 0%, rgba(215,255,100,0.03) 100%)' }}>
                <div style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Estimated Future Value
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>
                  ₱{formatCurrency(futureData.estimatedVal)}
                </div>
                <div style={{ fontSize: 9, color: 'var(--green)', marginTop: 4, fontWeight: 650 }}>
                  ROI: +{futureData.roi.toFixed(2)}%
                </div>
              </div>
            </div>
          ) : (
            // HISTORICAL BACKTEST METRICS
            historyResults && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="stat-card" style={{ minHeight: 90 }}>
                    <div style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                      Total Invested Cash
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--tp)' }}>
                      ₱{formatCurrency(historyResults.totalInvested)}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--tm)', marginTop: 4 }}>
                      Accumulated: {historyResults.accumulatedShares.toLocaleString()} shares
                    </div>
                  </div>
                  
                  <div className="stat-card" style={{ minHeight: 90, background: 'linear-gradient(135deg, var(--surface2) 0%, rgba(199,242,87,0.04) 100%)' }}>
                    <div style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                      Current Portfolio Value
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: historyResults.netReturn >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      ₱{formatCurrency(historyResults.finalValue)}
                    </div>
                    <div style={{ fontSize: 9, color: historyResults.netReturn >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 4, fontWeight: 650 }}>
                      Return: {historyResults.netReturn >= 0 ? '+' : ''}{historyResults.returnPct.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Compare DCA vs Lump Sum Card */}
                <div className="card" style={{ padding: '14px 16px', border: '1px solid var(--border)', fontSize: 11, background: 'var(--surface2)' }}>
                  <h4 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--tp)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <BarChart3 size={11} style={{ color: 'var(--accent)' }} /> Strategy Comparison
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <span style={{ color: 'var(--tm)' }}>Averaging Avg Cost:</span>
                      <div style={{ fontWeight: 700, color: 'var(--tp)', fontSize: 12, marginTop: 2 }}>
                        ₱{formatCurrency(historyResults.avgCost)}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--tm)' }}>Lump Sum Day 1 Return:</span>
                      <div style={{ fontWeight: 700, color: historyResults.lumpSumReturn >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 12, marginTop: 2 }}>
                        {historyResults.lumpSumReturnPct >= 0 ? '+' : ''}{historyResults.lumpSumReturnPct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, color: 'var(--ts)', fontSize: 10, lineHeight: 1.4 }}>
                    {historyResults.returnPct > historyResults.lumpSumReturnPct ? (
                      <span style={{ color: 'var(--green)' }}>✓ Peso Cost Averaging outperformed a Lump-Sum investment by {(historyResults.returnPct - historyResults.lumpSumReturnPct).toFixed(2)}% during this period!</span>
                    ) : (
                      <span>Lump sum purchase on Day 1 was more profitable by {(historyResults.lumpSumReturnPct - historyResults.returnPct).toFixed(2)}% due to market uptrend.</span>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {/* ══════════ PROJECTION CHART CARD ══════════ */}
          <div className="card panel-card" style={{ padding: '20px 22px' }}>
            <h3 style={{ fontSize: 12, fontWeight: 750, color: 'var(--tp)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              {mode === 'future' ? 'Future Asset Growth Curve' : `Historical Backtest Performance (${selectedStock?.symbol})`}
            </h3>

            {mode === 'history' && loadingHistory ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--tm)', gap: 8 }}>
                <div style={{ width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Fetching historical quotes…
              </div>
            ) : mode === 'history' && historyError ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--red)', textAlign: 'center', padding: 20 }}>
                {historyError}
              </div>
            ) : (
              <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.24}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCont" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--tm)" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="var(--tm)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,239,231,0.04)" />
                    <XAxis
                      dataKey="label"
                      stroke="var(--tm)"
                      fontSize={9}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--tm)"
                      fontSize={9}
                      tickLine={false}
                      tickFormatter={v => `₱${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        fontSize: 11
                      }}
                      labelStyle={{ fontWeight: 700, color: 'var(--tp)' }}
                      formatter={(value: any, name?: any) => [
                        `₱${parseFloat(value).toLocaleString()}`,
                        name === 'value' ? 'Portfolio Value' : 'Total Capital'
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="contributions"
                      stroke="var(--tm)"
                      strokeWidth={1}
                      fillOpacity={1}
                      fill="url(#colorCont)"
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorVal)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--ts)', justifyContent: 'center', marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 3, background: 'var(--tm)' }} />
                <span>Cum. Contributions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 3, background: 'var(--accent)' }} />
                <span>Portfolio Value</span>
              </div>
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
