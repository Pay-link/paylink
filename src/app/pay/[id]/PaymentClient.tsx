'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import type { PayLink, PaymentMethod } from '@/types'
import {
  formatUSD,
  getExpiryLabel,
  getInitials,
  shortenTxHash,
} from '@/lib/utils'

interface PaymentClientProps {
  link: PayLink | null
  error: string | null
  slug: string
}

type PayState = 'method' | 'email' | 'otp' | 'wallet' | 'card' | 'processing' | 'success'

export function PaymentClient({ link, error, slug }: PaymentClientProps) {
  const { login, authenticated, user } = usePrivy()
  const router = useRouter()

  const [state, setState] = useState<PayState>('method')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('email_otp')
  const [contact, setContact] = useState('')
  const [txHash, setTxHash] = useState('')
  const [settlementMs, setSettlementMs] = useState(0)
  const [step, setStep] = useState('Step 1 of 2')

  // Link not found or error
  if (error || !link) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 62px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
            {error === 'This link has expired' ? 'Link expired' : 'Link not found'}
          </h1>
          <p style={{ color: 'var(--ink3)', marginBottom: 28, lineHeight: 1.6 }}>
            {error || 'This payment link doesn\'t exist or has been removed.'}
          </p>
          <a href="/create" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--g1)', color: '#fff', padding: '14px 28px',
            borderRadius: 100, textDecoration: 'none', fontWeight: 700,
          }}>
            Create your own PayLink
          </a>
        </div>
      </div>
    )
  }

  const handlePayNow = () => {
    if (selectedMethod === 'wallet') { setState('wallet'); setStep('Step 2 of 2') }
    else if (selectedMethod === 'card') { setState('card'); setStep('Step 2 of 2') }
    else { setState('email'); setStep('Step 2 of 2') }
  }

  const handleProcess = async () => {
    setState('processing')
    const start = Date.now()

    // In production: call Arc App Kit kit.send() here
    // For now simulate with a timeout
    await new Promise(r => setTimeout(r, 2800))

    const mockTxHash = '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6)
    setTxHash(mockTxHash)
    setSettlementMs(Date.now() - start)

    // Record transaction in Supabase
    await fetch('/api/transactions/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link_id: link.id,
        sender_wallet: user?.wallet?.address || '0x' + Math.random().toString(16).slice(2, 42),
        recipient_id: link.owner_id,
        recipient_wallet: link.owner_wallet,
        amount: link.amount,
        note: link.note,
        tx_hash: mockTxHash,
        payment_method: selectedMethod,
      }),
    })

    setState('success')
  }

  return (
    <div style={{
      background: 'var(--page)',
      minHeight: 'calc(100vh - 62px)',
    }}>
      {/* Breadcrumb */}
      <div style={{ padding: '20px 40px 0', fontSize: 13, color: 'var(--ink3)', display: 'flex', gap: 8 }}>
        <a href="/" style={{ color: 'var(--ink3)', textDecoration: 'none' }}>Home</a>
        <span style={{ opacity: .5 }}>›</span>
        <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>Payment</span>
      </div>

      <div style={{ padding: '16px 40px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', marginBottom: 6 }}>
          Complete your payment
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink3)' }}>
          Review the details below and choose how you'd like to pay.
        </p>
      </div>

      {/* Two column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 24,
        padding: '0 40px 60px',
        maxWidth: 1100,
        margin: '0 auto',
        alignItems: 'start',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Recipient card */}
          <div className="card" style={{ padding: '24px 28px' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              Paying to
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--g-soft)', border: '2px solid var(--g-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, color: 'var(--g1)',
                position: 'relative', flexShrink: 0,
              }}>
                {getInitials(link.owner_name)}
                <div style={{
                  position: 'absolute', bottom: -1, right: -1,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--g1)', border: '2px solid white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, color: '#fff',
                }}>✓</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>
                  {link.owner_name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink3)' }}>
                  {link.owner_email || `paylink.xyz/pay/${slug}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>Amount</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em' }}>
                  {formatUSD(link.amount)}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 500, color: 'var(--g1)',
                  background: 'var(--g-soft)', padding: '3px 10px', borderRadius: 20,
                  marginTop: 4,
                }}>
                  {link.amount.toFixed(2)} USDC · Arc
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '18px 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--page)', borderRadius: 10, padding: '10px 14px',
              }}>
                <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}>FOR</span>
                <span style={{ fontSize: 14, color: 'var(--ink2)', fontWeight: 500 }}>{link.note || 'No note'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--ink3)' }}>
                ⚡ Settles in <strong style={{ color: 'var(--ink2)' }}>&lt;1 second</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--ink3)' }}>
                🕐 {getExpiryLabel(link.expiry)}
              </div>
            </div>
          </div>

          {/* Payment options card */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 28px', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Payment options</div>
              <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{step}</div>
            </div>

            <div style={{ padding: '24px 28px' }}>

              {/* METHOD SELECTION */}
              {state === 'method' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    {[
                      { id: 'email_otp' as PaymentMethod, label: 'Email or phone number', desc: 'Verify with a one-time code — no wallet needed', badge: 'Fastest · $0 fee', recommended: true },
                      { id: 'wallet' as PaymentMethod, label: 'Crypto wallet', desc: 'MetaMask, Coinbase Wallet, WalletConnect', badge: null, recommended: false },
                      { id: 'card' as PaymentMethod, label: 'Card or bank transfer', desc: 'Debit card, bank transfer, mobile money', badge: '~1.5%', recommended: false },
                    ].map(method => (
                      <div
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 16,
                          border: `1.5px solid ${selectedMethod === method.id ? 'var(--g1)' : 'var(--border)'}`,
                          borderRadius: 16, padding: '16px 18px',
                          cursor: 'pointer',
                          background: selectedMethod === method.id ? 'var(--g-soft)' : 'var(--white)',
                          position: 'relative',
                          boxShadow: selectedMethod === method.id ? '0 0 0 3px rgba(30,107,50,.07)' : 'none',
                          transition: 'all .2s',
                        }}
                      >
                        {method.recommended && (
                          <div style={{
                            position: 'absolute', top: -10, left: 18,
                            fontSize: 10, fontWeight: 700,
                            background: 'var(--g1)', color: '#fff',
                            padding: '3px 10px', borderRadius: 20,
                          }}>Recommended</div>
                        )}
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          border: `1.5px solid ${selectedMethod === method.id ? 'var(--g1)' : 'var(--border)'}`,
                          background: selectedMethod === method.id ? 'var(--g1)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {selectedMethod === method.id && (
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>
                            {method.label}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{method.desc}</div>
                        </div>
                        {method.badge && (
                          <div style={{
                            fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20,
                            background: method.id === 'card' ? 'rgba(204,136,0,.1)' : 'var(--g-soft)',
                            color: method.id === 'card' ? '#B8880A' : 'var(--g1)',
                          }}>
                            {method.badge}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Fee summary */}
                  <div style={{
                    background: 'var(--page)', borderRadius: 16,
                    padding: '16px 20px', marginBottom: 24,
                  }}>
                    {[
                      { key: 'You send', val: formatUSD(link.amount), green: false },
                      { key: 'Gas fee', val: '$0.00', green: true },
                      { key: 'Total', val: formatUSD(link.amount), green: false, bold: true },
                    ].map((row, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '7px 0',
                        borderTop: i > 0 ? '0.5px solid var(--border)' : 'none',
                      }}>
                        <span style={{ fontSize: row.bold ? 15 : 14, color: 'var(--ink3)', fontWeight: row.bold ? 700 : 400 }}>{row.key}</span>
                        <span style={{ fontSize: row.bold ? 15 : 14, fontWeight: row.bold ? 700 : 500, color: row.green ? 'var(--g1)' : 'var(--ink)' }}>{row.val}</span>
                      </div>
                    ))}
                  </div>

                  <button className="btn-primary" onClick={handlePayNow}>
                    🔒 Continue to pay · {formatUSD(link.amount)}
                  </button>
                </>
              )}

              {/* EMAIL INPUT */}
              {state === 'email' && (
                <>
                  <button onClick={() => { setState('method'); setStep('Step 1 of 2') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink3)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}>
                    ← Back to payment methods
                  </button>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', display: 'block', marginBottom: 8 }}>
                      Your email or phone number
                    </label>
                    <input
                      type="text"
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      placeholder="you@email.com or +234 800 000 0000"
                      style={{
                        width: '100%', background: 'var(--page)',
                        border: '1.5px solid var(--border)', borderRadius: 14,
                        padding: '14px 18px', fontSize: 15, color: 'var(--ink)',
                        outline: 'none', fontFamily: 'var(--font)',
                      }}
                    />
                    <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 7, lineHeight: 1.6 }}>
                      We'll send a one-time code. Your wallet is created automatically — no account needed.
                    </p>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={handleProcess}
                    disabled={!contact || contact.length < 5}
                  >
                    ✉️ Send verification code
                  </button>
                </>
              )}

              {/* PROCESSING */}
              {state === 'processing' && (
                <div style={{ textAlign: 'center', padding: '20px 0 28px' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    border: '3px solid var(--g-mid)', borderTopColor: 'var(--g1)',
                    animation: 'spin 1s linear infinite', margin: '0 auto 16px',
                  }} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                    Processing your payment
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.6 }}>
                    Settling {formatUSD(link.amount)} on Arc Network.<br />
                    This takes less than a second.
                  </div>
                </div>
              )}

              {/* SUCCESS */}
              {state === 'success' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'var(--g-soft)', border: '2px solid var(--g-mid)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 30, color: 'var(--g1)', margin: '0 auto 16px',
                    animation: 'popIn .5s cubic-bezier(.34,1.56,.64,1) forwards',
                  }}>
                    ✓
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                    Payment sent!
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--g1)', marginBottom: 8 }}>
                    {formatUSD(link.amount)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                    <span style={{ fontSize: 12, background: 'var(--g-soft)', color: 'var(--g1)', padding: '4px 12px', borderRadius: 20, fontWeight: 500 }}>
                      ⚡ Settled in {(settlementMs / 1000).toFixed(1)}s
                    </span>
                    <span style={{ fontSize: 12, background: 'var(--page)', color: 'var(--ink3)', padding: '4px 12px', borderRadius: 20 }}>
                      Arc Network
                    </span>
                  </div>

                  {/* Receipt */}
                  <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 20, textAlign: 'left' }}>
                    {[
                      { key: 'To', val: link.owner_name },
                      { key: 'Amount', val: `${formatUSD(link.amount)} USDC`, green: true },
                      { key: 'Gas fee', val: '$0.00', green: true },
                      { key: 'Network', val: 'Arc · USDC' },
                      { key: 'Tx hash', val: shortenTxHash(txHash) },
                    ].map((row, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '12px 18px',
                        borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                      }}>
                        <span style={{ fontSize: 14, color: 'var(--ink3)' }}>{row.key}</span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: row.green ? 'var(--g1)' : 'var(--ink)' }}>
                          {row.val}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button className="btn-primary" onClick={() => window.location.href = '/'}>
                    🏠 Done
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 82 }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Order summary</div>
            {[
              { key: 'Amount', val: formatUSD(link.amount) },
              { key: 'Gas fee', val: '$0.00', green: true },
              { key: 'Network', val: 'Arc · USDC' },
              { key: 'Settlement', val: '<1 second', green: true },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{row.key}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: row.green ? 'var(--g1)' : 'var(--ink)' }}>{row.val}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: 14, borderTop: '1.5px solid var(--border)', marginTop: 4,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Total to pay</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Charged today</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{formatUSD(link.amount)}</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>USDC</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--g-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--g1)', flexShrink: 0 }}>
              🛡
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', marginBottom: 3 }}>Secure checkout</div>
              <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6 }}>
                Protected by Arc Network. Non-custodial. Your funds stay in your control.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
