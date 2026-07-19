# PSE Portfolio Tracker

A responsive investment dashboard for monitoring Philippine Stock Exchange (PSE) securities, tracking portfolio performance, and maintaining a watchlist.

The application uses the public [PSE Market Data API](https://pse-market-data-api.vercel.app) for quotes and historical prices. Supabase integration is optional and adds persistent holdings, watchlists, settings, and passwordless authentication.

## Features

- Browse and search PSE-listed securities
- View market summaries, gainers, losers, and active stocks
- Inspect historical prices with configurable chart periods and chart styles
- Track shares, average cost, allocation, cash, and profit or loss
- Group holdings by stock, REIT, ETF, cash, or a custom category
- Maintain a personal watchlist
- Generate downloadable or shareable portfolio performance cards
- Use the dashboard in light or dark mode
- Sign in through a Supabase email magic link to sync data across devices
- Use a responsive layout designed for desktop and mobile screens

## Tech Stack

- [Next.js 16](https://nextjs.org/) with the App Router
- [React 19](https://react.dev/) and TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) for PostgreSQL persistence and authentication
- [Recharts](https://recharts.org/) for portfolio and price charts
- [Lucide React](https://lucide.dev/) for icons

## Prerequisites

- Node.js 20.9 or later
- npm
- A Supabase project if you want persistence and authentication

## Getting Started

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. To enable persistence and authentication, add your Supabase project values to `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   Find both values under **Supabase Dashboard → Project Settings → API**. Do not expose the service-role key in browser code; it is not required by the current application.

4. If you configured Supabase, open its SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql). For email magic-link sign-in, also add `http://localhost:3000` to the allowed redirect URLs in your Supabase authentication settings.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

The dashboard can run without Supabase for exploring market data. Supabase is needed for durable portfolio storage, watchlist synchronization, account settings, and email authentication.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Public URL of the Supabase project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anonymous/public browser key. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Reserved for server-side operations; the current app does not use it. Never expose it to the browser. |
| `NEXT_PUBLIC_PSE_API_BASE_URL` | No | Reserved market-data endpoint setting. The current API client uses the public PSE Market Data API directly. |

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint. |

## Project Structure

```text
src/
├── app/                  # App Router pages, layout, styles, and API routes
├── components/           # Dashboard, market, portfolio, and shared UI
├── context/              # Authentication, portfolio, and theme state
└── lib/                  # Market-data API and Supabase clients
supabase/
└── schema.sql            # Tables, indexes, and row-level security policies
public/                   # Static images and icons
```

## Production

Create and run a production build locally with:

```bash
npm run build
npm run start
```

When deploying, configure the same public Supabase environment variables in the hosting provider and add the production origin to the Supabase authentication redirect URLs.

## Data Disclaimer

Market data is supplied by a third-party API and may be delayed or end-of-day. This project is intended for portfolio monitoring and educational use only; it does not provide investment advice.
