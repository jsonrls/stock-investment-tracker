import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnon);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnon!)
  : null;

// ─── Typed DB row shapes ──────────────────────────────────────────────────────

export interface HoldingRow {
  id: string;
  session_id: string;
  symbol: string;
  name: string;
  shares: number;
  avg_price: number;
  category: string;
  is_custom: boolean;
  created_at: string;
}

export interface WatchlistRow {
  id: string;
  session_id: string;
  symbol: string;
  created_at: string;
}
