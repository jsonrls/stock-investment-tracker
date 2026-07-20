'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { Stock } from '@/lib/api';
import { Info, HelpCircle, ArrowRightLeft, Percent, Calculator, TrendingUp } from 'lucide-react';

interface FeeDetails {
  gross: number;
  commission: number;
  vat: number;
  pseFee: number;
  sccp: number;
  salesTax: number;
  totalFees: number;
  netAmount: number;
}

export function BrokerFeeCalculator() {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [priceStr, setPriceStr] = useState('10.00');
  const [sharesStr, setSharesStr] = useState('1000');
  const [customCommRate, setCustomCommRate] = useState('0.25');
  const [targetSellPriceStr, setTargetSellPriceStr] = useState('11.00');

  // Interactive inputs converted
  const price = Math.max(0, parseFloat(priceStr) || 0);
  const shares = Math.max(0, parseInt(sharesStr, 10) || 0);
  const commRate = Math.max(0, parseFloat(customCommRate) || 0.25) / 100;
  const targetSellPrice = Math.max(0, parseFloat(targetSellPriceStr) || 0);

  // Buy Calculation
  const calculateBuy = (p: number, s: number, rate: number): FeeDetails => {
    const gross = p * s;
    if (gross <= 0) {
      return { gross: 0, commission: 0, vat: 0, pseFee: 0, sccp: 0, salesTax: 0, totalFees: 0, netAmount: 0 };
    }
    const commission = Math.max(gross * rate, 20); // PH Broker minimum fee is ₱20
    const vat = commission * 0.12; // 12% VAT on commission
    const pseFee = gross * 0.00005; // 0.005% PSE fee
    const sccp = gross * 0.0001; // 0.01% Clearing fee
    const salesTax = 0; // No transaction tax on buying
    const totalFees = commission + vat + pseFee + sccp + salesTax;
    const netAmount = gross + totalFees;
    return { gross, commission, vat, pseFee, sccp, salesTax, totalFees, netAmount };
  };

  // Sell Calculation
  const calculateSell = (p: number, s: number, rate: number): FeeDetails => {
    const gross = p * s;
    if (gross <= 0) {
      return { gross: 0, commission: 0, vat: 0, pseFee: 0, sccp: 0, salesTax: 0, totalFees: 0, netAmount: 0 };
    }
    const commission = Math.max(gross * rate, 20);
    const vat = commission * 0.12;
    const pseFee = gross * 0.00005;
    const sccp = gross * 0.0001;
    const salesTax = gross * 0.006; // 0.6% Stock Transaction Tax on selling
    const totalFees = commission + vat + pseFee + sccp + salesTax;
    const netAmount = gross - totalFees;
    return { gross, commission, vat, pseFee, sccp, salesTax, totalFees, netAmount };
  };

  const buyDetails = calculateBuy(price, shares, commRate);

  // Exact Analytical Break-Even Solver
  const solveBreakEven = (targetNet: number, s: number, rate: number): number => {
    if (s <= 0 || targetNet <= 0) return 0;
    
    // Attempt 1: Assuming commission exceeds minimum ₱20 (meaning Gross >= 8,000)
    // NetProceeds = Gross * (1 - rate - rate * 0.12 - 0.00005 - 0.0001 - 0.006)
    // Let rateMultiplier = 1 - (rate * 1.12 + 0.00615)
    // NetProceeds = s * P_sell * rateMultiplier
    // P_sell = targetNet / (s * rateMultiplier)
    const rateMultiplier = 1 - (rate * 1.12 + 0.00615);
    const p1 = targetNet / (s * rateMultiplier);
    
    if (p1 * s >= 8000) {
      return p1;
    }
    
    // Attempt 2: Commission hits minimum ₱20
    // Commission = 20, VAT = 2.4
    // NetProceeds = Gross - 22.40 - Gross * (0.00005 + 0.0001 + 0.006)
    // NetProceeds = Gross * 0.99385 - 22.40
    // Gross = (targetNet + 22.40) / 0.99385
    // P_sell = (targetNet + 22.40) / (s * 0.99385)
    const p2 = (targetNet + 22.40) / (s * 0.99385);
    return p2;
  };

  const breakEvenPrice = solveBreakEven(buyDetails.netAmount, shares, commRate);
  const breakEvenPercent = price > 0 ? ((breakEvenPrice - price) / price) * 100 : 0;

  // Target Sell Details
  const sellDetails = calculateSell(targetSellPrice, shares, commRate);
  const netProfit = sellDetails.netAmount - buyDetails.netAmount;
  const netProfitPercent = buyDetails.netAmount > 0 ? (netProfit / buyDetails.netAmount) * 100 : 0;

  // Handler when stock is selected from search
  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
    setPriceStr(stock.price.toString());
  };

  const formatCurrency = (n: number) => {
    return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="slide-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, pointerEvents: 'auto' }}>
      
      {/* ━━━━━━━━ LEFT: INPUTS & PARAMETERS ━━━━━━━━ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card panel-card editorial-panel" style={{ padding: '20px 22px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tp)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={18} style={{ color: 'var(--accent)' }} /> Broker Fee Calculator
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Stock Search Prefill */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Search PSE Stock (Auto-prefill)
              </label>
              <SearchBar onSelectStock={handleSelectStock} placeholder="Search for stock prices..." />
              {selectedStock && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, padding: '6px 12px', background: 'rgba(215,255,100,0.06)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--ts)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{selectedStock.symbol}</span>
                    <span>{selectedStock.name}</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tp)' }}>
                    ₱{formatCurrency(selectedStock.price)}
                  </div>
                </div>
              )}
            </div>

            {/* Price and Shares Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="buyPrice" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Buy Price (₱)
                </label>
                <input
                  id="buyPrice"
                  type="number"
                  step="any"
                  min="0"
                  value={priceStr}
                  onChange={e => setPriceStr(e.target.value)}
                  className="field"
                  style={{ padding: '8px 12px', fontSize: 13 }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="sharesCount" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Number of Shares
                </label>
                <input
                  id="sharesCount"
                  type="number"
                  min="0"
                  value={sharesStr}
                  onChange={e => setSharesStr(e.target.value)}
                  className="field"
                  style={{ padding: '8px 12px', fontSize: 13 }}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Custom Commission Rate */}
            <div>
              <label htmlFor="commRate" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Broker Commission Rate (%)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="commRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={customCommRate}
                  onChange={e => setCustomCommRate(e.target.value)}
                  className="field"
                  style={{ padding: '8px 32px 8px 12px', fontSize: 13 }}
                  placeholder="0.25"
                />
                <Percent size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tm)', pointerEvents: 'none' }} />
              </div>
              <span style={{ fontSize: 9, color: 'var(--tm)', marginTop: 4, display: 'block' }}>
                Standard rate is 0.25% (with minimum ₱20 per transaction).
              </span>
            </div>

            {/* Target Sell Price Input */}
            <div>
              <label htmlFor="targetSellPrice" style={{ fontSize: 10, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Target Sell Price (₱)
              </label>
              <input
                id="targetSellPrice"
                type="number"
                step="any"
                min="0"
                value={targetSellPriceStr}
                onChange={e => setTargetSellPriceStr(e.target.value)}
                className="field"
                style={{ padding: '8px 12px', fontSize: 13 }}
                placeholder="0.00"
              />
              <span style={{ fontSize: 9, color: 'var(--tm)', marginTop: 4, display: 'block' }}>
                Simulate potential returns by entering a custom sell price.
              </span>
            </div>
          </div>
        </div>

        {/* PH Broker Fees Breakdown Reference */}
        <div className="card panel-card" style={{ padding: '16px 20px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--tp)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={13} style={{ color: 'var(--accent)' }} /> PH Broker Fee Rates
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11, color: 'var(--ts)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(242,239,231,0.06)', paddingBottom: 6 }}>
              <span>Broker Commission</span>
              <span style={{ fontWeight: 650, color: 'var(--tp)' }}>0.25% of gross (min ₱20.00)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(242,239,231,0.06)', paddingBottom: 6 }}>
              <span>VAT</span>
              <span style={{ fontWeight: 650, color: 'var(--tp)' }}>12.00% of Broker Commission</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(242,239,231,0.06)', paddingBottom: 6 }}>
              <span>PSE Transaction Fee</span>
              <span style={{ fontWeight: 650, color: 'var(--tp)' }}>0.005% of gross amount</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(242,239,231,0.06)', paddingBottom: 6 }}>
              <span>SCCP Clearing Fee</span>
              <span style={{ fontWeight: 650, color: 'var(--tp)' }}>0.01% of gross amount</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 2 }}>
              <span>Sales Tax (Sell Transactions)</span>
              <span style={{ fontWeight: 650, color: 'var(--tp)' }}>0.60% of gross amount</span>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━ RIGHT: CALCULATIONS & INSIGHTS ━━━━━━━━ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Break-Even Insights Display Card */}
        <div className="card panel-card" style={{
          padding: '24px',
          background: 'linear-gradient(135deg, var(--surface2) 0%, rgba(215,255,100,0.03) 100%)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: 180
        }}>
          <div style={{ fontSize: 9, color: 'var(--tm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.11em', marginBottom: 4 }}>
            Break-Even Selling Price
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-inter)', letterSpacing: '-0.04em' }}>
            ₱{formatCurrency(breakEvenPrice)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ts)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Net Buying Cost:</span>
            <span style={{ fontWeight: 700, color: 'var(--tp)' }}>₱{formatCurrency(buyDetails.netAmount)}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ flex: '1 1 120px' }}>
              <div style={{ fontSize: 9, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Price Target Shift</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginTop: 2 }}>
                +{breakEvenPercent.toFixed(2)}%
              </div>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <div style={{ fontSize: 9, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Effective Cost / Sh.</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tp)', marginTop: 2 }}>
                ₱{formatCurrency(shares > 0 ? buyDetails.netAmount / shares : 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Buy & Sell Side-by-Side Detailed Breakdown */}
        <div className="card panel-card" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontSize: 12, fontWeight: 750, color: 'var(--tp)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowRightLeft size={14} style={{ color: 'var(--accent)' }} /> Detailed Fee Breakdown
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 8, fontSize: 11, color: 'var(--ts)' }}>
            {/* Headers */}
            <div style={{ fontWeight: 700, color: 'var(--tm)' }}>Fee / Component</div>
            <div style={{ fontWeight: 700, color: 'var(--tp)', textAlign: 'right' }}>Buy Transaction</div>
            <div style={{ fontWeight: 700, color: 'var(--tp)', textAlign: 'right' }}>Sell Transaction</div>

            {/* Rows */}
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0' }}>Gross Amount</div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0', textAlign: 'right', color: 'var(--tp)' }}>
              ₱{formatCurrency(buyDetails.gross)}
            </div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0', textAlign: 'right', color: 'var(--tp)' }}>
              ₱{formatCurrency(sellDetails.gross)}
            </div>

            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0' }}>
              Brokerage Comm.
              {buyDetails.gross > 0 && buyDetails.commission === 20 && (
                <span style={{ fontSize: 9, color: 'var(--gold)', display: 'block' }}>(₱20 Minimum applied)</span>
              )}
            </div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0', textAlign: 'right' }}>
              ₱{formatCurrency(buyDetails.commission)}
            </div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0', textAlign: 'right' }}>
              ₱{formatCurrency(sellDetails.commission)}
            </div>

            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0' }}>VAT (12% of Comm)</div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0', textAlign: 'right' }}>
              ₱{formatCurrency(buyDetails.vat)}
            </div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0', textAlign: 'right' }}>
              ₱{formatCurrency(sellDetails.vat)}
            </div>

            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0' }}>PSE Trans Fee (0.005%)</div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0', textAlign: 'right' }}>
              ₱{formatCurrency(buyDetails.pseFee)}
            </div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0', textAlign: 'right' }}>
              ₱{formatCurrency(sellDetails.pseFee)}
            </div>

            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0' }}>SCCP Clearing (0.01%)</div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0', textAlign: 'right' }}>
              ₱{formatCurrency(buyDetails.sccp)}
            </div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0', textAlign: 'right' }}>
              ₱{formatCurrency(sellDetails.sccp)}
            </div>

            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0' }}>Sales Tax (0.60%)</div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0', textAlign: 'right' }}>
              —
            </div>
            <div style={{ borderBottom: '1px solid rgba(242,239,231,0.04)', padding: '6px 0', textAlign: 'right' }}>
              ₱{formatCurrency(sellDetails.salesTax)}
            </div>

            {/* Total Fees */}
            <div style={{ borderBottom: '1px solid var(--border)', padding: '8px 0', fontWeight: 650, color: 'var(--tp)' }}>Total Fees & Taxes</div>
            <div style={{ borderBottom: '1px solid var(--border)', padding: '8px 0', textAlign: 'right', fontWeight: 650, color: 'var(--red)' }}>
              ₱{formatCurrency(buyDetails.totalFees)}
              <span style={{ fontSize: 9, display: 'block', color: 'var(--tm)' }}>
                ({buyDetails.gross > 0 ? ((buyDetails.totalFees / buyDetails.gross) * 100).toFixed(3) : 0}%)
              </span>
            </div>
            <div style={{ borderBottom: '1px solid var(--border)', padding: '8px 0', textAlign: 'right', fontWeight: 650, color: 'var(--red)' }}>
              ₱{formatCurrency(sellDetails.totalFees)}
              <span style={{ fontSize: 9, display: 'block', color: 'var(--tm)' }}>
                ({sellDetails.gross > 0 ? ((sellDetails.totalFees / sellDetails.gross) * 100).toFixed(3) : 0}%)
              </span>
            </div>

            {/* Net Amount */}
            <div style={{ padding: '8px 0', fontWeight: 800, color: 'var(--tp)' }}>Net Amount</div>
            <div style={{ padding: '8px 0', textAlign: 'right', fontWeight: 800, color: 'var(--accent)' }}>
              ₱{formatCurrency(buyDetails.netAmount)}
              <span style={{ fontSize: 9, display: 'block', color: 'var(--tm)', fontWeight: 400 }}>Total cash paid</span>
            </div>
            <div style={{ padding: '8px 0', textAlign: 'right', fontWeight: 800, color: 'var(--accent)' }}>
              ₱{formatCurrency(sellDetails.netAmount)}
              <span style={{ fontSize: 9, display: 'block', color: 'var(--tm)', fontWeight: 400 }}>Total cash received</span>
            </div>
          </div>
        </div>

        {/* Profit Simulation Output */}
        {shares > 0 && targetSellPrice > 0 && (
          <div className="card panel-card slide-in" style={{ padding: '20px 22px', borderLeft: `4px solid ${netProfit >= 0 ? 'var(--green)' : 'var(--red)'}` }}>
            <h3 style={{ fontSize: 12, fontWeight: 750, color: 'var(--tp)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} style={{ color: netProfit >= 0 ? 'var(--green)' : 'var(--red)' }} /> Return Projection
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--tm)' }}>PROJECTED NET PROFIT</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: netProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {netProfit >= 0 ? '+' : ''}₱{formatCurrency(netProfit)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--tm)' }}>ROI AFTER ALL FEES</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: netProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {netProfit >= 0 ? '+' : ''}{netProfitPercent.toFixed(2)}%
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--ts)', lineHeight: 1.5, background: 'var(--surface2)', padding: '8px 12px', borderRadius: 4 }}>
              If you buy at ₱{formatCurrency(price)} and sell at ₱{formatCurrency(targetSellPrice)}, you pay ₱{formatCurrency(buyDetails.totalFees)} in buying fees and ₱{formatCurrency(sellDetails.totalFees)} in selling fees, totaling ₱{formatCurrency(buyDetails.totalFees + sellDetails.totalFees)} in transaction costs.
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
