'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface DividendRecord {
  id: string;
  symbol: string;
  amountPerShare: number;
  paymentDate: string;
  sharesOwned: number;
  totalAmount: number;
  type: 'Cash' | 'Stock';
}

interface DividendContextType {
  dividends: DividendRecord[];
  addDividend: (record: Omit<DividendRecord, 'id' | 'totalAmount'>) => Promise<void>;
  removeDividend: (id: string) => Promise<void>;
}

const DividendContext = createContext<DividendContextType | null>(null);

export function DividendProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [dividends, setDividends] = useState<DividendRecord[]>([]);

  useEffect(() => {
    if (authLoading) return;

    // Local storage key based on user authentication status
    const storageKey = user ? `pse_dividends_${user.id}` : 'pse_dividends_anon';
    
    if (typeof window !== 'undefined') {
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        try {
          setDividends(JSON.parse(localData));
        } catch (e) {
          console.error('Error parsing dividends from localStorage', e);
        }
      } else {
        setDividends([]);
      }
    }
  }, [user, authLoading]);

  const saveDividends = useCallback((data: DividendRecord[]) => {
    const storageKey = user ? `pse_dividends_${user.id}` : 'pse_dividends_anon';
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [user]);

  const addDividend = useCallback(async (record: Omit<DividendRecord, 'id' | 'totalAmount'>) => {
    const id = 'div_' + Math.random().toString(36).substring(2, 11);
    const totalAmount = record.amountPerShare * record.sharesOwned;
    const newRecord: DividendRecord = {
      ...record,
      id,
      totalAmount
    };

    setDividends(prev => {
      const updated = [newRecord, ...prev];
      saveDividends(updated);
      return updated;
    });
  }, [saveDividends]);

  const removeDividend = useCallback(async (id: string) => {
    setDividends(prev => {
      const updated = prev.filter(d => d.id !== id);
      saveDividends(updated);
      return updated;
    });
  }, [saveDividends]);

  return (
    <DividendContext.Provider value={{ dividends, addDividend, removeDividend }}>
      {children}
    </DividendContext.Provider>
  );
}

export function useDividends() {
  const ctx = useContext(DividendContext);
  if (!ctx) throw new Error('useDividends must be used within DividendProvider');
  return ctx;
}
