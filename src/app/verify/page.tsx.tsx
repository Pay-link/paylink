'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Nav } from '@/components/layout/Nav'

function VerifyContent() {
  const { authenticated, login, ready } = usePrivy()
  const router = useRouter()
  const params = useSearchParams()
  const flow = params.get('flow') || 'pay'
  const [otp, setOtp] = useState('')
  const [timer, setTimer] = useState(42)
  const [canResend, setCanResend] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400)
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { setCanResend(true); clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (ready && authenticated) {
      if (flow === 'create') router.push('/dashboard')
      else router.push('/success')
    }
  }, [ready, authenticated])

  const handleOtp = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 6)
    setOtp(raw)
    if (raw.length === 6) setTimeout(() => login(), 300)
  }

  return (
    <div style={{ background: 'var(--page)', minHeight: '100vh' }}>
      <Nav variant="app" />
      <div style={{ minHeight: 'calc(100vh - 62px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--g-soft)', border: '1.5px solid var(--border-g)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 16 }}>✉️</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', marginBottom: 6, textAlign: 'center' }}>Check your inbox</h1>
            <p style={{ fontSize: 15, color: 'var(--ink3)', textAlign: 'center', lineHeight: 1.6 }}>We sent a 6-digit verification code to your email or phone</p>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.06)', padding: '32px 36px', marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', marginBottom: 14, display: 'block' }}>Enter 6-digit code</label>

            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }} onClick={() => inputRef.current?.focus()}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 62, borderRadius: 14, cursor: 'text',
                  background: i < otp.length ? 'var(--g-soft)' : 'var(--page)',
                  border: `1.5px solid ${i === otp.length ? 'var(--g1)' : i < otp.length ? 'var(--g1)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700, color: i < otp.length ? 'var(--g1)' : 'var(--ink)',
                  boxShadow: i === otp.length ? '0 0 0 3px rgba(30,107,50,.08)' : 'none',
                }}>{otp[i] || ''}</div>
              ))}
            </div>

            <input ref={inputRef} type="tel" value={otp} onChange={e => handleOtp(e.target.value)} maxLength={6}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 20px', fontSize: 13, color: 'var(--ink3)' }}>
              <span>Resend in <strong style={{ color: 'var(--ink2)' }}>0:{timer.toString().padStart(2,'0')}</strong></span>
              <button disabled={!canResend} onClick={() => { setOtp(''); setTimer(42); setCanResend(false) }}
                style={{ color: canResend ? 'var(--g1)' : 'var(--ink3)', fontWeight: 500, cursor: canResend ? 'pointer' : 'default', background: 'none', border: 'none', fontFamily: 'var(--font)', fontSize: 13 }}>
                Resend code
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--g-soft)', border: '0.5px solid var(--border-g)', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>🛡</span>
              <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}>
                <strong>Your wallet is set up automatically.</strong> No MetaMask, no seed phrase. Powered by Privy — SOC 2 Type II certified.
              </div>
            </div>

            <button disabled={otp.length < 6} onClick={() => login()}
              style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '17px', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, cursor: otp.length < 6 ? 'not-allowed' : 'pointer', opacity: otp.length < 6 ? .4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14, boxShadow: '0 6px 20px rgba(30,107,50,.2)' }}>
              ✓ Verify & continue
            </button>
          </div>

          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink3)' }}>
            Wrong email or phone?{' '}
            <button onClick={() => router.back()} style={{ color: 'var(--g1)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13 }}>
              Go back and change it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  )
}
