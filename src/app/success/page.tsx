'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Nav } from '@/components/layout/Nav'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { formatDateTime } from '@/lib/utils'
import { Icon } from '@iconify/react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zapay.xyz'

function SuccessContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [date] = useState(new Date().toISOString())

  const flow = params.get('flow') || 'send'
  const amount = params.get('amount') || '0.00'
  const to = params.get('to') || params.get('contact') || 'Recipient'
  const note = params.get('note') || 'Payment'
  const claimToken = params.get('claim_token') || ''
  const claimUrl = claimToken ? `${APP_URL}/claim/${claimToken}` : ''
  const txId = '#PL' + Date.now().toString().slice(-8)
  const [copied, setCopied] = useState(false)

  const copyClaimLink = () => {
    navigator.clipboard.writeText(claimUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  useEffect(() => {
    const colors = ['#255CB4', '#4a7fd4', '#6a9be4', '#e8f0fc']
    for (let i = 0; i < 18; i++) {
      const dot = document.createElement('div')
      dot.style.cssText = `position:fixed;width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;border-radius:50%;background:${colors[i%colors.length]};left:${10+Math.random()*80}%;top:${5+Math.random()*40}%;pointer-events:none;z-index:999;animation:confettiDrop ${0.8+Math.random()*0.8}s ease forwards ${Math.random()*0.4}s;`
      document.body.appendChild(dot)
      setTimeout(() => dot.remove(), 2000)
    }
    const style = document.createElement('style')
    style.textContent = '@keyframes confettiDrop{from{transform:translateY(0) scale(1);opacity:1}to{transform:translateY(100px) scale(0);opacity:0}} @keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}'
    document.head.appendChild(style)
    return () => { style.remove() }
  }, [])

  const card: React.CSSProperties = {
    background: 'var(--white)',
    borderRadius: 20,
    border: '1px solid var(--border)',
    boxShadow: '0 2px 12px rgba(0,0,0,.35)',
  }

  return (
    <div style={{ background: 'var(--page)', minHeight: '100vh' }}>
      <Nav variant="app" pageName="Payment receipt" />
      <div className="page-header" style={{ padding: '16px 40px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', marginBottom: 6 }}>
          {flow === 'claim' ? 'Funds held — share to claim' : 'Payment successful'}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink3)' }}>
          {flow === 'claim'
            ? `$${amount} USDC is being held safely. Share the link below with ${to} so they can claim it.`
            : 'Your payment has been confirmed and settled on Arc Network.'}
        </p>
      </div>

      <div className="two-col-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, padding: '0 40px 60px', maxWidth: 1100, margin: '0 auto', alignItems: 'start' }}>
        <div>
          <div style={card}>
            {/* Hero */}
            <div style={{ padding: '32px 36px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--g-soft)', border: '2px solid var(--border-g)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, color: 'var(--g1)', animation: 'popIn .5s cubic-bezier(.34,1.56,.64,1) forwards', flexShrink: 0 }}>
                <Icon icon="ph:check-bold" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--g1)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g3)' }} />
                  Payment confirmed
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Payment successful!</div>
                <div style={{ fontSize: 42, fontWeight: 700, color: 'var(--g1)', letterSpacing: '-.05em', marginBottom: 8 }}>${amount}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[['Settled in 0.3s', true, 'ph:lightning-bold'], ['Arc Network', false, 'ph:globe-bold'], ['$0.00 gas fee', true, 'ph:gas-pump-bold']].map(([label, green, icon], i) => (
                    <span key={i} style={{ fontSize: 12, background: green ? 'var(--g-soft)' : 'var(--page)', color: green ? 'var(--g1)' : 'var(--ink3)', padding: '4px 12px', borderRadius: 20, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Icon icon={icon as string} style={{ fontSize: 11 }} />{label as string}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Receipt */}
            <div style={{ padding: '28px 36px' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 14 }}>Transaction details</div>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 24 }}>
                {[
                  { key: 'Paid to', val: to },
                  { key: 'For', val: note || 'Payment' },
                  { key: 'Amount', val: `$${amount} USDC`, green: true },
                  { key: 'Gas fee', val: '$0.00', green: true },
                  { key: 'Total paid', val: `$${amount}`, bold: true },
                  { key: 'Network', val: 'Arc · USDC' },
                  { key: 'Date & time', val: formatDateTime(date) },
                  { key: 'Transaction ID', val: txId },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 18px', borderBottom: i < 7 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 14, color: 'var(--ink3)' }}>{row.key}</span>
                    <span style={{ fontSize: 14, fontWeight: (row as any).bold ? 700 : 500, color: (row as any).green ? 'var(--g1)' : 'var(--ink)' }}>{row.val}</span>
                  </div>
                ))}
              </div>

              {/* Claim link card — shown when recipient wasn't registered */}
              {flow === 'claim' && claimUrl && (
                <div style={{ background: 'rgba(245,158,11,.07)', border: '1.5px solid rgba(245,158,11,.3)', borderRadius: 18, padding: '20px 22px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Icon icon="ph:link-bold" style={{ fontSize: 18, color: '#FDB64E' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FDB64E' }}>Share this claim link with {to}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 14, lineHeight: 1.6 }}>
                    Paste it in WhatsApp, iMessage, DM — anywhere they'll see it from <em>you</em>. They tap the link, verify with OTP, and the ${amount} goes straight to their wallet. <strong style={{ color: 'var(--ink2)' }}>Expires in 7 days.</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--page)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, wordBreak: 'break-all', fontSize: 12, fontFamily: 'monospace', color: 'var(--ink2)' }}>
                    {claimUrl}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={copyClaimLink} style={{ flex: 1, background: copied ? 'var(--g-soft)' : 'var(--page)', color: copied ? 'var(--g1)' : 'var(--ink)', border: `1.5px solid ${copied ? 'var(--border-g)' : 'var(--border)'}`, borderRadius: 100, padding: '11px', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .2s' }}>
                      <Icon icon={copied ? 'ph:check-bold' : 'ph:copy-bold'} /> {copied ? 'Copied!' : 'Copy link'}
                    </button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(`Hey! I sent you $${amount} on ZaPay. Tap this link to claim it: ${claimUrl}`)}`} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, background: '#25D366', color: '#fff', border: 'none', borderRadius: 100, padding: '11px', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
                      <Icon icon="ph:whatsapp-logo-bold" /> Share on WhatsApp
                    </a>
                  </div>
                </div>
              )}

              <button onClick={() => router.push('/send')}
                style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '17px', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10, boxShadow: '0 6px 20px rgba(37,92,180,.28)' }}>
                <Icon icon="ph:paper-plane-right-bold" /> Send another payment
              </button>
              <button onClick={() => router.push('/')}
                style={{ width: '100%', background: 'transparent', color: 'var(--ink2)', border: '1.5px solid var(--border)', borderRadius: 100, padding: '15px', fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <Icon icon="ph:house-bold" /> Go home
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 82 }}>
          <div style={{ ...card, padding: '22px 24px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--ink)' }}>Arc confirmation</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--g-soft)', border: '0.5px solid var(--border-g)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
              <Icon icon="ph:shield-check-bold" style={{ fontSize: 22, color: 'var(--g1)', flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.5 }}>
                <strong>Settled on-chain.</strong> This payment is permanent and verifiable on Arc Network.
              </div>
            </div>
            {[
              { key: 'Status', val: 'Confirmed' },
              { key: 'Block time', val: '0.3 seconds' },
              { key: 'Gas used', val: '$0.00' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{row.key}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--g1)' }}>{row.val}</span>
              </div>
            ))}
          </div>

          <div style={{ ...card, padding: '20px 22px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--ink)' }}>What would you like to do?</div>
            {[
              { label: 'Send another payment', desc: 'Pay someone else instantly', icon: 'ph:paper-plane-right-bold', href: '/send' },
              { label: 'Create a payment link', desc: 'Request money from anyone', icon: 'ph:link-bold', href: '/create' },
              { label: 'Go home', desc: 'Back to ZaPay homepage', icon: 'ph:house-bold', href: '/' },
            ].map(item => (
              <div key={item.label} onClick={() => router.push(item.href)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--page)', border: '1px solid var(--border)', cursor: 'pointer', marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--g-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--g1)', flexShrink: 0 }}>
                  <Icon icon={item.icon} style={{ fontSize: 18 }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{item.desc}</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--ink3)' }}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .two-col-layout{grid-template-columns:1fr!important;padding:0 16px 90px!important;gap:0!important}
          .two-col-layout>div:last-child{display:none!important}
          .page-header{padding:12px 16px 20px!important}
        }
      `}</style>
      <MobileBottomNav />
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--page)' }}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
