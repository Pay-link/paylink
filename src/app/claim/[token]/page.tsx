'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { Icon } from '@iconify/react'

interface Claim {
  id: string
  claim_token: string
  sender_name: string
  sender_email: string
  recipient_email: string
  amount: number
  note: string | null
  status: 'pending' | 'claimed' | 'expired'
  expires_at: string
}

export default function ClaimPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const { authenticated, ready, login, user } = usePrivy()

  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/claim?token=${token}`)
      .then(r => r.json())
      .then(({ claim, error }) => {
        if (error || !claim) setError('This claim link is invalid or has expired.')
        else setClaim(claim)
      })
      .catch(() => setError('Could not load this claim. Please try again.'))
      .finally(() => setLoading(false))
  }, [token])

  // After login, auto-claim
  useEffect(() => {
    if (ready && authenticated && user && claiming && claim) {
      completeClaim()
    }
  }, [ready, authenticated, user, claiming])

  const completeClaim = async () => {
    try {
      const res = await fetch('/api/claim', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, claimedBy: user!.id }),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); setClaiming(false); return }
      setClaimed(true)
    } catch {
      setError('Something went wrong. Please contact support.')
      setClaiming(false)
    }
  }

  const handleClaim = async () => {
    setClaiming(true)
    if (!authenticated) {
      await login()
      // completeClaim fires via useEffect after auth
    } else {
      await completeClaim()
    }
  }

  const expiresIn = claim
    ? Math.max(0, Math.ceil((new Date(claim.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div style={{ background: 'var(--page)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5%', background: 'rgba(9,9,14,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', zIndex: 100 }}>
        <a href="/" style={{ fontSize: 21, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', textDecoration: 'none' }}>
          pay<span style={{ color: 'var(--g1)' }}>link</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink3)' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--g3)', display: 'inline-block' }} />
          Arc Testnet
        </div>
      </nav>

      <div style={{ width: '100%', maxWidth: 460, marginTop: 60 }}>

        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: 15, padding: 40 }}>
            <Icon icon="ph:spinner-bold" style={{ fontSize: 32, animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
            Loading your payment…
          </div>
        )}

        {!loading && error && (
          <div style={{ background: 'var(--white)', borderRadius: 20, border: '1px solid var(--border)', padding: '36px 32px', textAlign: 'center' }}>
            <Icon icon="ph:warning-circle-bold" style={{ fontSize: 48, color: '#E53935', marginBottom: 16 }} />
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Link unavailable</div>
            <div style={{ fontSize: 14, color: 'var(--ink3)', lineHeight: 1.6, marginBottom: 24 }}>{error}</div>
            <a href="/" style={{ color: 'var(--g1)', fontWeight: 500, fontSize: 14 }}>Go to PayLink →</a>
          </div>
        )}

        {!loading && claim && !error && (
          <div style={{ background: 'var(--white)', borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(0,0,0,.5)', overflow: 'hidden' }}>

            {/* Header band */}
            <div style={{ background: claimed ? 'var(--g1)' : claim.status === 'pending' ? 'var(--g-soft)' : 'rgba(220,50,50,.1)', padding: '28px 32px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: claimed ? 'rgba(255,255,255,.2)' : 'var(--g-soft)', border: `2px solid ${claimed ? 'rgba(255,255,255,.4)' : 'var(--border-g)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: claimed ? '#fff' : 'var(--g1)', margin: '0 auto 16px' }}>
                <Icon icon={claimed ? 'ph:check-bold' : claim.status === 'expired' ? 'ph:clock-countdown-bold' : 'ph:gift-bold'} />
              </div>
              {claimed ? (
                <>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Funds claimed!</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,.7)' }}>The USDC has been added to your wallet.</div>
                </>
              ) : claim.status === 'expired' ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>This link has expired</div>
                  <div style={{ fontSize: 14, color: 'var(--ink3)' }}>The funds were returned to the sender.</div>
                </>
              ) : claim.status === 'claimed' ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Already claimed</div>
                  <div style={{ fontSize: 14, color: 'var(--ink3)' }}>These funds have already been claimed.</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--g1)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>You've received money</div>
                  <div style={{ fontSize: 52, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.06em', lineHeight: 1 }}>
                    <span style={{ fontSize: '0.42em', verticalAlign: 'super', fontWeight: 500, color: 'var(--ink3)' }}>$</span>
                    {claim.amount.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 6 }}>{claim.amount.toFixed(2)} USDC · Arc Network</div>
                </>
              )}
            </div>

            {/* Details */}
            {!claimed && claim.status === 'pending' && (
              <div style={{ padding: '24px 32px' }}>
                {[
                  { key: 'From', val: claim.sender_name || claim.sender_email },
                  { key: 'For', val: claim.note || 'Payment' },
                  { key: 'Network', val: 'Arc · USDC · $0 gas' },
                  { key: 'Expires in', val: `${expiresIn} day${expiresIn !== 1 ? 's' : ''}`, warn: expiresIn <= 2 },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 14, color: 'var(--ink3)' }}>{row.key}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: (row as any).warn ? '#FDB64E' : 'var(--ink)' }}>{row.val}</span>
                  </div>
                ))}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--g-soft)', border: '0.5px solid var(--border-g)', borderRadius: 14, padding: '14px 16px', margin: '20px 0' }}>
                  <Icon icon="ph:shield-check-bold" style={{ fontSize: 18, color: 'var(--g1)', flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.5 }}>
                    <strong>Secure & automatic.</strong> Verify your identity with a one-time code — your wallet is created instantly. No seed phrase or crypto knowledge needed.
                  </div>
                </div>

                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '17px', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, cursor: claiming ? 'not-allowed' : 'pointer', opacity: claiming ? .6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 6px 20px rgba(37,92,180,.28)', marginBottom: 12 }}>
                  <Icon icon={claiming ? 'ph:spinner-bold' : 'ph:hand-grabbing-bold'} />
                  {claiming ? 'Verifying…' : `Claim $${claim.amount.toFixed(2)}`}
                </button>
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink4)' }}>
                  By claiming you agree to PayLink's terms. Your wallet is powered by Privy.
                </div>
              </div>
            )}

            {claimed && (
              <div style={{ padding: '24px 32px', textAlign: 'center' }}>
                <button onClick={() => router.push('/dashboard')}
                  style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '15px', fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10, boxShadow: '0 4px 14px rgba(37,92,180,.28)' }}>
                  Go to my dashboard →
                </button>
                <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Your balance has been updated.</div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
