-- ============================================================
--  PSE Portfolio Tracker — Supabase Database Schema
--  Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────────
--  portfolio_holdings
--  Tracks each user's stock positions (identified by session_id)
-- ──────────────────────────────────────────────────────────────
create table if not exists portfolio_holdings (
  id          uuid        primary key default gen_random_uuid(),
  session_id  text        not null,          -- anonymous browser session
  symbol      text        not null,
  name        text        not null,
  shares      numeric     not null check (shares > 0),
  avg_price   numeric     not null check (avg_price > 0),
  category    text        not null default 'Stock',
  is_custom   boolean     not null default false,
  created_at  timestamptz not null default now(),

  unique (session_id, symbol)                -- one position per symbol per session
);

-- Index for fast per-session lookups
create index if not exists idx_holdings_session
  on portfolio_holdings (session_id);

-- ──────────────────────────────────────────────────────────────
--  portfolio_settings
--  Tracks each user's portfolio settings (e.g., initial investment)
-- ──────────────────────────────────────────────────────────────
create table if not exists portfolio_settings (
  session_id          text        primary key,
  initial_investment  numeric     not null default 0,
  created_at          timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
--  watchlist
--  Tracks each user's watched symbols
-- ──────────────────────────────────────────────────────────────
create table if not exists watchlist (
  id          uuid        primary key default gen_random_uuid(),
  session_id  text        not null,
  symbol      text        not null,
  created_at  timestamptz not null default now(),

  unique (session_id, symbol)
);

create index if not exists idx_watchlist_session
  on watchlist (session_id);

-- ──────────────────────────────────────────────────────────────
--  Row Level Security (RLS) Policies
-- ──────────────────────────────────────────────────────────────

-- Enable RLS
alter table portfolio_holdings enable row level security;
alter table watchlist enable row level security;
alter table portfolio_settings enable row level security;

-- Holdings Policies
create policy "Allow users to manage their own holdings" on portfolio_holdings
  for all to public using ((auth.uid())::text = session_id) with check ((auth.uid())::text = session_id);

create policy "Allow anonymous users to manage holdings" on portfolio_holdings
  for all to public using (session_id like 'sess_%') with check (session_id like 'sess_%');

-- Watchlist Policies
create policy "Allow users to manage their own watchlist" on watchlist
  for all to public using ((auth.uid())::text = session_id) with check ((auth.uid())::text = session_id);

create policy "Allow anonymous users to manage watchlist" on watchlist
  for all to public using (session_id like 'sess_%') with check (session_id like 'sess_%');

-- Settings Policies
create policy "Allow users to manage their own settings" on portfolio_settings
  for all to public using ((auth.uid())::text = session_id) with check ((auth.uid())::text = session_id);

create policy "Allow anonymous users to manage settings" on portfolio_settings
  for all to public using (session_id like 'sess_%') with check (session_id like 'sess_%');

