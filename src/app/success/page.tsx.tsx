'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/layout/Nav'
import { formatDateTime } from '@/lib/utils'

export default function SuccessPage() {
  const router = useRouter()
  const [date] = useState(new Date().toISOString())

  useEffect(() => {
    // Confetti
    const colors = ['#8DC63F','#1E6B32','#A8D94F','#C8E6CA']
    for(let i = 0; i < 16; i++) {
      const dot = document.createElement('div')
      dot.style.cssText = `position:fixed;width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;border-radius:50%;background:${colors[i%colors.length]};left:${20+Math.random()*60}%;top:${10+Math.random()*30}%;pointer-events:none;z-index:999;animation:confettiDrop ${0.8+Math.random()*0.8}s ease forwards ${Math.random()*0.3}s;`
      document.body.appendChild(dot)
      setTimeout(() => dot.remove(), 1500)
    }
    const style = document.createElement('style')
    style.textContent = '@keyframes confettiDrop{from{transform:translateY(0) scale(1);opacity:1}to{transform:translateY(80px) scale(0);opacity:0}}'
    document.head.appendChild(style)
    return () => { style.remove() }
  }, [])

  const s = {
    card: { background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.06)' } as React.CSSProperties,
  }

  return (
    <div style={{ background: 'var(--page)', minHeight: '100vh' }}>
      <Nav variant="app" />
      <div style={{ padding: '20px 40px 0', fontSize: 13, color: 'var(--ink3)', display: 'flex', gap: 8 }}>
        <a href="/" style={{ color: 'var(--ink3)', textDecoration: 'none' }}>Home</a>
        <span>›</span>
        <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>Payment receipt</span>
      </div>
      <div style={{ padding: '16px 40px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', marginBottom: 6 }}>Payment successful</h1>
        <p style={{ fontSize: 15, color: 'var(--ink3)' }}>Your payment has been confirmed and settled on Arc Network.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, padding: '0 40px 60px', maxWidth: 1100, margin: '0 auto', alignItems: 'start' }}>
        <div>
          <div style={s.card}>
            {/* Hero */}
            <div style={{ padding: '32px 36px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--g-soft)', border: '2px solid var(--g-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, color: 'var(--g1)', animation: 'popIn .5s cubic-bezier(.34,1.56,.64,1) forwards' }}>✓</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--g1)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g3)' }} />
                  Payment confirmed
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Payment successful!</div>
                <div style={{ fontSize: 42, fontWeight: 700, color: 'var(--g1)', letterSpacing: '-.05em', marginBottom: 8 }}>$250.00</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[['⚡ Settled in 0.3s', true], ['Arc Network', false], ['$0.00 gas fee', true]].map(([label, green], i) => (
                    <span key={i} style={{ fontSize: 12, background: green ? 'var(--g-soft)' : 'var(--page)', color: green ? 'var(--g1)' : 'var(--ink3)', padding: '4px 12px', borderRadius: 20, fontWeight: 500 }}>{label as string}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Receipt */}
            <div style={{ padding: '28px 36px' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 14 }}>Transaction details</div>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 24 }}>
                {[
                  { key: 'Paid to', val: 'Oxy Akins' },
                  { key: 'For', val: 'Payment' },
                  { key: 'Amount', val: '$250.00 USDC', green: true },
                  { key: 'Gas fee', val: '$0.00', green: true },
                  { key: 'Total paid', val: '$250.00', bold: true },
                  { key: 'Network', val: 'Arc · USDC' },
                  { key: 'Date & time', val: formatDateTime(date) },
                  { key: 'Transaction ID', val: '#PL' + Date.now().toString().slice(-8) },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 18px', borderBottom: i < 7 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 14, color: 'var(--ink3)' }}>{row.key}</span>
                    <span style={{ fontSize: 14, fontWeight: (row as any).bold ? 700 : 500, color: (row as any).green ? 'var(--g1)' : 'var(--ink)' }}>{row.val}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => router.push('/send')}
                style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '17px', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10, boxShadow: '0 6px 20px rgba(30,107,50,.2)' }}>
                ✈️ Send another payment
              </button>
              <button onClick={() => router.push('/')}
                style={{ width: '100%', background: 'transparent', color: 'var(--ink2)', border: '1.5px solid var(--border)', borderRadius: 100, padding: '15px', fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                🏠 Go home
              </button>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 82 }}>
          <div style={{ ...s.card, padding: '22px 24px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Arc confirmation</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--g-soft)', border: '0.5px solid var(--border-g)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
              <span style={{ fontSize: 22, color: 'var(--g1)' }}>🛡</span>
              <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.5 }}>
                <strong>Settled on-chain.</strong> This payment is permanent and verifiable on Arc Network.
              </div>
            </div>
            {[
              { key: 'Status', val: 'Confirmed', green: true },
              { key: 'Block time', val: '0.3 seconds', green: true },
              { key: 'Gas used', val: '$0.00', green: true },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{row.key}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--g1)' }}>{row.val}</span>
              </div>
            ))}
          </div>

          <div style={{ ...s.card, padding: '20px 22px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>What would you like to do?</div>
            {[
              { label: 'Send another payment', desc: 'Pay someone else instantly', icon: '✈️', href: '/send' },
              { label: 'Create a payment link', desc: 'Request money from anyone', icon: '🔗', href: '/create' },
              { label: 'Go home', desc: 'Back to PayLink homepage', icon: '🏠', href: '/' },
            ].map(item => (
              <div key={item.label} onClick={() => router.push(item.href)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--page)', border: '1px solid var(--border)', cursor: 'pointer', marginBottom: 8, textDecoration: 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--g-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                <div><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 12, color: 'var(--ink3)' }}>{item.desc}</div></div>
                <span style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--ink3)' }}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
