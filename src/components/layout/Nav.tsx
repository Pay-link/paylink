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
    <nav style={{
      position: 'sticky',
      top: hidden ? '-80px' : '0',
      zIndex: 100,
      height: 62,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
      padding: '0 5%',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      transition: 'top 0.3s ease',
    }}>
      <Link href="/" style={{
        fontSize: 21, fontWeight: 700, color: 'var(--ink)',
        letterSpacing: '-.04em', textDecoration: 'none',
      }}>
        pay<span style={{ color: 'var(--g1)' }}>link</span>
      </Link>

      {variant === 'landing' && (
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', alignItems: 'center' }}>
          {[{ label: 'How it works', href: '#how' }, { label: 'Fees', href: '#fees' }, { label: 'App', href: '#app' }].map(item => (
            <a key={item.label} href={item.href} style={{
              fontSize: 14, color: 'var(--ink3)', textDecoration: 'none',
              fontWeight: 500, transition: 'color .15s',
            }}>{item.label}</a>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {variant === 'landing' ? (
          authenticated ? (
            <Link href="/dashboard" style={{
              padding: '9px 20px', borderRadius: 100,
              background: 'var(--g1)', color: '#fff',
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}>Dashboard</Link>
          ) : (
            <>
              <Link href="/send" style={{
                padding: '9px 20px', borderRadius: 100,
                border: '1.5px solid var(--border-g)', color: 'var(--g1)',
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
              }}>Send money</Link>
              <Link href="/create" style={{
                padding: '9px 20px', borderRadius: 100,
                background: 'var(--ink)', color: '#fff',
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}>Create link</Link>
            </>
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink3)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g3)', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
              Arc Testnet
            </div>
            {authenticated && (
              <>
                <Link href="/dashboard" style={{
                  padding: '7px 16px', borderRadius: 100,
                  background: 'var(--g-soft)', color: 'var(--g1)',
                  fontSize: 13, fontWeight: 500, textDecoration: 'none',
                  border: '1px solid var(--border-g)',
                }}>Dashboard</Link>
                <button onClick={logout} style={{
                  padding: '7px 16px', borderRadius: 100,
                  border: '1px solid var(--border)', color: 'var(--ink3)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  background: 'transparent', fontFamily: 'var(--font)',
                }}>Log out</button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
