'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface PortfolioHolding {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  category: string;
  isCustom: boolean;
}

interface PortfolioContextType {
  holdings: PortfolioHolding[];
  addHolding: (holding: PortfolioHolding) => Promise<void>;
  removeHolding: (symbol: string) => Promise<void>;
  updateHolding: (symbol: string, shares: number, avgPrice: number, category?: string) => Promise<void>;
  initialInvestment: number;
  updateInitialInvestment: (val: number) => Promise<void>;
  watchlist: string[];
  addToWatchlist: (symbol: string, bypassConfirm?: boolean) => Promise<void>;
  removeFromWatchlist: (symbol: string, bypassConfirm?: boolean) => Promise<void>;
  isInWatchlist: (symbol: string) => boolean;
  isSyncing: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

function getOrCreateSessionId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('pse_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('pse_session_id', id);
  }
  return id;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [initialInvestment, setInitialInvestment] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(isSupabaseConfigured);
  const [activeId, setActiveId] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Fetch data when user auth status stabilizes or changes
  useEffect(() => {
    if (authLoading) return;

    // Use user.id if logged in, otherwise fallback to anonymous session_id
    const currentId = user ? user.id : getOrCreateSessionId();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveId(currentId);

    // Load local initial investment and watchlist immediately
    if (typeof window !== 'undefined') {
      const localInit = localStorage.getItem('pse_initial_investment');
      if (localInit) setInitialInvestment(Number(localInit));

      const localWatch = localStorage.getItem('pse_watchlist');
      if (localWatch) {
        try {
          setWatchlist(JSON.parse(localWatch));
        } catch {
          // ignore
        }
      }
    }

    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      setIsSyncing(false);
      return;
    }

    const fetchData = async () => {
      setIsSyncing(true);
      try {
        // Fetch holdings
        const { data: holdingsData, error: holdingsError } = await client
          .from('portfolio_holdings')
          .select('symbol, name, shares, avg_price, category, is_custom')
          .eq('session_id', currentId);

        if (holdingsError) {
          throw new Error(holdingsError.message || JSON.stringify(holdingsError));
        }

        if (holdingsData) {
          setHoldings(
            holdingsData.map((h: { symbol: string; name: string; shares: number; avg_price: number; category?: string; is_custom?: boolean }) => ({
              symbol: h.symbol,
              name: h.name,
              shares: Number(h.shares),
              avgPrice: Number(h.avg_price),
              category: h.category || 'Stock',
              isCustom: Boolean(h.is_custom),
            }))
          );
        } else {
          setHoldings([]);
        }

        // Fetch settings
        const { data: settingsData, error: settingsError } = await client
          .from('portfolio_settings')
          .select('initial_investment')
          .eq('session_id', currentId)
          .maybeSingle();

        if (settingsError) {
          throw new Error(settingsError.message || JSON.stringify(settingsError));
        }

        if (settingsData) {
          setInitialInvestment(Number(settingsData.initial_investment));
          localStorage.setItem('pse_initial_investment', String(settingsData.initial_investment));
        }

        // Fetch watchlist
        const { data: watchlistData, error: watchlistError } = await client
          .from('watchlist')
          .select('symbol')
          .eq('session_id', currentId);

        if (watchlistError) {
          throw new Error(watchlistError.message || JSON.stringify(watchlistError));
        }

        if (watchlistData) {
          const symbols = watchlistData.map((w: { symbol: string }) => w.symbol);
          setWatchlist(symbols);
          localStorage.setItem('pse_watchlist', JSON.stringify(symbols));
        } else {
          setWatchlist([]);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Error fetching data';
        console.error('Error fetching data from Supabase:', errMsg);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  const addHolding = useCallback(async (holding: PortfolioHolding) => {
    let updatedHoldings: PortfolioHolding[] = [];
    
    setHoldings(prev => {
      const exists = prev.find(h => h.symbol === holding.symbol);
      if (exists) {
        updatedHoldings = prev.map(h =>
          h.symbol === holding.symbol
            ? { ...h, shares: h.shares + holding.shares, avgPrice: holding.avgPrice, category: holding.category, isCustom: holding.isCustom }
            : h
        );
      } else {
        updatedHoldings = [...prev, holding];
      }
      return updatedHoldings;
    });

    const client = supabase;
    if (isSupabaseConfigured && client && activeId) {
      try {
        const target = updatedHoldings.find(h => h.symbol === holding.symbol) || holding;
        const { error } = await client
          .from('portfolio_holdings')
          .upsert({
            session_id: activeId,
            symbol: target.symbol,
            name: target.name,
            shares: target.shares,
            avg_price: target.avgPrice,
            category: target.category,
            is_custom: target.isCustom,
          }, { onConflict: 'session_id,symbol' });

        if (error) {
          throw new Error(error.message || JSON.stringify(error));
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('Error adding holding to Supabase:', errMsg);
      }
    }
  }, [activeId]);

  const removeHolding = useCallback(async (symbol: string) => {
    setHoldings(prev => prev.filter(h => h.symbol !== symbol));

    const client = supabase;
    if (isSupabaseConfigured && client && activeId) {
      try {
        const { error } = await client
          .from('portfolio_holdings')
          .delete()
          .eq('session_id', activeId)
          .eq('symbol', symbol);

        if (error) {
          throw new Error(error.message || JSON.stringify(error));
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('Error removing holding from Supabase:', errMsg);
      }
    }
  }, [activeId]);

  const updateHolding = useCallback(async (symbol: string, shares: number, avgPrice: number, category?: string) => {
    setHoldings(prev =>
      prev.map(h => (h.symbol === symbol ? { ...h, shares, avgPrice, category: category || h.category } : h))
    );

    const client = supabase;
    if (isSupabaseConfigured && client && activeId) {
      try {
        const updateData: { shares: number; avg_price: number; category?: string } = { shares, avg_price: avgPrice };
        if (category) updateData.category = category;
        const { error } = await client
          .from('portfolio_holdings')
          .update(updateData)
          .eq('session_id', activeId)
          .eq('symbol', symbol);

        if (error) {
          throw new Error(error.message || JSON.stringify(error));
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('Error updating holding in Supabase:', errMsg);
      }
    }
  }, [activeId]);

  const updateInitialInvestment = useCallback(async (val: number) => {
    setInitialInvestment(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pse_initial_investment', String(val));
    }

    const client = supabase;
    if (isSupabaseConfigured && client && activeId) {
      try {
        const { error } = await client
          .from('portfolio_settings')
          .upsert({
            session_id: activeId,
            initial_investment: val,
          }, { onConflict: 'session_id' });

        if (error) {
          throw new Error(error.message || JSON.stringify(error));
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('Error updating initial investment in Supabase:', errMsg);
      }
    }
  }, [activeId]);

  const addToWatchlist = useCallback(async (symbol: string, bypassConfirm?: boolean) => {
    const action = async () => {
      setWatchlist(prev => {
        const updated = prev.includes(symbol) ? prev : [...prev, symbol];
        if (typeof window !== 'undefined') {
          localStorage.setItem('pse_watchlist', JSON.stringify(updated));
        }
        return updated;
      });

      const client = supabase;
      if (isSupabaseConfigured && client && activeId) {
        try {
          const { error } = await client
            .from('watchlist')
            .upsert({
              session_id: activeId,
              symbol,
            }, { onConflict: 'session_id,symbol' });

          if (error) {
            throw new Error(error.message || JSON.stringify(error));
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Error adding to watchlist';
          console.error('Error adding to watchlist in Supabase:', errMsg);
        }
      }
    };

    if (bypassConfirm) {
      await action();
    } else {
      return new Promise<void>((resolve) => {
        setConfirmDialog({
          isOpen: true,
          title: 'Add to Watchlist',
          message: `Are you sure you want to add ${symbol} to your watchlist?`,
          onConfirm: async () => {
            await action();
            resolve();
          },
          onCancel: () => {
            resolve();
          }
        });
      });
    }
  }, [activeId]);

  const removeFromWatchlist = useCallback(async (symbol: string, bypassConfirm?: boolean) => {
    const action = async () => {
      setWatchlist(prev => {
        const updated = prev.filter(s => s !== symbol);
        if (typeof window !== 'undefined') {
          localStorage.setItem('pse_watchlist', JSON.stringify(updated));
        }
        return updated;
      });

      const client = supabase;
      if (isSupabaseConfigured && client && activeId) {
        try {
          const { error } = await client
            .from('watchlist')
            .delete()
            .eq('session_id', activeId)
            .eq('symbol', symbol);

          if (error) {
            throw new Error(error.message || JSON.stringify(error));
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Error removing from watchlist';
          console.error('Error removing from watchlist in Supabase:', errMsg);
        }
      }
    };

    if (bypassConfirm) {
      await action();
    } else {
      return new Promise<void>((resolve) => {
        setConfirmDialog({
          isOpen: true,
          title: 'Remove from Watchlist',
          message: `Are you sure you want to remove ${symbol} from your watchlist?`,
          onConfirm: async () => {
            await action();
            resolve();
          },
          onCancel: () => {
            resolve();
          }
        });
      });
    }
  }, [activeId]);

  const isInWatchlist = useCallback(
    (symbol: string) => watchlist.includes(symbol),
    [watchlist]
  );

  return (
    <PortfolioContext.Provider value={{
      holdings, addHolding, removeHolding, updateHolding,
      initialInvestment, updateInitialInvestment,
      watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist,
      isSyncing,
    }}>
      {children}
      {confirmDialog && confirmDialog.isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            confirmDialog.onCancel();
            setConfirmDialog(null);
          }
        }}>
          <div className="card slide-in modal-card" style={{ width: '100%', maxWidth: 360, padding: 24, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tp)', margin: 0 }}>{confirmDialog.title}</h3>
            <p style={{ fontSize: 12, color: 'var(--tm)', marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => {
                  confirmDialog.onCancel();
                  setConfirmDialog(null);
                }}
                className="btn-s"
                style={{ padding: '8px 14px', fontSize: 11, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="btn-p"
                style={{ padding: '8px 14px', fontSize: 11, cursor: 'pointer' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
