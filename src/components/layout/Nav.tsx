'use client'

import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface NavProps {
  variant?: 'landing' | 'app' | 'minimal'
  pageName?: string
}

const APP_TABS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Send money', href: '/send' },
  { label: 'Create link', href: '/create' },
]

export function Nav({ variant = 'app' }: NavProps) {
  const { authenticated, logout } = usePrivy()
  const pathname = usePathname()
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
        /* Landing nav center links */
        .nav-center-links { display: flex; align-items: center; gap: 6px; flex: 1; justify-content: center; }
        .nav-center-links a { font-size: 14px; color: var(--ink3); text-decoration: none; font-weight: 500; transition: color .15s; padding: 5px 10px; border-radius: 8px; }
        .nav-center-links a:hover { color: var(--ink); }
        .nav-send-link { padding: 7px 14px; border-radius: 100px; border: 1px solid var(--border-g); color: var(--g1); font-size: 13px; font-weight: 500; text-decoration: none; white-space: nowrap; }
        .nav-create-link { padding: 7px 14px; border-radius: 100px; background: var(--g1); color: #fff; font-size: 13px; font-weight: 700; text-decoration: none; white-space: nowrap; }
        .nav-dash-link { padding: 7px 14px; border-radius: 100px; background: var(--g-soft); color: var(--g1); font-size: 12px; font-weight: 600; text-decoration: none; border: 1px solid var(--border-g); white-space: nowrap; }
        /* App nav — Uniswap-style tabs */
        .nav-tabs { display: flex; align-items: center; gap: 2px; flex: 1; padding-left: 16px; }
        .nav-tab { font-size: 15px; color: var(--ink3); text-decoration: none; font-weight: 500; padding: 6px 12px; border-radius: 10px; transition: all .15s; white-space: nowrap; }
        .nav-tab:hover { color: var(--ink); background: rgba(255,255,255,0.06); }
        .nav-tab.active { color: var(--ink); font-weight: 600; background: rgba(255,255,255,0.09); }
        /* Logout button */
        .nav-logout { padding: 6px 14px; border-radius: 100px; border: 1px solid var(--border); color: var(--ink3); font-size: 12px; font-weight: 500; cursor: pointer; background: transparent; font-family: var(--font); white-space: nowrap; }
        .nav-logout:hover { color: var(--ink); border-color: var(--ink3); }
        /* Arc badge */
        .nav-arc-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink3); white-space: nowrap; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        /* Mobile */
        @media(max-width: 640px) {
          .nav-center-links { display: none !important; }
          .nav-arc-badge { display: none !important; }
          .nav-send-link { display: none !important; }
          .nav-tab { font-size: 13px; padding: 5px 8px; }
          .nav-tabs { padding-left: 8px; gap: 0; }
          .nav-tab-dashboard { display: none !important; }
        }
      `}</style>
      <nav style={{
        position: 'sticky',
        top: hidden ? '-80px' : '0',
        zIndex: 100,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        background: 'rgba(9,9,14,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        transition: 'top 0.3s ease',
        gap: 0,
      }}>

        {/* Logo — always left */}
        <Link href="/" style={{
          fontSize: 20, fontWeight: 700, color: 'var(--ink)',
          letterSpacing: '-.04em', textDecoration: 'none', flexShrink: 0,
        }}>
          pay<span style={{ color: 'var(--g1)' }}>link</span>
        </Link>

        {/* Landing: centered section links */}
        {variant === 'landing' && (
          <div className="nav-center-links">
            {[{ label: 'How it works', href: '#how' }, { label: 'Fees', href: '#fees' }, { label: 'App', href: '#app' }].map(item => (
              <a key={item.label} href={item.href}>{item.label}</a>
            ))}
          </div>
        )}

        {/* App: Uniswap-style persistent tabs */}
        {variant === 'app' && (
          <div className="nav-tabs">
            {APP_TABS.map(tab => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`nav-tab${tab.href === '/dashboard' ? ' nav-tab-dashboard' : ''}${isActive ? ' active' : ''}`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        )}

        {/* Right-side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
          {variant === 'landing' ? (
            authenticated ? (
              <>
                <Link href="/dashboard" className="nav-dash-link">Dashboard</Link>
                <button onClick={logout} className="nav-logout" style={{ cursor: 'pointer' }}>Log out</button>
              </>
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
                <button onClick={logout} className="nav-logout">Log out</button>
              )}
            </>
          )}
        </div>
      </nav>
    </>
  )
}
