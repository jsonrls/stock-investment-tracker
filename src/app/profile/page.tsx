'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePortfolio } from '@/context/PortfolioContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Shield, Trash2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import Image from 'next/image';

export default function ProfilePage() {
  const { user } = useAuth();
  const { holdings, watchlist, initialInvestment, updateInitialInvestment, removeHolding, removeFromWatchlist } = usePortfolio();
  const router = useRouter();

  const [capitalInput, setCapitalInput] = useState('');
  const [currency, setCurrency] = useState('PHP');
  const [refreshInterval, setRefreshInterval] = useState('60');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCapitalInput(String(initialInvestment));
  }, [initialInvestment]);

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--tp)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 20, height: 20, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <span>Redirecting to home…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const email = user.email || '';
  const username = email.split('@')[0] || 'Investor';
  const firstLetter = username.charAt(0).toUpperCase();

  // Create avatar gradient background
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#30372a', '#557f1d', '#7f8d3c', '#9a7117', '#76584a', '#c44f3e', '#47766a', '#6f745f'];
  const avatarBg = colors[Math.abs(hash) % colors.length];

  const handleSaveCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);
    try {
      const val = parseFloat(capitalInput);
      if (isNaN(val) || val < 0) {
        throw new Error('Please enter a valid positive capital amount');
      }
      await updateInitialInvestment(val);
      setMessage({ text: 'Investment capital updated successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update capital';
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetData = async () => {
    setIsUpdating(true);
    try {
      // 1. Remove all holdings
      for (const h of holdings) {
        await removeHolding(h.symbol);
      }
      // 2. Remove all watchlist items
      for (const w of watchlist) {
        await removeFromWatchlist(w, true);
      }
      // 3. Reset investment capital to 0
      await updateInitialInvestment(0);

      setMessage({ text: 'All portfolio data has been successfully reset.', type: 'success' });
      setShowConfirmReset(false);
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ text: 'Failed to reset portfolio data', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown Date';

  return (
    <div className="app-shell profile-shell" style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s ease' }}>

      {/* Ambient background blur blobs */}
      <div className="app-grain" aria-hidden="true" />

      {/* Header */}
      <header className="app-header" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--header-bg)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--border)', transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16, height: 64 }}>
          <Link href="/" className="app-brand profile-brand" aria-label="Trackfolio home">
            <span className="app-logo-wrap">
              <Image src="/logo.png" alt="" width={48} height={48} priority />
            </span>
            <span className="app-brand-name">Trackfolio</span>
          </Link>
          <span className="profile-header-rule" />
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--ts)', fontSize: 13, fontWeight: 600, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ts)'}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div style={{ flex: 1 }} />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1, padding: '32px 24px 60px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>

          <section className="profile-page-heading">
            <span>Investor profile</span>
            <h1>Account &amp; preferences.</h1>
            <p>Manage your portfolio settings, identity, and stored investment data.</p>
          </section>

          {message && (
            <div
              style={{
                background: message.type === 'success' ? 'rgba(0,214,122,0.12)' : 'rgba(255,71,87,0.12)',
                border: `1px solid ${message.type === 'success' ? 'rgba(0,214,122,0.3)' : 'rgba(255,71,87,0.3)'}`,
                color: message.type === 'success' ? 'var(--green)' : 'var(--red)',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{message.type === 'success' ? '✓' : '⚠'}</span>
              {message.text}
            </div>
          )}

          {/* Profile Content Grid */}
          <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 24 }}>

            {/* Left Column: Account Details & Overview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Profile Card */}
              <div className="card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: avatarBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 28,
                    boxShadow: '0 0 20px rgba(0,0,0,0.2)',
                    marginBottom: 16,
                  }}
                >
                  {firstLetter}
                </div>

                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--tp)', margin: '0 0 4px 0' }}>{username}</h2>
                <div style={{ fontSize: 12, color: 'var(--tm)', wordBreak: 'break-all', marginBottom: 12 }}>{email}</div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span className="profile-status" style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active Client
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: 'rgba(0,214,122,0.12)', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Standard Plan
                  </span>
                </div>

                <div style={{ height: 1, width: '100%', background: 'var(--border)', margin: '20px 0' }} />

                {/* Extra Metadata details */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--ts)' }}>
                    <Calendar size={14} style={{ color: 'var(--tm)', flexShrink: 0 }} />
                    <span>Member Since: <strong style={{ color: 'var(--tp)' }}>{formattedDate}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--ts)' }}>
                    <Shield size={14} style={{ color: 'var(--tm)', flexShrink: 0 }} />
                    <span>Verified: <strong style={{ color: 'var(--green)' }}>Yes</strong></span>
                  </div>
                </div>
              </div>

              {/* Statistics Panel */}
              <div className="card" style={{ padding: '20px 24px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--tm)', marginBottom: 16 }}>
                  Portfolio Activity
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: 'var(--ts)' }}>Total Holdings</span>
                    <strong style={{ color: 'var(--tp)' }}>{holdings.length} symbols</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: 'var(--ts)' }}>Watchlist Tickers</span>
                    <strong style={{ color: 'var(--tp)' }}>{watchlist.length} watched</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: 'var(--ts)' }}>Capital Settings</span>
                    <strong style={{ color: 'var(--tp)' }}>₱{initialInvestment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Preferences, Investment Capital Form, and Danger Zone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Preferences Configuration */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--tm)', marginBottom: 20 }}>
                  App Preferences
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Currency Format */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts)' }}>Currency Representation</label>
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="field"
                      style={{ width: '100%', padding: 9, background: 'var(--surface2)', color: 'var(--tp)', border: '1px solid var(--border)', borderRadius: 10, outline: 'none' }}
                    >
                      <option value="PHP">Philippine Peso (₱ / PHP)</option>
                      <option value="USD">US Dollar ($ / USD)</option>
                      <option value="EUR">Euro (€ / EUR)</option>
                    </select>
                  </div>

                  {/* Refresh Rate */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts)' }}>Quote Refresh Rate</label>
                    <select
                      value={refreshInterval}
                      onChange={e => setRefreshInterval(e.target.value)}
                      className="field"
                      style={{ width: '100%', padding: 9, background: 'var(--surface2)', color: 'var(--tp)', border: '1px solid var(--border)', borderRadius: 10, outline: 'none' }}
                    >
                      <option value="30">Real-time (30 Seconds)</option>
                      <option value="60">Standard (1 Minute)</option>
                      <option value="300">Relaxed (5 Minutes)</option>
                      <option value="0">Manual Refresh Only</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Capital Setup Form */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--tm)', marginBottom: 16 }}>
                  Initial Funding Capital
                </h3>
                <form onSubmit={handleSaveCapital} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, color: 'var(--ts)' }}>Initial Investment Amount (PHP)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={capitalInput}
                      onChange={e => setCapitalInput(e.target.value)}
                      className="field"
                      style={{ width: '100%', padding: 9, background: 'var(--surface2)', color: 'var(--tp)', border: '1px solid var(--border)', borderRadius: 10, outline: 'none' }}
                      placeholder="e.g. 100000"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="btn-p"
                    style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: 12, height: 'auto', opacity: isUpdating ? 0.7 : 1 }}
                  >
                    {isUpdating ? 'Saving…' : 'Save Investment Capital'}
                  </button>
                </form>
              </div>

              {/* Danger Zone */}
              <div className="card" style={{ padding: '24px', borderColor: 'rgba(255,71,87,0.3)' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--red)', marginBottom: 12 }}>
                  Danger Zone
                </h3>
                <p style={{ fontSize: 12, color: 'var(--ts)', lineHeight: 1.5, marginBottom: 16 }}>
                  Resetting your portfolio will permanently erase all custom holdings, synced stock positions, initial investment capital, and your active watchlist. This action is irreversible.
                </p>

                {showConfirmReset ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={handleResetData}
                      disabled={isUpdating}
                      className="btn-p"
                      style={{ background: 'var(--red)', color: '#fff', border: 'none', padding: '8px 16px', fontSize: 12, height: 'auto' }}
                    >
                      {isUpdating ? 'Resetting…' : 'Yes, Permanently Delete All'}
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      disabled={isUpdating}
                      className="btn-s"
                      style={{ padding: '8px 16px', fontSize: 12, height: 'auto' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255,71,87,0.1)',
                      border: '1px solid rgba(255,71,87,0.3)',
                      color: 'var(--red)',
                      borderRadius: 10,
                      padding: '8px 16px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,71,87,0.1)'}
                  >
                    <Trash2 size={13} />
                    Reset All Portfolio Data
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* Styles for grid responsiveness */}
      <style>{`
        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
}
