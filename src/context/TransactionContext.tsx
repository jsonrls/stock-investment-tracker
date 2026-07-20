'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePortfolio } from '@/context/PortfolioContext';
import { api } from '@/lib/api';

export interface TransactionRecord {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  fees: number;
  date: string;
  notes?: string;
}

interface TransactionContextType {
  transactions: TransactionRecord[];
  addTransaction: (tx: Omit<TransactionRecord, 'id'>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  realizedGains: number;
}

const TransactionContext = createContext<TransactionContextType | null>(null);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { holdings, addHolding, updateHolding, removeHolding } = usePortfolio();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    if (authLoading) return;

    const storageKey = user ? `pse_transactions_${user.id}` : 'pse_transactions_anon';
    
    if (typeof window !== 'undefined') {
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        try {
          setTransactions(JSON.parse(localData));
        } catch (e) {
          console.error('Error parsing transactions from localStorage', e);
        }
      } else {
        setTransactions([]);
      }
    }
  }, [user, authLoading]);

  const saveTransactions = useCallback((data: TransactionRecord[]) => {
    const storageKey = user ? `pse_transactions_${user.id}` : 'pse_transactions_anon';
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [user]);

  const addTransaction = useCallback(async (tx: Omit<TransactionRecord, 'id'>) => {
    const id = 'tx_' + Math.random().toString(36).substring(2, 11);
    const newTx: TransactionRecord = {
      ...tx,
      id,
      symbol: tx.symbol.toUpperCase()
    };

    setTransactions(prev => {
      const updated = [newTx, ...prev];
      saveTransactions(updated);
      return updated;
    });

    // Auto-update portfolio holdings based on this transaction
    const existing = holdings.find(h => h.symbol.toUpperCase() === tx.symbol.toUpperCase());
    
    if (tx.type === 'BUY') {
      if (existing) {
        const newShares = existing.shares + tx.shares;
        const totalCost = (existing.shares * existing.avgPrice) + (tx.shares * tx.price) + tx.fees;
        const newAvgPrice = totalCost / newShares;
        await updateHolding(existing.symbol, newShares, newAvgPrice);
      } else {
        // Fetch stock details to get company name
        let name = tx.symbol.toUpperCase();
        try {
          const stockDetails = await api.getStock(tx.symbol.toUpperCase());
          name = stockDetails.name;
        } catch (e) {
          // fallback
        }
        const newAvgPrice = (tx.shares * tx.price + tx.fees) / tx.shares;
        await addHolding({
          symbol: tx.symbol.toUpperCase(),
          name,
          shares: tx.shares,
          avgPrice: newAvgPrice,
          category: 'Stock',
          isCustom: false
        });
      }
    } else if (tx.type === 'SELL') {
      if (existing) {
        const newShares = Math.max(0, existing.shares - tx.shares);
        if (newShares <= 0) {
          await removeHolding(existing.symbol);
        } else {
          // Selling shares does not modify average cost of remaining shares
          await updateHolding(existing.symbol, newShares, existing.avgPrice);
        }
      }
    }
  }, [holdings, addHolding, updateHolding, removeHolding, saveTransactions]);

  const removeTransaction = useCallback(async (id: string) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveTransactions(updated);
      return updated;
    });
  }, [saveTransactions]);

  // Derived state: total realized gains/losses from SELL transactions
  const realizedGains = React.useMemo(() => {
    let gains = 0;

    // Track BUYs to match cost basis when calculating profit on SELLs
    // To do this simply and accurately:
    // Process transactions chronologically to calculate the running average cost for each symbol
    const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const runningPortfolio: Record<string, { shares: number; totalCost: number }> = {};

    sortedTxs.forEach(tx => {
      const sym = tx.symbol.toUpperCase();
      if (!runningPortfolio[sym]) {
        runningPortfolio[sym] = { shares: 0, totalCost: 0 };
      }

      const pos = runningPortfolio[sym];

      if (tx.type === 'BUY') {
        pos.shares += tx.shares;
        pos.totalCost += (tx.shares * tx.price) + tx.fees;
      } else if (tx.type === 'SELL') {
        if (pos.shares > 0) {
          // Average cost of the shares before selling
          const avgCost = pos.totalCost / pos.shares;
          const soldCostBasis = tx.shares * avgCost;
          const netProceeds = (tx.shares * tx.price) - tx.fees;
          
          gains += (netProceeds - soldCostBasis);

          // Update running position
          pos.shares = Math.max(0, pos.shares - tx.shares);
          pos.totalCost = pos.shares * avgCost; // cost basis scales down proportionally
        } else {
          // Sold a position with no previous BUY logged (fallback calculation)
          const netProceeds = (tx.shares * tx.price) - tx.fees;
          gains += netProceeds - (tx.shares * tx.price); // just gains/losses on fees
        }
      }
    });

    return gains;
  }, [transactions]);

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, removeTransaction, realizedGains }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionProvider');
  return ctx;
}
