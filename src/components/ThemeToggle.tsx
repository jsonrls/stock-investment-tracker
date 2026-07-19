'use client';

import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 99,
        border: 'none',
        background: 'var(--surface3)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      {/* Track */}
      <div
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: theme === 'dark' ? 'rgba(215,255,100,0.16)' : 'rgba(17,19,15,0.08)',
          border: `1px solid ${theme === 'dark' ? 'rgba(215,255,100,0.42)' : 'rgba(17,19,15,0.28)'}`,
          position: 'relative',
          transition: 'all 0.3s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 2,
          left: theme === 'dark' ? 2 : 16,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: theme === 'dark' ? '#d7ff64' : '#11130f',
          transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1), background 0.3s',
          boxShadow: `0 1px 4px ${theme === 'dark' ? 'rgba(215,255,100,0.3)' : 'rgba(17,19,15,0.25)'}`,
        }} />
      </div>
      {theme === 'dark'
        ? <Moon size={13} style={{ color: '#d7ff64' }} />
        : <Sun  size={13} style={{ color: 'var(--gold)' }} />
      }
    </button>
  );
}
