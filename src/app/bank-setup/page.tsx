'use client'

import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { Nav } from '@/components/layout/Nav'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

const COMING_FEATURES = [
  {
    icon: 'ph:bank-bold',
    title: 'Local bank linking',
    desc: 'Connect your local bank account and withdraw USDC directly as your home currency. Supported globally — including Barclays, HSBC, Lloyds (UK), Chase, Bank of America, Wells Fargo (US), Deutsche Bank, BNP Paribas (Europe), DBS, OCBC, Maybank (Asia), GTBank, Access, Zenith, Equity, Standard Bank (Africa), and hundreds more.',
  },
  { icon: 'ph:currency-dollar-bold', title: 'Fiat withdrawals', desc: 'Convert your USDC balance to your local currency — NGN, GBP, USD, EUR, KES, GHS and more — and send it straight to your bank account.' },
  { icon: 'ph:arrows-left-right-bold', title: 'Auto-conversion', desc: 'Set a rate threshold and PayLink will convert and withdraw automatically when the rate is right.' },
]

export default function BankSetupPage() {
  const router = useRouter()

  return (
    <div style={{ background: 'var(--page)', minHeight: '100vh' }}>
      <Nav variant="app" />

      <div style={{ maxWidth: 580, margin: '0 auto', padding: '48px 20px 100px' }}>

        {/* Icon + heading */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--g-soft)', border: '1.5px solid var(--border-g)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'var(--g1)', marginBottom: 20 }}>
            <Icon icon="ph:bank-bold" />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.3)', borderRadius: 100, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#818CF8', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            <Icon icon="ph:clock-countdown-bold" /> Coming soon
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', marginBottom: 12, lineHeight: 1.2 }}>
            Bank & withdrawal settings
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink3)', lineHeight: 1.7, maxWidth: 440 }}>
            PayLink is currently running on <strong style={{ color: 'var(--ink2)' }}>Arc Testnet</strong> with test funds only — no real money is involved yet. Bank linking and fiat withdrawals will go live when we launch on mainnet.
          </p>
        </div>

        {/* What's coming */}
        <div style={{ background: 'var(--white)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>What to expect at mainnet launch</div>
            <div style={{ fontSize: 12, color: 'var(--ink4)' }}>Everything you need to cash out your USDC</div>
          </div>
          {COMING_FEATURES.map((f, i) => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 22px', borderBottom: i < COMING_FEATURES.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--page)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--g1)', flexShrink: 0 }}>
                <Icon icon={f.icon} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
              <Icon icon="ph:lock-bold" style={{ fontSize: 14, color: 'var(--ink4)', marginLeft: 'auto', flexShrink: 0, marginTop: 4 }} />
            </div>
          ))}
        </div>

        {/* Try now instead */}
        <div style={{ background: 'var(--g-soft)', border: '1.5px solid var(--border-g)', borderRadius: 20, padding: '22px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Icon icon="ph:lightning-bold" style={{ fontSize: 16, color: 'var(--g1)' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--g1)' }}>Try these now while you wait</div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.6, marginBottom: 16 }}>
            You can already test the full payment experience using free testnet USDC. Two methods are ready to go:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--white)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--border)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--g-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: 'var(--g1)', flexShrink: 0 }}>
                <Icon icon="ph:envelope-bold" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>Email or phone OTP</div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.5 }}>Verify with a one-time code — wallet is created automatically, no crypto knowledge needed.</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--white)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--border)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: '#818CF8', flexShrink: 0 }}>
                <Icon icon="ph:wallet-bold" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>Crypto wallet top-up</div>
                <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.5 }}>
                  Get free testnet USDC from the{' '}
                  <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--g1)', fontWeight: 500, textDecoration: 'none' }}>Circle faucet ↗</a>
                  {' '}and send it to your PayLink wallet address on the dashboard.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ flex: 1, background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '15px', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,107,0,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Icon icon="ph:squares-four-bold" /> Go to dashboard
          </button>
          <button
            onClick={() => router.push('/send')}
            style={{ flex: 1, background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--border)', borderRadius: 100, padding: '15px', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Icon icon="ph:paper-plane-right-bold" /> Try sending money
          </button>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  )
}
