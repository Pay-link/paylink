'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

function VerifyContent() {
  const { authenticated, login, ready, user } = usePrivy()
  const router = useRouter()
  const params = useSearchParams()
  const flow = params.get('flow') || 'pay'
  const amount = params.get('amount') || ''
  const to = params.get('to') || ''
  const contact = params.get('contact') || ''
  const note = params.get('note') || ''

  const [otp, setOtp] = useState('')
  const [timer, setTimer] = useState(42)
  const [canResend, setCanResend] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const buildSuccessUrl = async (userId: string, displayName: string, userEmail: string | null) => {
    const base = new URLSearchParams({ flow, amount, to, contact, note })
    if (flow === 'claim') {
      try {
        const res = await fetch('/api/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: userId,
            senderName: displayName,
            senderEmail: userEmail,
            recipientEmail: contact || to,
            amount: parseFloat(amount),
            note,
          }),
        })
        const json = await res.json()
        if (json.token) base.set('claim_token', json.token)
      } catch (err) {
        console.error('Failed to create claim:', err)
      }
    }
    return `/success?${base.toString()}`
  }

  useEffect(() => {
    // If already authenticated, show confirm instead of auto-redirecting
    if (ready && authenticated) {
      setShowConfirm(true)
      return
    }
    setTimeout(() => inputRef.current?.focus(), 400)
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { setCanResend(true); clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [ready, authenticated])

  // After login completes via OTP
  useEffect(() => {
    if (ready && authenticated && verifying && user) {
      const userEmail = user.email?.address || null
      const userName = userEmail?.split('@')[0] || user.phone?.number || 'Someone'
      buildSuccessUrl(user.id, userName, userEmail).then(url => router.push(url))
    }
  }, [ready, authenticated, verifying, user])

  const handleVerify = async () => {
    setVerifying(true)
    try {
      await login()
    } catch (err) {
      console.error(err)
      setVerifying(false)
    }
  }

  const handleOtp = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 6)
    setOtp(raw)
    if (raw.length === 6) setTimeout(handleVerify, 300)
  }

  // Already authenticated — show confirmation screen
  if (showConfirm) {
    return (
      <div style={{ background: 'var(--page)', minHeight: '100vh' }}>
        <nav style={{ height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5%', background: 'rgba(9,9,14,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
          <a href="/" style={{ fontSize: 21, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', textDecoration: 'none' }}>
            pay<span style={{ color: 'var(--g1)' }}>link</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink3)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g3)', display: 'inline-block' }} />
            Arc Testnet
          </div>
        </nav>
        <div style={{ minHeight: 'calc(100vh - 62px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--g-soft)', border: '1.5px solid var(--border-g)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 16, color: 'var(--g1)' }}>
                <Icon icon="ph:shield-check-bold" />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', marginBottom: 6, textAlign: 'center' }}>Confirm payment</h1>
              <p style={{ fontSize: 15, color: 'var(--ink3)', textAlign: 'center', lineHeight: 1.6 }}>You're already verified. Review the details before sending.</p>
            </div>
            <div style={{ background: 'var(--white)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.4)', padding: '28px 32px', marginBottom: 16 }}>
              {amount && (
                <div style={{ textAlign: 'center', padding: '16px 0 20px', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>You are sending</div>
                  <div style={{ fontSize: 52, fontWeight: 700, color: 'var(--g1)', letterSpacing: '-.05em' }}>${amount}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 4 }}>{amount} USDC · Arc Network · $0 gas</div>
                </div>
              )}
              {[
                { key: 'To', val: to || contact || 'Recipient' },
                { key: 'Note', val: note || 'No note' },
                { key: 'Gas fee', val: '$0.00', green: true },
                { key: 'Settlement', val: '<1 second', green: true },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 14, color: 'var(--ink3)' }}>{row.key}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: (row as any).green ? 'var(--g1)' : 'var(--ink)' }}>{row.val}</span>
                </div>
              ))}
              <button
                onClick={async () => {
                  const userEmail = user?.email?.address || null
                  const userName = userEmail?.split('@')[0] || user?.phone?.number || 'Someone'
                  const url = await buildSuccessUrl(user?.id || '', userName, userEmail)
                  router.push(url)
                }}
                style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '17px', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, marginBottom: 12, boxShadow: '0 6px 20px rgba(255,107,0,.28)' }}>
                <Icon icon="ph:paper-plane-right-bold" /> Confirm & send{amount ? ` $${amount}` : ''}
              </button>
              <button onClick={() => router.back()}
                style={{ width: '100%', background: 'transparent', color: 'var(--ink3)', border: '1.5px solid var(--border)', borderRadius: 100, padding: '13px', fontFamily: 'var(--font)', fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--page)', minHeight: '100vh' }}>
      <nav style={{ height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5%', background: 'rgba(9,9,14,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <a href="/" style={{ fontSize: 21, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', textDecoration: 'none' }}>
          pay<span style={{ color: 'var(--g1)' }}>link</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink3)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g3)', display: 'inline-block' }} />
          Arc Testnet
        </div>
      </nav>

      <div className="verify-wrap" style={{ minHeight: 'calc(100vh - 62px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--g-soft)', border: '1.5px solid var(--border-g)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 16, color: 'var(--g1)' }}>
              <Icon icon="ph:envelope-bold" />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', marginBottom: 6, textAlign: 'center' }}>Check your inbox</h1>
            <p style={{ fontSize: 15, color: 'var(--ink3)', textAlign: 'center', lineHeight: 1.6 }}>We sent a 6-digit verification code to your email or phone</p>
          </div>

          <div className="verify-card" style={{ background: 'var(--white)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.4)', padding: '32px 36px', marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', marginBottom: 14, display: 'block' }}>Enter 6-digit code</label>

            <div style={{ display: 'flex', gap: 10, marginBottom: 8, cursor: 'text' }} onClick={() => inputRef.current?.focus()}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 62, borderRadius: 14,
                  background: i < otp.length ? 'var(--g-soft)' : 'var(--page)',
                  border: `1.5px solid ${i === otp.length ? 'var(--g1)' : i < otp.length ? 'var(--g1)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700,
                  color: i < otp.length ? 'var(--g1)' : 'var(--ink)',
                  boxShadow: i === otp.length ? '0 0 0 3px rgba(255,107,0,.12)' : 'none',
                  transition: 'all .2s',
                }}>{otp[i] || ''}</div>
              ))}
            </div>

            <input ref={inputRef} type="tel" value={otp} onChange={e => handleOtp(e.target.value)} maxLength={6}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 20px', fontSize: 13, color: 'var(--ink3)' }}>
              <span>Resend in <strong style={{ color: 'var(--ink2)' }}>0:{timer.toString().padStart(2, '0')}</strong></span>
              <button disabled={!canResend} onClick={() => { setOtp(''); setTimer(42); setCanResend(false) }}
                style={{ color: canResend ? 'var(--g1)' : 'var(--ink3)', fontWeight: 500, cursor: canResend ? 'pointer' : 'default', background: 'none', border: 'none', fontFamily: 'var(--font)', fontSize: 13 }}>
                Resend code
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--g-soft)', border: '0.5px solid var(--border-g)', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
              <Icon icon="ph:shield-bold" style={{ fontSize: 18, color: 'var(--g1)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}>
                <strong>Your wallet is set up automatically.</strong> No MetaMask, no seed phrase. Powered by Privy — SOC 2 Type II certified.
              </div>
            </div>

            <button
              disabled={otp.length < 6 || verifying}
              onClick={handleVerify}
              style={{
                width: '100%', background: 'var(--g1)', color: '#fff', border: 'none',
                borderRadius: 100, padding: '17px', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700,
                cursor: otp.length < 6 || verifying ? 'not-allowed' : 'pointer',
                opacity: otp.length < 6 || verifying ? .4 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                marginBottom: 14, boxShadow: '0 6px 20px rgba(255,107,0,.25)',
              }}>
              <Icon icon={verifying ? 'ph:spinner-bold' : 'ph:check-bold'} />
              {verifying ? 'Verifying...' : 'Verify & continue'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              {[['ph:lock-bold', '256-bit encrypted'], ['ph:wallet-bold', 'Wallet by Privy'], ['ph:lightning-bold', 'Powered by Arc']].map(([icon, label], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink3)' }}>
                  <Icon icon={icon} /> {label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink3)' }}>
            Wrong email or phone?{' '}
            <button onClick={() => router.back()} style={{ color: 'var(--g1)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13 }}>
              Go back and change it
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @media(max-width:768px){
          .verify-card{padding:20px 18px!important}
          .verify-wrap{padding:24px 16px 90px!important}
        }
      `}</style>
      <MobileBottomNav />
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--page)' }}>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  )
}
