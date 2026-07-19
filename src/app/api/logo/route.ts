import { NextRequest } from 'next/server';

const FAST_MAP: Record<string, string> = {
  BDO: 'bdo.com.ph',
  SM: 'sminvestments.com',
  ALI: 'ayalaland.com.ph',
  TEL: 'pldt.com',
  GLO: 'globe.com.ph',
  AC: 'ayala.com.ph',
  MER: 'meralco.com.ph',
  PGOLD: 'puregold.com.ph',
  JFC: 'jollibee.com.ph',
  URC: 'urc.com.ph',
  BPI: 'bpi.com.ph',
  MBT: 'metrobank.com.ph',
  ICT: 'ictsi.com',
  SECB: 'securitybank.com',
  MONDE: 'mondenissin.com',
  CNVRG: 'convergeict.com',
  DITO: 'ditotelecommunity.ph',
  SMPH: 'smprime.com',
  MEG: 'megaworldcorp.com',
  DMC: 'dmcinet.com',
  SCC: 'semirarampc.com',
  LTG: 'ltg.com.ph',
  GTCAP: 'gtcapital.com.ph',
  NIKL: 'nickelasia.com',
  AP: 'aboitizpower.com',
  AEV: 'aboitiz.com',
  FLI: 'filinvestland.com',
  GMA7: 'gmanetwork.com',
  WLCON: 'wilcon.com.ph',
};

function extractDomain(urlStr: string): string | null {
  try {
    if (!urlStr) return null;
    let clean = urlStr.trim().toLowerCase();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://' + clean;
    }
    const url = new URL(clean);
    let hostname = url.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return hostname;
  } catch {
    return null;
  }
}

function getFallbackResponse(symbol: string) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#6381ff', // blue
    '#4f6bff', // indigo
    '#00d67a', // green
    '#ff9f43', // orange
    '#a55eea', // purple
    '#ff5b5b', // red
    '#00b894', // teal
    '#e1b12c', // yellow/gold
  ];
  const color = colors[Math.abs(hash) % colors.length];
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="28" fill="${color}" />
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="34" fill="#ffffff">${symbol.toUpperCase().slice(0, 3)}</text>
  </svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}

interface SearchResult {
  symbol?: string;
  name?: string;
  website?: string;
  exchange?: string | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get('symbol');

  if (!rawSymbol) {
    return new Response('Missing symbol parameter', { status: 400 });
  }

  const symbol = rawSymbol.trim().toUpperCase();

  // 1. Check fast lookup map
  if (FAST_MAP[symbol]) {
    return Response.redirect(`https://cdn.tickerlogos.com/${FAST_MAP[symbol]}`, 307);
  }

  try {
    let companyName = '';
    
    // 2. Query our proxy API to get the full company name
    try {
      const quoteRes = await fetch(`https://pse-market-data-api.vercel.app/api/v1/stocks/${symbol}`, {
        next: { revalidate: 3600 }
      });
      if (quoteRes.ok) {
        const quoteData = await quoteRes.json();
        if (quoteData && quoteData.name) {
          companyName = quoteData.name;
        }
      }
    } catch (err) {
      console.error('Failed to fetch stock name from PSE API:', err);
    }

    // 3. Search logos by company name
    if (companyName) {
      const searchRes = await fetch(`https://www.allinvestview.com/api/logo-search/?q=${encodeURIComponent(companyName)}`);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData && searchData.results && searchData.results.length > 0) {
          // Find first entry with a website domain
          const match = (searchData.results as SearchResult[]).find((r) => r.website);
          if (match && match.website) {
            const domain = extractDomain(match.website);
            if (domain) {
              return Response.redirect(`https://cdn.tickerlogos.com/${domain}`, 307);
            }
          }
        }
      }
    }

    // 4. Fallback search by ticker symbol
    const tickerSearchRes = await fetch(`https://www.allinvestview.com/api/logo-search/?q=${encodeURIComponent(symbol)}`);
    if (tickerSearchRes.ok) {
      const tickerSearchData = await tickerSearchRes.json();
      if (tickerSearchData && tickerSearchData.results && tickerSearchData.results.length > 0) {
        // Find best match with website
        const matches = (tickerSearchData.results as SearchResult[]).filter((r) => r.website);
        if (matches.length > 0) {
          // Look for matching symbol first
          const symbolMatch = matches.find((r) => 
            r.symbol?.split('.')[0]?.toUpperCase() === symbol
          ) || matches[0];
          
          if (symbolMatch && symbolMatch.website) {
            const domain = extractDomain(symbolMatch.website);
            if (domain) {
              return Response.redirect(`https://cdn.tickerlogos.com/${domain}`, 307);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Logo resolution failed:', err);
  }

  // 5. Render beautiful dynamic SVG icon as ultimate fallback
  return getFallbackResponse(symbol);
}
