'use client'

import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'

interface NavProps {
  variant?: 'landing' | 'app' | 'minimal'
}

export function Nav({ variant = 'app' }: NavProps) {
  const { authenticated, logout } = usePrivy()

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: 62, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <Link href="/" style={{
        fontSize: 21, fontWeight: 700, color: 'var(--ink)',
        letterSpacing: '-0.04em', textDecoration: 'none',
      }}>
        pay<span style={{ color: 'var(--g1)' }}>link</span>
      </Link>

      {variant === 'landing' && (
        <div style={{ display: 'flex', gap: 28 }}>
          {['How it works', 'Features', 'Fees', 'App'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} style={{
              fontSize: 14, color: 'var(--ink3)', textDecoration: 'none',
              fontWeight: 500, transition: 'color 0.15s',
            }}>
              {item}
            </a>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href="#" style={{ fontSize: 13, color: 'var(--ink3)', textDecoration: 'none' }}>
          Help
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink3)' }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--g3)',
            display: 'inline-block', animation: 'pulse 2s ease-in-out infinite',
          }} />
          Secured · Powered by Arc
        </div>
        {authenticated && (
          <button onClick={logout} style={{
            padding: '8px 18px', borderRadius: 100, fontSize: 13,
            fontWeight: 500, cursor: 'pointer', background: 'transparent',
            border: '1px solid var(--border)', color: 'var(--ink2)',
          }}>
            Log out
          </button>
        )}
      </div>
    </nav>
  )
}
