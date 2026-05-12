'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/layout/Nav'
import { isValidContact, getShareUrls, generateLinkSlug } from '@/lib/utils'

type Step = 1 | 2 | 3 | 4

export default function CreatePage() {
  const { authenticated, login, ready, user } = usePrivy()
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [ownerContact, setOwnerContact] = useState('')
  const [amountStr, setAmountStr] = useState('0')
  const [note, setNote] = useState('')
  const [receiveType, setReceiveType] = useState<'crypto'|'bank'>('crypto')
  const [expiry, setExpiry] = useState('7 days')
  const [generatedSlug, setGeneratedSlug] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (ready && !authenticated) login()
  }, [ready, authenticated])

  const amt = parseFloat(amountStr) || 0

  const numpad = (key: string) => {
    setAmountStr(prev => {
      if (key === 'del') return prev.length > 1 ? prev.slice(0,-1) : '0'
      if (key === '.') return prev.includes('.') ? prev : prev + '.'
      if (prev === '0') return key
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev
      return prev + key
    })
  }

  const generateLink = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: user?.id || 'demo',
          owner_name: ownerContact.split('@')[0] || 'PayLink User',
          owner_email: ownerContact,
          owner_wallet: '0x0000000000000000000000000000000000000000',
          amount: amt,
          note,
          receive_type: receiveType,
          expiry,
        }),
      })
      const data = await res.json()
      if (data.data?.link?.slug) {
        setGeneratedSlug(data.data.link.slug)
      } else {
        setGeneratedSlug(generateLinkSlug())
      }
    } catch {
      setGeneratedSlug(generateLinkSlug())
    }
    setCreating(false)
    setStep(4)
  }

  const linkUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://paylink-1.netlify.app'}/pay/${generatedSlug}`
  const shareUrls = generatedSlug ? getShareUrls(linkUrl, amt, note) : null

  const s = {
    page: { background: 'var(--page)', minHeight: '100vh' } as React.CSSProperties,
    card: { background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.06)' } as React.CSSProperties,
    btn: { width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '17px 28px', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, marginBottom: 14, boxShadow: '0 6px 20px rgba(30,107,50,.2)' } as React.CSSProperties,
  }

  return (
    <div style={s.page}>
      <Nav variant="app" />
      <div style={{ padding: '20px 40px 0', fontSize: 13, color: 'var(--ink3)', display: 'flex', gap: 8 }}>
        <a href="/" style={{ color: 'var(--ink3)', textDecoration: 'none' }}>Home</a>
        <span>›</span>
        <span style={{ color: 'var(--ink2)', fontWeight: 500 }}>Create link</span>
      </div>
      <div style={{ padding: '16px 40px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', marginBottom: 6 }}>Create a payment link</h1>
        <p style={{ fontSize: 15, color: 'var(--ink3)' }}>Generate a link anyone can use to pay you — no wallet or account needed on their end.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, padding: '0 40px 60px', maxWidth: 1100, margin: '0 auto', alignItems: 'start' }}>
        <div>
          <div style={s.card}>
            {/* Step progress */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
              {[1,2,3,4].map((n, i) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 4 ? 1 : 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, background: n < step ? 'var(--g1)' : n === step ? 'var(--g1)' : 'var(--page)', color: n <= step ? '#fff' : 'var(--ink3)', border: n > step ? '1.5px solid var(--border)' : 'none', boxShadow: n === step ? '0 0 0 4px rgba(30,107,50,.12)' : 'none' }}>{n < step ? '✓' : n}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginLeft: 8, color: n === step ? 'var(--ink)' : n < step ? 'var(--g1)' : 'var(--ink3)' }}>{['Your account','Amount','Receive','Share'][n-1]}</div>
                  {n < 4 && <div style={{ flex: 1, height: 1.5, background: n < step ? 'var(--g3)' : 'var(--border)', margin: '0 12px' }} />}
                </div>
              ))}
            </div>

            <div style={{ padding: '28px 28px 32px' }}>

              {/* STEP 1 */}
              {step === 1 && (
                <div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Your account</div>
                  <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 24, lineHeight: 1.6 }}>Enter your email or phone to get started.</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--g-soft)', border: '0.5px solid var(--border-g)', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
                    <span>ℹ️</span>
                    <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}><strong>One-time setup.</strong> Once saved, every PayLink you create pays out automatically.</div>
                  </div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', marginBottom: 8, display: 'block' }}>Your email or phone</label>
                  <input style={{ width: '100%', background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 18px', fontFamily: 'var(--font)', fontSize: 15, color: 'var(--ink)', outline: 'none' }} type="text" placeholder="you@email.com or +234 800 000 0000" value={ownerContact} onChange={e => setOwnerContact(e.target.value)} />
                  <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 7, lineHeight: 1.6 }}>Used to identify your account and send payment notifications.</div>
                  <button style={{ ...s.btn, opacity: !isValidContact(ownerContact) ? .4 : 1 }} disabled={!isValidContact(ownerContact)} onClick={() => setStep(2)}>
                    Continue →
                  </button>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div>
                  <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font)', padding: 0 }}>← Back</button>
                  <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>How much are you requesting?</div>
                  <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 24 }}>Set the amount and add a note.</div>

                  <div style={{ background: amt > 0 ? 'var(--g-soft)' : 'var(--page)', border: `1.5px solid ${amt > 0 ? 'var(--border-g)' : 'var(--border)'}`, borderRadius: 14, padding: '20px 24px', marginBottom: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Amount to request</div>
                    <div style={{ fontSize: 64, fontWeight: 700, color: amt > 0 ? 'var(--ink)' : 'var(--ink3)', letterSpacing: '-.06em', lineHeight: 1, marginBottom: 8 }}>
                      <span style={{ fontSize: '0.42em', verticalAlign: 'super', fontWeight: 500 }}>$</span>{amountStr}
                    </div>
                    {amt > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--g1)', background: 'rgba(30,107,50,.08)', padding: '4px 12px', borderRadius: 20 }}>{amt.toFixed(2)} USDC · Arc</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
                    {['1','2','3','4','5','6','7','8','9','.','0','del'].map(k => (
                      <button key={k} onClick={() => numpad(k)} style={{ background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 8px', fontFamily: 'var(--font)', fontSize: k === 'del' ? 17 : 20, fontWeight: 500, color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 54 }}>
                        {k === 'del' ? '⌫' : k}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 18px' }}>
                    <span>✏️</span>
                    <input style={{ border: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 14, color: 'var(--ink)', outline: 'none', flex: 1 }} placeholder="What's this for? e.g. Design work" value={note} onChange={e => setNote(e.target.value)} />
                  </div>

                  <button style={{ ...s.btn, opacity: amt <= 0 ? .4 : 1 }} disabled={amt <= 0} onClick={() => setStep(3)}>Continue →</button>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div>
                  <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font)', padding: 0 }}>← Back</button>
                  <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>How do you want to receive?</div>
                  <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 24 }}>Choose how the payment is delivered to you.</div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    {[{ id: 'crypto' as const, label: 'Crypto wallet', desc: 'Receive USDC instantly. $0 fee.', icon: '💳' }, { id: 'bank' as const, label: 'Bank / mobile money', desc: 'Receive local currency.', icon: '🏦' }].map(opt => (
                      <div key={opt.id} onClick={() => setReceiveType(opt.id)}
                        style={{ flex: 1, borderRadius: 16, padding: '16px 14px', border: `1.5px solid ${receiveType === opt.id ? 'var(--g1)' : 'var(--border)'}`, background: receiveType === opt.id ? 'var(--g-soft)' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>{opt.icon}</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: receiveType === opt.id ? 'var(--g1)' : 'var(--ink2)', marginBottom: 4 }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{opt.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: receiveType === 'crypto' ? 'var(--g-soft)' : '#FFF8E8', border: `0.5px solid ${receiveType === 'crypto' ? 'var(--border-g)' : 'rgba(204,136,0,.2)'}`, borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
                    <span>ℹ️</span>
                    <div style={{ fontSize: 13, color: receiveType === 'crypto' ? 'var(--g1)' : '#B8880A', lineHeight: 1.6 }}>
                      {receiveType === 'crypto' ? <><strong>Your wallet is created automatically.</strong> USDC lands instantly when someone pays.</> : <><strong>One-time bank setup required.</strong> You'll enter your bank details once.</>}
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', marginBottom: 10, display: 'block' }}>Link expires in</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {['24 hours', '7 days', '30 days', 'Never'].map(opt => (
                        <div key={opt} onClick={() => setExpiry(opt)}
                          style={{ padding: '8px 16px', borderRadius: 100, border: `1.5px solid ${expiry === opt ? 'var(--g1)' : 'var(--border)'}`, background: expiry === opt ? 'var(--g-soft)' : '#fff', fontSize: 13, fontWeight: 500, color: expiry === opt ? 'var(--g1)' : 'var(--ink3)', cursor: 'pointer' }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button style={{ ...s.btn, opacity: creating ? .6 : 1 }} disabled={creating} onClick={generateLink}>
                    🔗 {creating ? 'Generating...' : 'Generate my link'}
                  </button>
                </div>
              )}

              {/* STEP 4 - Share */}
              {step === 4 && generatedSlug && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--g-soft)', border: '1.5px solid var(--border-g)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--g1)' }}>✓</div>
                    <div>
                      <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>Your link is live!</div>
                      <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Share it anywhere — anyone can pay with just a click.</div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--page)', borderRadius: 14, padding: '18px 20px', marginBottom: 20, border: '1.5px solid var(--border-g)' }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>Your PayLink</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--g1)', wordBreak: 'break-all', marginBottom: 10, fontFamily: 'monospace' }}>{linkUrl}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink3)' }}>
                      🕐 ${amt.toFixed(2)} · Expires in {expiry}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'WhatsApp', icon: '💬', href: shareUrls?.whatsapp },
                      { label: 'Telegram', icon: '✈️', href: shareUrls?.telegram },
                      { label: 'Email', icon: '📧', href: shareUrls?.email },
                      { label: 'X / Twitter', icon: '𝕏', href: shareUrls?.x },
                      { label: 'QR code', icon: '⬛', action: () => alert('QR code generation coming soon') },
                      { label: 'Copy link', icon: '📋', action: () => navigator.clipboard.writeText(linkUrl) },
                    ].map(item => (
                      <div key={item.label} onClick={() => item.href ? window.open(item.href, '_blank') : item.action?.()}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 8px', cursor: 'pointer' }}>
                        <span style={{ fontSize: 22 }}>{item.icon}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <button style={{ ...s.btn, background: '#fff', color: 'var(--ink2)', border: '1.5px solid var(--border)', boxShadow: 'none', marginTop: 0 }} onClick={() => { setStep(1); setAmountStr('0'); setNote(''); setGeneratedSlug('') }}>
                    + Create another link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 82 }}>
          <div style={{ ...s.card, padding: '22px 24px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Link preview</div>
            <div style={{ background: 'var(--page)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1.5px dashed var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Your PayLink URL</div>
              <div style={{ fontSize: 12, color: generatedSlug ? 'var(--g1)' : 'var(--ink3)', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: generatedSlug ? 500 : 400 }}>
                {generatedSlug ? `paylink-1.netlify.app/pay/${generatedSlug}` : 'paylink-1.netlify.app/pay/——————'}
              </div>
            </div>
            {[
              { key: 'Amount', val: amt > 0 ? `$${amt.toFixed(2)}` : 'Not set', empty: amt <= 0 },
              { key: 'For', val: note || 'No note', empty: !note },
              { key: 'Receive via', val: receiveType === 'crypto' ? 'Crypto wallet' : 'Bank / mobile' },
              { key: 'Gas fee for sender', val: '$0.00', green: true },
              { key: 'Expires', val: expiry },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{row.key}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: (row as any).green ? 'var(--g1)' : (row as any).empty ? 'var(--ink3)' : 'var(--ink)', fontStyle: (row as any).empty ? 'italic' : 'normal' }}>{row.val}</span>
              </div>
            ))}
          </div>

          <div style={{ ...s.card, padding: '20px 22px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Tips for sharing</div>
            {[
              { icon: '📸', title: 'Instagram bio', desc: 'Put your PayLink in your bio so followers can pay you directly.' },
              { icon: '💬', title: 'WhatsApp', desc: 'Send the link in a chat. They pay with one click, no app needed.' },
              { icon: '♾️', title: 'Reuse forever', desc: 'Set expiry to "Never" and the link collects payments forever.' },
            ].map(tip => (
              <div key={tip.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 12 }}>
                <span style={{ fontSize: 15, color: 'var(--g1)', flexShrink: 0, marginTop: 1 }}>{tip.icon}</span>
                <div style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.5 }}><strong style={{ color: 'var(--ink2)', fontWeight: 500 }}>{tip.title}</strong> — {tip.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
