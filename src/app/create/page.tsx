'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/layout/Nav'
import { useUser } from '@/hooks/useUser'
import { getShareUrls, generateLinkSlug } from '@/lib/utils'
import { Icon } from '@iconify/react'

type Step = 1 | 2 | 3 | 4

export default function CreatePage() {
  const { authenticated, login, ready } = usePrivy()
  const { walletAddress, email, phone, displayName, userId } = useUser()
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [amountStr, setAmountStr] = useState('0')
  const [note, setNote] = useState('')
  const [receiveType, setReceiveType] = useState<'crypto'|'bank'>('crypto')
  const [expiry, setExpiry] = useState('7 days')
  const [generatedSlug, setGeneratedSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  
  // Mock bank setup for now
  const hasBankSetup = false

  useEffect(() => {
    if (ready && !authenticated) login()
  }, [ready, authenticated])

  // Skip step 1 if already authenticated
  useEffect(() => {
    if (authenticated && step === 1) setStep(2)
  }, [authenticated])

  const amt = parseFloat(amountStr) || 0

  const numpad = (key: string) => {
    setAmountStr(prev => {
      if (key === 'del') return prev.length > 1 ? prev.slice(0, -1) : '0'
      if (key === '.') return prev.includes('.') ? prev : prev + '.'
      if (prev === '0') return key
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev
      return prev + key
    })
  }

  const generateLink = async () => {
    if (!userId) {
      alert('Please sign in before generating a link.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: userId,
          owner_name: displayName,
          owner_email: email,
          owner_wallet: walletAddress || '0x0000000000000000000000000000000000000000',
          amount: amt,
          note,
          receive_type: receiveType,
          expiry,
        }),
      })
      const data = await res.json()
      if (data.data?.link?.slug) {
        setGeneratedSlug(data.data.link.slug)
        setStep(4)
      } else {
        alert(`Failed to generate link: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      alert('Network error while creating the link. Check your connection.')
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://paylink-1.netlify.app'
  const linkUrl = `${appUrl}/pay/${generatedSlug}`
  const shareUrls = generatedSlug ? getShareUrls(linkUrl, amt, note) : null

  const s = {
    page: { background: 'var(--page)', minHeight: '100vh' } as React.CSSProperties,
    card: { background: 'var(--white)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.4)' } as React.CSSProperties,
    btn: { width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '17px 28px', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, marginBottom: 14, boxShadow: '0 6px 20px rgba(255,107,0,.28)' } as React.CSSProperties,
  }

  const steps = authenticated ? ['Amount', 'Receive', 'Share'] : ['Account', 'Amount', 'Receive', 'Share']
  const totalSteps = steps.length
  const currentStepIndex = authenticated ? step - 1 : step - 1

  return (
    <div style={s.page}>
      <Nav variant="app" pageName="Create link" />
      <div className="page-header" style={{ padding: '16px 40px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', marginBottom: 6 }}>Create a payment link</h1>
        <p style={{ fontSize: 15, color: 'var(--ink3)' }}>Generate a link anyone can use to pay you — no wallet or account needed on their end.</p>
      </div>

      <div className="two-col-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, padding: '0 40px 60px', maxWidth: 1100, margin: '0 auto', alignItems: 'start' }}>
        <div>
          <div style={s.card}>
            {/* Step progress */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', overflowX: 'auto', gap: 0 }}>
              {steps.map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                    background: i < currentStepIndex ? 'var(--g1)' : i === currentStepIndex ? 'var(--g1)' : 'var(--white)',
                    color: i <= currentStepIndex ? '#fff' : 'var(--ink3)',
                    border: i > currentStepIndex ? '1.5px solid var(--border)' : 'none',
                    boxShadow: i === currentStepIndex ? '0 0 0 4px rgba(255,107,0,.18)' : 'none',
                  }}>{i < currentStepIndex ? <Icon icon="ph:check-bold" style={{ fontSize: 13 }} /> : i + 1}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginLeft: 6, color: i === currentStepIndex ? 'var(--ink)' : i < currentStepIndex ? 'var(--g1)' : 'var(--ink3)', whiteSpace: 'nowrap' }}>{label}</div>
                  {i < steps.length - 1 && <div style={{ flex: 1, height: 1.5, background: i < currentStepIndex ? 'var(--g3)' : 'var(--border)', margin: '0 12px' }} />}
                </div>
              ))}
            </div>

            <div style={{ padding: '28px 28px 32px' }}>

              {/* STEP 1 — Account (only if not authenticated) */}
              {step === 1 && !authenticated && (
                <div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Your account</div>
                  <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 24, lineHeight: 1.6 }}>Sign in to get started. We'll verify you with a one-time code.</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--g-soft)', border: '0.5px solid var(--border-g)', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
                    <Icon icon="ph:info-bold" style={{ fontSize: 18, color: 'var(--g1)', flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}><strong>One-time setup.</strong> Once verified, every PayLink you create pays out to your account automatically.</div>
                  </div>
                  <button style={s.btn} onClick={() => login()}>
                    <Icon icon="ph:envelope-bold" /> Sign in with email or phone
                  </button>
                </div>
              )}

              {/* STEP 2 — Amount */}
              {step === 2 && (
                <div>
                  {!authenticated && <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font)', padding: 0 }}>← Back</button>}
                  <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>How much are you requesting?</div>
                  <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 24 }}>Set the amount and add a note.</div>

                  {authenticated && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--page)', borderRadius: 12, padding: '10px 14px', marginBottom: 20, border: '1px solid var(--border)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--g-soft)', color: 'var(--g1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                        {displayName.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{displayName}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{email || phone}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--g1)', fontWeight: 500, background: 'var(--g-soft)', padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}><Icon icon="ph:check-bold" style={{ fontSize: 11 }} /> Verified</div>
                    </div>
                  )}

                  <div style={{ background: amt > 0 ? 'var(--g-soft)' : 'var(--page)', border: `1.5px solid ${amt > 0 ? 'var(--border-g)' : 'var(--border)'}`, borderRadius: 14, padding: '20px 24px', marginBottom: 16, textAlign: 'center', transition: 'all .2s' }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Amount to request</div>
                    <div style={{ fontSize: 64, fontWeight: 700, color: amt > 0 ? 'var(--ink)' : 'var(--ink3)', letterSpacing: '-.06em', lineHeight: 1, marginBottom: 8 }}>
                      <span style={{ fontSize: '0.42em', verticalAlign: 'super', fontWeight: 500 }}>$</span>{amountStr}
                    </div>
                    {amt > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--g1)', background: 'rgba(255,107,0,.12)', padding: '4px 12px', borderRadius: 20 }}>{amt.toFixed(2)} USDC · Arc</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
                    {['1','2','3','4','5','6','7','8','9','.','0','del'].map(k => (
                      <button key={k} onClick={() => numpad(k)} style={{ background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 8px', fontFamily: 'var(--font)', fontSize: k === 'del' ? 17 : 20, fontWeight: 500, color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 54 }}>
                        {k === 'del' ? <Icon icon="ph:backspace-bold" /> : k}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 18px' }}>
                    <Icon icon="ph:pencil-simple-bold" style={{ fontSize: 18, color: 'var(--ink3)' }} />
                    <input style={{ border: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 14, color: 'var(--ink)', outline: 'none', flex: 1 }} placeholder="What's this for? e.g. Design work" value={note} onChange={e => setNote(e.target.value)} />
                  </div>

                  <button style={{ ...s.btn, opacity: amt <= 0 ? .4 : 1 }} disabled={amt <= 0} onClick={() => setStep(3)}>Continue →</button>
                </div>
              )}

              {/* STEP 3 — Receive */}
              {step === 3 && (
                <div>
                  <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font)', padding: 0 }}>← Back</button>
                  <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>How do you want to receive?</div>
                  <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 24 }}>Choose how the payment is delivered to you.</div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    {[
                      { id: 'crypto' as const, label: 'Crypto wallet', desc: 'Receive USDC instantly. $0 fee.', icon: 'ph:wallet-bold' },
                      { id: 'bank' as const, label: 'Bank / mobile money', desc: 'Receive local currency.', icon: 'ph:bank-bold' }
                    ].map(opt => (
                      <div key={opt.id} onClick={() => setReceiveType(opt.id)}
                        style={{ flex: 1, borderRadius: 16, padding: '16px 14px', border: `1.5px solid ${receiveType === opt.id ? 'var(--g1)' : 'var(--border)'}`, background: receiveType === opt.id ? 'var(--g-soft)' : 'var(--page)', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}>
                        <Icon icon={opt.icon} style={{ fontSize: 24, marginBottom: 8, color: receiveType === opt.id ? 'var(--g1)' : 'var(--ink3)' }} />
                        <div style={{ fontSize: 14, fontWeight: 500, color: receiveType === opt.id ? 'var(--g1)' : 'var(--ink2)', marginBottom: 4 }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{opt.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: receiveType === 'crypto' ? 'var(--g-soft)' : '#FFF8E8', border: `0.5px solid ${receiveType === 'crypto' ? 'var(--border-g)' : 'rgba(204,136,0,.2)'}`, borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
                    <Icon icon="ph:info-bold" style={{ fontSize: 18, color: receiveType === 'crypto' ? 'var(--g1)' : '#B8880A', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 13, color: receiveType === 'crypto' ? 'var(--g1)' : '#B8880A', lineHeight: 1.6 }}>
                      {receiveType === 'crypto'
                        ? <><strong>Your wallet is created automatically.</strong> USDC lands instantly when someone pays your link.</>
                        : <><strong>Bank setup required.</strong> Go to Bank settings to add your account. Powered by Yellow Card.</>}
                    </div>
                  </div>

                  {receiveType === 'bank' && (
                    <div style={{ marginBottom: 16 }}>
                      <a href="#" onClick={(e) => { e.preventDefault(); alert('Bank integration via Yellow Card coming soon!'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 14, border: '1.5px solid var(--border-g)', background: 'var(--g-soft)', textDecoration: 'none' }}>
                        <Icon icon="ph:bank-bold" style={{ fontSize: 18, color: 'var(--g1)' }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--g1)' }}>Set up bank account</div>
                          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Done once, used for all future payouts</div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: 'var(--g1)' }}>›</span>
                      </a>
                    </div>
                  )}

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', marginBottom: 10, display: 'block' }}>Link expires in</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {['24 hours', '7 days', '30 days', 'Never'].map(opt => (
                        <div key={opt} onClick={() => setExpiry(opt)}
                          style={{ padding: '8px 16px', borderRadius: 100, border: `1.5px solid ${expiry === opt ? 'var(--g1)' : 'var(--border)'}`, background: expiry === opt ? 'var(--g-soft)' : 'var(--page)', fontSize: 13, fontWeight: 500, color: expiry === opt ? 'var(--g1)' : 'var(--ink3)', cursor: 'pointer', transition: 'all .2s' }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    style={{ ...s.btn, opacity: creating || (receiveType === 'bank' && !hasBankSetup) ? .6 : 1 }}
                    disabled={creating || (receiveType === 'bank' && !hasBankSetup)}
                    onClick={generateLink}
                  >
                    <Icon icon="ph:link-bold" /> {creating ? 'Generating...' : (receiveType === 'bank' && !hasBankSetup) ? 'Bank setup required' : 'Generate my link'}
                  </button>
                </div>
              )}

              {/* STEP 4 — Share */}
              {step === 4 && generatedSlug && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--g-soft)', border: '1.5px solid var(--border-g)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--g1)', animation: 'popIn .5s cubic-bezier(.34,1.56,.64,1)' }}><Icon icon="ph:check-bold" /></div>
                    <div>
                      <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>Your link is live!</div>
                      <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Share it anywhere — anyone can pay with just a click.</div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--page)', borderRadius: 14, padding: '18px 20px', marginBottom: 20, border: '1.5px solid var(--border-g)' }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>Your PayLink</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--g1)', wordBreak: 'break-all', marginBottom: 10, fontFamily: 'monospace' }}>{linkUrl}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink3)' }}>
                      <Icon icon="ph:clock-bold" /> ${amt.toFixed(2)} · Expires in {expiry}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'WhatsApp', icon: 'simple-icons:whatsapp', href: shareUrls?.whatsapp },
                      { label: 'Telegram', icon: 'simple-icons:telegram', href: shareUrls?.telegram },
                      { label: 'Email', icon: 'ph:envelope-bold', href: shareUrls?.email },
                      { label: 'X / Twitter', icon: 'simple-icons:x', href: shareUrls?.x },
                      { label: 'QR code', icon: 'ph:qr-code-bold', action: () => alert('QR code generation coming soon') },
                      { label: 'Copy link', icon: 'ph:copy-bold', action: () => { navigator.clipboard.writeText(linkUrl); setToast('Link copied!'); setTimeout(() => setToast(null), 3000) } },
                    ].map(item => (
                      <div key={item.label}
                        onClick={() => item.href ? window.open(item.href, '_blank') : item.action?.()}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 8px', cursor: 'pointer', transition: 'all .2s' }}>
                        <Icon icon={item.icon} style={{ fontSize: 22, color: 'var(--ink2)' }} />
                        <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button style={{ ...s.btn, marginTop: 0, width: 'auto', flex: 1 }} onClick={() => router.push('/dashboard')}>
                      <Icon icon="ph:squares-four-bold" /> Go to dashboard
                    </button>
                    <button style={{ ...s.btn, marginTop: 0, width: 'auto', flex: 1, background: 'var(--page)', color: 'var(--ink2)', border: '1.5px solid var(--border)', boxShadow: 'none' }}
                      onClick={() => { setStep(2); setAmountStr('0'); setNote(''); setGeneratedSlug('') }}>
                      <Icon icon="ph:plus-bold" /> Create another
                    </button>
                  </div>
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
              { icon: 'ph:camera-bold', title: 'Instagram bio', desc: 'Put your PayLink in your bio so followers can pay you directly.' },
              { icon: 'simple-icons:whatsapp', title: 'WhatsApp', desc: 'Send the link in a chat. They pay with one click, no app needed.' },
              { icon: 'ph:infinity-bold', title: 'Reuse forever', desc: 'Set expiry to "Never" and the link collects payments forever.' },
            ].map(tip => (
              <div key={tip.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 12 }}>
                <Icon icon={tip.icon} style={{ fontSize: 15, flexShrink: 0, marginTop: 1, color: 'var(--g1)' }} />
                <div style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--ink2)', fontWeight: 500 }}>{tip.title}</strong> — {tip.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes toastUp { from{transform:translate(-50%,20px);opacity:0} to{transform:translate(-50%,0);opacity:1} }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: 'var(--ink)', color: '#fff', padding: '12px 24px', borderRadius: 100, fontSize: 14, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,.15)', zIndex: 1000, animation: 'toastUp .3s ease forwards', display: 'flex', alignItems: 'center' }}>
          <Icon icon="ph:check-circle-bold" style={{ fontSize: 16, marginRight: 6 }} />{toast}
        </div>
      )}
    </div>
  )
}
