'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { error: err } = await signInWithMagicLink(email.trim());
      if (err) throw err;
      setSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to send magic link. Please check your config.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="card slide-in modal-card" style={{ width: '100%', maxWidth: 400, padding: 28, position: 'relative' }}>
        {/* Close Button */}
        <button onClick={onClose} style={{ position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tm)', padding: 4, borderRadius: 8 }}>
          <X size={18} />
        </button>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--green)', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tp)', marginBottom: 8 }}>Check your inbox!</h2>
            <p style={{ fontSize: 13, color: 'var(--ts)', lineHeight: 1.5, marginBottom: 24 }}>
              We sent a login magic link to <strong style={{ color: 'var(--tp)' }}>{email}</strong>. Click the link inside the email to login instantly.
            </p>
            <button onClick={onClose} className="btn-p" style={{ width: '100%', padding: '11px 0', fontSize: 13 }}>
              Okay, got it
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,129,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <Mail size={16} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tp)' }}>Sign In / Sign Up</h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ts)', marginBottom: 24, lineHeight: 1.4 }}>
              Enter your email to receive a passwordless magic link to log in and sync your portfolio across all your devices.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--tm)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--tm)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="field"
                    style={{ paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, fontSize: 13 }}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.25)', borderRadius: 8 }}>
                  <AlertCircle size={15} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 11, color: 'var(--red)', lineHeight: 1.3 }}>{error}</span>
                </div>
              )}

              <button type="submit" className="btn-p" style={{ padding: '11px 0', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                    Sending link…
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Send Magic Link
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
