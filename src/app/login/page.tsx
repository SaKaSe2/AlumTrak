"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        setError('Akses ditolak. Kredensial tidak valid.');
      }
    } catch {
      setError('Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decor */}
      <div style={{position:'absolute',top:'-20%',left:'-10%',width:'50vw',height:'50vw',background:'radial-gradient(circle, rgba(196,248,42,0.03) 0%, transparent 70%)',zIndex:0}} />
      <div style={{position:'absolute',bottom:'-20%',right:'-10%',width:'60vw',height:'60vw',background:'radial-gradient(circle, rgba(52,211,153,0.02) 0%, transparent 70%)',zIndex:0}} />

      {/* Login Box */}
      <div className="card" style={{ maxWidth: '400px', width: '100%', zIndex: 1, border: '1px solid var(--border-accent)', background: 'linear-gradient(180deg, rgba(15,15,18,0.95) 0%, rgba(10,10,12,0.98) 100%)', boxShadow: '0 24px 64px -12px rgba(196,248,42,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px 0' }}>
            Alumni <span style={{ color: 'var(--accent)' }}>Trace</span>
          </h1>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AUTHORIZED PERSONNEL ONLY // SYSTEM v2.0</div>
        </div>

        <form onSubmit={handleLogin} className="form-grid">
          <div>
            <label style={{ fontSize: '11px', letterSpacing: '0.05em' }}>USERNAME</label>
            <input 
              type="text" 
              placeholder="Enter system ID" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-lighter)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text)',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', letterSpacing: '0.05em' }}>PASSPHRASE</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-lighter)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text)',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            />
          </div>

          {error && (
            <div className="mono" style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '11px', textAlign: 'center' }}>
              [ERROR] {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn" 
            disabled={loading || !username || !password}
            style={{ width: '100%', marginTop: '12px', padding: '14px', fontSize: '14px', letterSpacing: '0.05em', fontWeight: 600 }}
          >
            {loading ? 'AUTHENTICATING...' : 'INITIALIZE SESSION'}
          </button>
        </form>

        <div className="mono" style={{ textAlign: 'center', marginTop: '32px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <div>PROTECTED SYSTEM</div>
          <div style={{ opacity: 0.5 }}>UNIVERSITAS MUHAMMADIYAH MALANG</div>
        </div>
      </div>
    </div>
  );
}
