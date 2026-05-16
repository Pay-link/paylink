'use client'

import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'

interface NavProps {
  variant?: 'landing' | 'app' | 'minimal'
  pageName?: string
}

const APP_TABS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'ph:squares-four-bold' },
  { label: 'Send money', href: '/send', icon: 'ph:paper-plane-right-bold' },
  { label: 'Create link', href: '/create', icon: 'ph:link-bold' },
]

const LANDING_LINKS = [
  { label: 'How it works', href: '#how', icon: 'ph:info-bold' },
  { label: 'Fees', href: '#fees', icon: 'ph:percent-bold' },
  { label: 'App', href: '#app', icon: 'ph:device-mobile-bold' },
]

export function Nav({ variant = 'app' }: NavProps) {
  const { authenticated, logout } = usePrivy()
  const pathname = usePathname()
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const lastYRef = useRef(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('zp-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('zp-theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  // Hide nav on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      if (y > lastYRef.current && y > 80) setHidden(true)
      else setHidden(false)
      lastYRef.current = y
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on outside tap
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

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
        /* Theme toggle */
        .nav-theme-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--ink3); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px; transition: all .15s; flex-shrink: 0; }
        .nav-theme-btn:hover { color: var(--ink); border-color: var(--ink3); background: var(--g-soft); }
        /* Arc badge */
        .nav-arc-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink3); white-space: nowrap; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        /* Hamburger button — hidden on desktop */
        .nav-hamburger { display: none; }
        /* Mobile drawer */
        .nav-drawer { display: none; }
        /* Tablet + mobile */
        @media(max-width: 768px) {
          .nav-center-links { display: none !important; }
          .nav-arc-badge { display: none !important; }
          .nav-send-link { display: none !important; }
          .nav-tabs { display: none !important; }
          .nav-logout { display: none !important; }
          .nav-dash-link { display: none !important; }
          .nav-create-link { display: none !important; }
          .nav-hamburger {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px; height: 38px;
            border-radius: 10px;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--ink);
            cursor: pointer;
            font-size: 20px;
            flex-shrink: 0;
          }
          .nav-drawer {
            display: block;
            position: fixed;
            top: 56px;
            left: 0; right: 0;
            background: rgba(9,9,14,0.97);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border-bottom: 1px solid var(--border);
            z-index: 99;
            padding: 12px 16px 20px;
            transform: translateY(-110%);
            opacity: 0;
            transition: transform 0.25s cubic-bezier(.4,0,.2,1), opacity 0.2s ease;
            pointer-events: none;
          }
          .nav-drawer.open {
            transform: translateY(0);
            opacity: 1;
            pointer-events: all;
          }
          .nav-drawer-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 13px 14px;
            border-radius: 14px;
            text-decoration: none;
            color: var(--ink2);
            font-size: 15px;
            font-weight: 500;
            transition: background .15s, color .15s;
            margin-bottom: 4px;
          }
          .nav-drawer-item:hover, .nav-drawer-item.active {
            background: rgba(255,255,255,0.06);
            color: var(--ink);
          }
          .nav-drawer-item.active {
            color: var(--g1);
            background: var(--g-soft);
          }
          .nav-drawer-icon {
            width: 34px; height: 34px;
            border-radius: 10px;
            background: var(--page);
            border: 1px solid var(--border);
            display: flex; align-items: center; justify-content: center;
            font-size: 16px;
            color: var(--ink3);
            flex-shrink: 0;
          }
          .nav-drawer-item.active .nav-drawer-icon {
            background: var(--g-soft);
            border-color: var(--border-g);
            color: var(--g1);
          }
          .nav-drawer-section-lbl {
            font-size: 10px;
            font-weight: 700;
            color: var(--ink4);
            letter-spacing: .08em;
            text-transform: uppercase;
            padding: 4px 14px 6px;
          }
          .nav-drawer-divider {
            height: 1px;
            background: var(--border);
            margin: 8px 0 12px;
          }
          .nav-drawer-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 11px;
            color: var(--g1);
            background: var(--g-soft);
            border: 1px solid var(--border-g);
            padding: 4px 10px;
            border-radius: 20px;
            margin: 4px 14px 8px;
          }
          .nav-drawer-logout {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 13px 14px;
            border-radius: 14px;
            color: #E57373;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            background: transparent;
            border: none;
            font-family: var(--font);
            width: 100%;
            text-align: left;
            transition: background .15s;
            margin-top: 4px;
          }
          .nav-drawer-logout:hover { background: rgba(229,115,115,0.08); }
          .nav-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 98;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
          }
          .nav-overlay.open { opacity: 1; pointer-events: all; }
        }
        @media(min-width: 769px) {
          .nav-overlay { display: none !important; }
        }
        /* Light theme overrides for nav */
        [data-theme="light"] .zp-nav {
          background: rgba(242,244,250,0.95) !important;
          border-bottom-color: rgba(0,0,0,0.08) !important;
        }
        [data-theme="light"] .nav-tab { color: var(--ink3); }
        [data-theme="light"] .nav-tab:hover { color: var(--ink); background: rgba(0,0,0,0.05); }
        [data-theme="light"] .nav-tab.active { color: var(--ink); background: rgba(0,0,0,0.07); }
        [data-theme="light"] .nav-arc-badge { color: var(--ink3); }
        [data-theme="light"] .nav-logout { color: var(--ink3); border-color: var(--border); }
        [data-theme="light"] .nav-logout:hover { color: var(--ink); }
        [data-theme="light"] .nav-theme-btn { color: var(--ink3); border-color: var(--border); }
        [data-theme="light"] .nav-hamburger { color: var(--ink); border-color: var(--border); }
        [data-theme="light"] .nav-drawer {
          background: rgba(242,244,250,0.98);
          border-bottom-color: rgba(0,0,0,0.08);
        }
        [data-theme="light"] .nav-drawer-item { color: var(--ink3); }
        [data-theme="light"] .nav-drawer-item:hover { background: rgba(0,0,0,0.04); color: var(--ink); }
        [data-theme="light"] .nav-drawer-item.active { background: var(--g-soft); color: var(--g1); }
        [data-theme="light"] .nav-drawer-icon { background: var(--page2); border-color: var(--border); color: var(--ink3); }
        [data-theme="light"] .nav-drawer-section-lbl { color: var(--ink4); }
        [data-theme="light"] .nav-drawer-divider { background: var(--border); }
        [data-theme="light"] .nav-drawer-badge { color: var(--g1); background: var(--g-soft); border-color: var(--border-g); }
        [data-theme="light"] .nav-overlay { background: rgba(0,0,0,0.3); }
      `}</style>

      {/* Backdrop overlay */}
      <div
        className={`nav-overlay${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      <div ref={menuRef}>
        <nav className="zp-nav" style={{
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
          transition: 'top 0.3s ease, background 0.25s ease',
          gap: 0,
        }}>

          {/* Logo — always left */}
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 7,
            fontSize: 20, fontWeight: 700, color: 'var(--ink)',
            letterSpacing: '-.04em', textDecoration: 'none', flexShrink: 0,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/zapay-icon.svg" alt="" aria-hidden="true" width={26} height={26} style={{ display: 'block', flexShrink: 0 }} />
            za<span style={{ color: 'var(--g1)' }}>pay</span>
          </Link>

          {/* Landing: centered section links (desktop only) */}
          {variant === 'landing' && (
            <div className="nav-center-links">
              {LANDING_LINKS.map(item => (
                <a key={item.label} href={item.href}>{item.label}</a>
              ))}
            </div>
          )}

          {/* App: Uniswap-style persistent tabs (desktop only) */}
          {variant === 'app' && (
            <div className="nav-tabs">
              {APP_TABS.map(tab => {
                const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`nav-tab${isActive ? ' active' : ''}`}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right-side actions (desktop) */}
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

            {/* Theme toggle — always visible */}
            <button
              className="nav-theme-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <Icon icon={theme === 'dark' ? 'ph:sun-bold' : 'ph:moon-bold'} />
            </button>

            {/* Hamburger button — mobile only */}
            <button
              className="nav-hamburger"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <Icon icon={menuOpen ? 'ph:x-bold' : 'ph:list-bold'} />
            </button>
          </div>
        </nav>

        {/* Mobile slide-down drawer */}
        <div className={`nav-drawer${menuOpen ? ' open' : ''}`}>

          {variant === 'landing' && (
            <>
              {LANDING_LINKS.map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  className="nav-drawer-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="nav-drawer-icon">
                    <Icon icon={item.icon} />
                  </span>
                  {item.label}
                </a>
              ))}
              <div className="nav-drawer-divider" />
              {authenticated ? (
                <>
                  <Link href="/dashboard" className="nav-drawer-item" onClick={() => setMenuOpen(false)}>
                    <span className="nav-drawer-icon"><Icon icon="ph:squares-four-bold" /></span>
                    Dashboard
                  </Link>
                  <button className="nav-drawer-logout" onClick={() => { logout(); setMenuOpen(false) }}>
                    <span className="nav-drawer-icon" style={{ color: '#E57373', borderColor: 'rgba(229,115,115,.3)', background: 'rgba(229,115,115,.08)' }}>
                      <Icon icon="ph:sign-out-bold" />
                    </span>
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/send" className="nav-drawer-item" onClick={() => setMenuOpen(false)}>
                    <span className="nav-drawer-icon"><Icon icon="ph:paper-plane-right-bold" /></span>
                    Send money
                  </Link>
                  <Link href="/create" className="nav-drawer-item" onClick={() => setMenuOpen(false)}
                    style={{ background: 'var(--g-soft)', border: '1px solid var(--border-g)' }}>
                    <span className="nav-drawer-icon" style={{ background: 'var(--g1)', border: 'none', color: '#fff' }}>
                      <Icon icon="ph:link-bold" />
                    </span>
                    <span style={{ color: 'var(--g1)', fontWeight: 700 }}>Create a payment link</span>
                  </Link>
                </>
              )}
            </>
          )}

          {variant === 'app' && (
            <>
              {/* Main nav — mirrors desktop sidebar */}
              <div className="nav-drawer-section-lbl">Main</div>
              {APP_TABS.map(tab => {
                const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`nav-drawer-item${isActive ? ' active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="nav-drawer-icon">
                      <Icon icon={tab.icon} />
                    </span>
                    {tab.label}
                  </Link>
                )
              })}
              <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="nav-drawer-item" onClick={() => setMenuOpen(false)}>
                <span className="nav-drawer-icon"><Icon icon="ph:drop-bold" /></span>
                Faucet
              </a>

              {/* Account section */}
              <div className="nav-drawer-section-lbl" style={{ marginTop: 8 }}>Account</div>
              {[
                { label: 'Transaction history', icon: 'ph:clock-countdown-bold', href: '#' },
                { label: 'My links', icon: 'ph:link-simple-bold', href: '#' },
                { label: 'Bank settings', icon: 'ph:bank-bold', href: '/bank-setup' },
                { label: 'Settings', icon: 'ph:gear-six-bold', href: '#' },
                { label: 'Help & support', icon: 'ph:question-bold', href: '#' },
              ].map(item => (
                <Link key={item.label} href={item.href} className="nav-drawer-item" onClick={() => setMenuOpen(false)}>
                  <span className="nav-drawer-icon"><Icon icon={item.icon} /></span>
                  {item.label}
                </Link>
              ))}

              <div className="nav-drawer-divider" />
              <div className="nav-drawer-badge">
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--g3)', display: 'inline-block' }} />
                Arc Testnet — test funds only
              </div>
              {authenticated && (
                <button className="nav-drawer-logout" onClick={() => { logout(); setMenuOpen(false) }}>
                  <span className="nav-drawer-icon" style={{ color: '#E57373', borderColor: 'rgba(229,115,115,.3)', background: 'rgba(229,115,115,.08)' }}>
                    <Icon icon="ph:sign-out-bold" />
                  </span>
                  Log out
                </button>
              )}
            </>
          )}

          {variant === 'minimal' && (
            <>
              <a href="/" className="nav-drawer-item" onClick={() => setMenuOpen(false)}>
                <span className="nav-drawer-icon"><Icon icon="ph:house-bold" /></span>
                Home
              </a>
              {authenticated ? (
                <>
                  <Link href="/dashboard" className="nav-drawer-item" onClick={() => setMenuOpen(false)}>
                    <span className="nav-drawer-icon"><Icon icon="ph:squares-four-bold" /></span>
                    Dashboard
                  </Link>
                  <div className="nav-drawer-divider" />
                  <button className="nav-drawer-logout" onClick={() => { logout(); setMenuOpen(false) }}>
                    <span className="nav-drawer-icon" style={{ color: '#E57373', borderColor: 'rgba(229,115,115,.3)', background: 'rgba(229,115,115,.08)' }}>
                      <Icon icon="ph:sign-out-bold" />
                    </span>
                    Log out
                  </button>
                </>
              ) : (
                <Link href="/create" className="nav-drawer-item" onClick={() => setMenuOpen(false)}
                  style={{ background: 'var(--g-soft)', border: '1px solid var(--border-g)' }}>
                  <span className="nav-drawer-icon" style={{ background: 'var(--g1)', border: 'none', color: '#fff' }}>
                    <Icon icon="ph:link-bold" />
                  </span>
                  <span style={{ color: 'var(--g1)', fontWeight: 700 }}>Create a payment link</span>
                </Link>
              )}
            </>
          )}

        </div>
      </div>
    </>
  )
}
