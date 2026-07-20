'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, Send, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

interface LoginBlockProps {
  title: string;
  description: string;
  features?: string[];
  noCard?: boolean;
  onSignInClick?: () => void;
}

export function LoginBlock({ title, description, features, noCard = false, onSignInClick }: LoginBlockProps) {
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
      className={noCard ? "" : "card"} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: noCard ? '24px 16px' : '48px 32px', 
        textAlign: 'center',
        maxWidth: noCard ? '100%' : 480,
        margin: noCard ? '0' : '24px auto',
        background: noCard ? 'transparent' : 'var(--surface)',
        border: noCard ? 'none' : '1px solid var(--border)',
        boxShadow: noCard ? 'none' : '0 8px 32px var(--shadow)',
        borderRadius: noCard ? 0 : 8,
        transition: 'all 0.3s ease',
        width: '100%'
      }}
    >
      {/* Icon Area */}
      <div 
        style={{ 
          width: 56, 
          height: 56, 
          borderRadius: '50%', 
          background: 'var(--aglow)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: 'var(--accent)', 
          marginBottom: 20,
          border: '1px solid var(--border2)',
          boxShadow: '0 0 16px var(--aglow)',
        }}
      >
        <Lock size={22} />
      </div>

      {sent ? (
        <div className="slide-in" style={{ width: '100%' }}>
          <CheckCircle2 size={44} style={{ color: 'var(--green)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tp)', marginBottom: 8 }}>
            Check your email
          </h3>
          <p style={{ fontSize: 13, color: 'var(--ts)', lineHeight: 1.5, marginBottom: 20 }}>
            We've sent a magic link to <strong style={{ color: 'var(--tp)' }}>{email}</strong>. Click it to log in instantly.
          </p>
        </div>
      ) : (
        <div className="slide-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--tp)', marginBottom: 8, letterSpacing: '-0.01em' }}>
              {title}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--ts)', lineHeight: 1.5, marginBottom: 12 }}>
              {description}
            </p>
          </div>

          {features && features.length > 0 && (
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: '0 auto 16px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 8, 
              textAlign: 'left',
              width: '100%',
              maxWidth: 320,
              fontSize: 12,
              color: 'var(--ts)'
            }}>
              {features.map((feat, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--green)', marginRight: 4 }}>✓</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          )}

          {onSignInClick ? (
            <button 
              type="button" 
              onClick={onSignInClick}
              className="btn-p" 
              style={{ 
                padding: '11px 0', 
                fontSize: 13, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 6,
                borderRadius: 4,
                width: '100%',
                fontWeight: 750
              }}
            >
              Sign In / Sign Up
            </button>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tm)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="field"
                  style={{ 
                    paddingLeft: 38, 
                    paddingRight: 12, 
                    paddingTop: 10, 
                    paddingBottom: 10, 
                    fontSize: 13,
                    borderRadius: 4
                  }}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.25)', borderRadius: 6, textAlign: 'left' }}>
                  <AlertCircle size={15} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 11, color: 'var(--red)', lineHeight: 1.3 }}>{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-p" 
                style={{ 
                  padding: '10px 0', 
                  fontSize: 12, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 6,
                  borderRadius: 4,
                  width: '100%'
                }} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                    Sending magic link…
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    Send Magic Link
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
