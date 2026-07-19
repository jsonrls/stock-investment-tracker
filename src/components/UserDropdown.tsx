'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePortfolio } from '@/context/PortfolioContext';
import { useTheme } from '@/context/ThemeContext';
import { User as UserIcon, LogOut, ChevronDown, BookOpen, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

export function UserDropdown() {
  const { user, signOut } = useAuth();
  const { holdings, watchlist } = usePortfolio();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const email = user.email || '';
  const username = email.split('@')[0] || 'Investor';
  const firstLetter = username.charAt(0).toUpperCase();

  // Color generator based on email hash
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#30372a', '#557f1d', '#7f8d3c', '#9a7117', '#76584a', '#c44f3e', '#47766a', '#6f745f'];
  const avatarBg = colors[Math.abs(hash) % colors.length];

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 99,
          padding: '4px 12px 4px 4px',
          cursor: 'pointer',
          color: 'var(--tp)',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--border2)';
          e.currentTarget.style.boxShadow = '0 8px 20px var(--shadow)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Avatar Circle */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: avatarBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 12,
            userSelect: 'none',
          }}
        >
          {firstLetter}
        </div>
        
        {/* Username */}
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts)' }}>
          {username}
        </span>
        
        <ChevronDown 
          size={14} 
          style={{ 
            color: 'var(--tm)', 
            transform: isOpen ? 'rotate(180deg)' : 'none', 
            transition: 'transform 0.2s ease' 
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="slide-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 260,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            boxShadow: '0 18px 50px var(--shadow)',
            zIndex: 1000,
            padding: '12px 8px 8px 8px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 12px 8px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: avatarBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 15,
                boxShadow: '0 0 10px rgba(0,0,0,0.15)',
              }}
            >
              {firstLetter}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tp)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {username}
              </span>
              <span style={{ fontSize: 10, color: 'var(--tm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {email}
              </span>
              <span 
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 4,
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 2,
                  background: 'var(--surface2)',
                  color: 'var(--tp)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Standard Account
              </span>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 4px 8px 4px' }} />

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '0 4px 10px 4px' }}>
            <div style={{ background: 'var(--surface2)', padding: '6px 8px', borderRadius: 2, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--tm)' }}>Holdings</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--tp)', marginTop: 2 }}>{holdings.length}</div>
            </div>
            <div style={{ background: 'var(--surface2)', padding: '6px 8px', borderRadius: 2, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--tm)' }}>Watchlist</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--tp)', marginTop: 2 }}>{watchlist.length}</div>
            </div>
          </div>

          {/* Links / Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 2,
                color: 'var(--ts)',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 600,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface2)';
                e.currentTarget.style.color = 'var(--tp)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--ts)';
              }}
            >
              <UserIcon size={14} style={{ color: 'var(--accent)' }} />
              Account Settings
            </Link>

            <a
              href="https://pse-market-data-api.vercel.app/docs"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 2,
                color: 'var(--ts)',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 600,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface2)';
                e.currentTarget.style.color = 'var(--tp)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--ts)';
              }}
            >
              <BookOpen size={14} style={{ color: 'var(--accent)' }} />
              API Documentation
            </a>

            <button
              onClick={() => toggleTheme()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 10px',
                borderRadius: 2,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ts)',
                fontSize: 12,
                fontWeight: 600,
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface2)';
                e.currentTarget.style.color = 'var(--tp)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--ts)';
              }}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={14} style={{ color: 'var(--gold)' }} />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={14} style={{ color: 'var(--accent)' }} />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '8px 4px 8px 4px' }} />

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
                borderRadius: 2,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--red)',
              fontSize: 12,
              fontWeight: 600,
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,91,91,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <LogOut size={14} />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
