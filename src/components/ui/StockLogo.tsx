/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';

interface StockLogoProps {
  symbol: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function StockLogo({ symbol, size = 32, className, style }: StockLogoProps) {
  const [error, setError] = useState(false);

  // Generate a consistent color based on symbol
  const getFallbackColor = (sym: string) => {
    let hash = 0;
    for (let i = 0; i < sym.length; i++) {
      hash = sym.charCodeAt(i) + ((hash << 5) - hash);
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
    return colors[Math.abs(hash) % colors.length];
  };

  const cleanSymbol = symbol.trim().toUpperCase();

  if (error) {
    const bgColor = getFallbackColor(cleanSymbol);
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: Math.max(4, Math.floor(size * 0.28)),
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: Math.max(9, Math.floor(size * 0.35)),
          userSelect: 'none',
          flexShrink: 0,
          ...style,
        }}
      >
        {cleanSymbol.slice(0, 3)}
      </div>
    );
  }

  return (
    <img
      src={`/api/logo?symbol=${encodeURIComponent(cleanSymbol)}`}
      alt={`${cleanSymbol} logo`}
      onError={() => setError(true)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(4, Math.floor(size * 0.28)),
        objectFit: 'cover',
        background: 'var(--surface3)',
        border: '1px solid var(--border)',
        flexShrink: 0,
        ...style,
      }}
      className={className}
    />
  );
}
