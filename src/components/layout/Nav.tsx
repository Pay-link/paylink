'use client'

import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'

interface NavProps {
  variant?: 'landing' | 'app' | 'minimal'
}

export function Nav({ variant = 'app' }: NavProps) {
  const { authenticated, logout } = usePrivy()
  const [hidden, setHidden] = useState(false)
  const [lastY, setLastY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      if (y > lastY && y > 80) setHidden(true)
      else setHidden(false)
      setLastY(y)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastY])

  return (
    <>
      <style>{`
        .nav-arc-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink3); }
        .nav-logout { padding: 6px 14px; border-radius: 100px; border: 1px solid var(--border); color: var(--ink3); font-size: 12px; font-weight: 500; cursor: pointer; background: transparent; font-family: var(--font); }
        .nav-dash-link { padding: 7px 14px; border-radius: 100px; background: var(--g-soft); color: var(--g1); font-size: 12px; font-weight: 600; text-decoration: none; border: 1px solid var(--border-g); white-space: nowrap; }
        .nav-send-link { padding: 7px 14px; border-radius: 100px; border: 1px solid var(--border-g); color: var(--g1); font-size: 13px; font-weight: 500; text-decoration: none; white-space: nowrap; }
        .nav-create-link { padding: 7px 14px; border-radius: 100px; background: var(--g1); color: #fff; font-size: 13px; font-weight: 700; text-decoration: none; white-space: nowrap; }
        @media(max-width: 640px) {
          .nav-arc-badge { display: none !important; }
          .nav-logout { display: none !important; }
          .nav-send-link { display: none !important; }
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
      `}</style>
      <nav style={{
        position: 'sticky',
        top: hidden ? '-80px' : '0',
        zIndex: 100,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: 'rgba(9,9,14,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        transition: 'top 0.3s ease',
        gap: 12,
      }}>
        <Link href="/" style={{
          fontSize: 20, fontWeight: 700, color: 'var(--ink)',
          letterSpacing: '-.04em', textDecoration: 'none', flexShrink: 0,
        }}>
          pay<span style={{ color: 'var(--g1)' }}>link</span>
        </Link>

        {variant === 'landing' && (
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'center', flex: 1 }} className="nav-arc-badge">
            {[{ label: 'How it works', href: '#how' }, { label: 'Fees', href: '#fees' }, { label: 'App', href: '#app' }].map(item => (
              <a key={item.label} href={item.href} style={{
                fontSize: 14, color: 'var(--ink3)', textDecoration: 'none',
                fontWeight: 500, transition: 'color .15s',
              }}>{item.label}</a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {variant === 'landing' ? (
            authenticated ? (
              <Link href="/dashboard" className="nav-dash-link">Dashboard</Link>
            ) : (
              <>
                <Link href="/send" className="nav-send-link">Send money</Link>
                <Link href="/create" className="nav-create-link">Create link</Link>
              </>
            )
          ) : (
            <>
              <div className="nav-arc-badge">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g3)', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite', flexShrink: 0 }} />
                Arc Testnet
              </div>
              {authenticated && (
                <>
                  <Link href="/dashboard" className="nav-dash-link">Dashboard</Link>
                  <button onClick={logout} className="nav-logout">Log out</button>
                </>
              )}
            </>
          )}
        </div>
      </nav>
    </>
  )
}
