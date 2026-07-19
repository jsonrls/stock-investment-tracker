'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceChangeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function PriceChange({ value, size = 'md', showIcon = true }: PriceChangeProps) {
  const isUp   = value > 0;
  const isDown = value < 0;
  const pillClass = isUp ? 'pill-up' : isDown ? 'pill-down' : 'pill-flat';
  const fontSize  = size === 'sm' ? 11 : size === 'lg' ? 15 : 12;
  const iconSize  = size === 'sm' ? 10 : 12;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <span
      className={pillClass}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', fontSize, fontWeight: 600, whiteSpace: 'nowrap' }}
    >
      {showIcon && <Icon size={iconSize} />}
      {isUp ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

interface PriceDisplayProps {
  price: number;
  currency?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function PriceDisplay({ price, currency = 'PHP', className = '', style }: PriceDisplayProps) {
  const formatted = new Intl.NumberFormat('en-PH', {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(price);
  return <span className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{formatted}</span>;
}

interface VolumeDisplayProps {
  volume: number;
  className?: string;
  style?: React.CSSProperties;
}

export function VolumeDisplay({ volume, className = '', style }: VolumeDisplayProps) {
  const formatted =
    volume >= 1_000_000 ? `${(volume / 1_000_000).toFixed(2)}M`
    : volume >= 1_000   ? `${(volume / 1_000).toFixed(1)}K`
    : volume.toLocaleString();
  return <span className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{formatted}</span>;
}
