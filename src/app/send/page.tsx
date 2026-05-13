'use client'

import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/layout/Nav'
import { useState } from 'react'
import { isValidContact } from '@/lib/utils'
import { Icon } from '@iconify/react'

type Step = 1 | 2 | 3 | 4

export default function SendPage() {
  const { authenticated, login, ready } = usePrivy()
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [senderContact, setSenderContact] = useState('')
  const [recipient, setRecipient] = useState({ name: '', contact: '', initials: '' })
  const [amountStr, setAmountStr] = useState('0')
  const [note, setNote] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('email_otp')

  useEffect(() => {
    if (ready && !authenticated) login()
  }, [ready, authenticated])

  const nextStep = () => setStep(s => Math.min(s + 1, 4) as Step)
  const prevStep = () => setStep(s => Math.max(s - 1, 1) as Step)

  const numpad = (key: string) => {
    setAmountStr(prev => {
      if (key === 'del') return prev.length > 1 ? prev.slice(0, -1) : '0'
      if (key === '.') return prev.includes('.') ? prev : prev + '.'
      if (prev === '0') return key
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev
      return prev + key
    })
  }

  const amt = parseFloat(amountStr) || 0

  const s = {
    page: { background: 'var(--page)', minHeight: '100vh', overflowX: 'hidden' } as React.CSSProperties,
    main: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, padding: '0 40px 60px', maxWidth: 1100, margin: '0 auto', alignItems: 'start' } as React.CSSProperties,
    card: { background: 'var(--white)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.4)', overflow: 'hidden', minWidth: 0 } as React.CSSProperties,
    title: { fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', marginBottom: 6 } as React.CSSProperties,
    sub: { fontSize: 15, color: 'var(--ink3)' } as React.CSSProperties,
    input: { width: '100%', background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 18px', fontFamily: 'var(--font)', fontSize: 15, color: 'var(--ink)', outline: 'none' } as React.CSSProperties,
    btn: { width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '17px 28px', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, marginBottom: 14, boxShadow: '0 6px 20px rgba(255,107,0,.28)' } as React.CSSProperties,
  }

  return (
    <div style={s.page}>
      <Nav variant="app" pageName="Send money" />
      <div className="page-header" style={{ padding: '16px 40px 24px' }}>
        <h1 style={s.title}>Send money</h1>
        <p style={s.sub}>Send USDC to anyone using their email or phone. Settles in under a second.</p>
      </div>

      <div className="two-col-layout" style={s.main}>
        <div>
          <div style={s.card}>
            {/* Step progress */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', overflowX: 'auto', gap: 0 }}>
              {[1,2,3,4].map((n, i) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 4 ? 1 : 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                    background: n < step ? 'var(--g1)' : n === step ? 'var(--g1)' : 'var(--white)',
                    color: n <= step ? '#fff' : 'var(--ink3)',
                    border: n > step ? '1.5px solid var(--border)' : 'none',
                    boxShadow: n === step ? '0 0 0 4px rgba(255,107,0,.18)' : 'none',
                  }}>{n < step ? <Icon icon="ph:check-bold" style={{ fontSize: 13 }} /> : n}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginLeft: 6, color: n === step ? 'var(--ink)' : n < step ? 'var(--g1)' : 'var(--ink3)', whiteSpace: 'nowrap' }}>
                    {['Identity','Recipient','Amount','Payment'][n-1]}
                  </div>
                  {n < 4 && <div style={{ flex: 1, height: 1.5, background: n < step ? 'var(--g3)' : 'var(--border)', margin: '0 12px' }} />}
                </div>
              ))}
            </div>

            <div style={{ padding: '28px 28px 32px' }}>

              {/* STEP 1 */}
              {step === 1 && (
                <div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Who are you?</div>
                  <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 24, lineHeight: 1.6 }}>Enter your email or phone. We'll verify you with a one-time code.</div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', marginBottom: 8, display: 'block' }}>Your email or phone</label>
                  <input style={s.input} type="text" placeholder="you@email.com or +234 800 000 0000" value={senderContact} onChange={e => setSenderContact(e.target.value)} />
                  <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 7, lineHeight: 1.6 }}>A verification code will be sent. No account created — your wallet is set up automatically.</div>
                  <button style={{ ...s.btn, opacity: !isValidContact(senderContact) ? .4 : 1 }} disabled={!isValidContact(senderContact)} onClick={nextStep}>
                    <Icon icon="ph:envelope-bold" /> Verify to pay
                  </button>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div>
                  <button onClick={prevStep} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font)', padding: 0 }}>← Back</button>
                  <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Send to who?</div>
                  <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 24, lineHeight: 1.6 }}>Enter the recipient's email or phone number.</div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', marginBottom: 8, display: 'block' }}>Recipient's email or phone</label>
                  <input style={{ ...s.input, marginBottom: 16 }} type="text" placeholder="them@email.com or +44 700 000 0000" value={recipient.contact} onChange={e => setRecipient({ name: e.target.value, contact: e.target.value, initials: e.target.value.slice(0,2).toUpperCase() })} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 14, background: 'var(--page)', border: '1px dashed var(--border)' }}>
                    <Icon icon="ph:users-bold" style={{ fontSize: 20, color: 'var(--ink4)', flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: 'var(--ink4)' }}>No recent contacts yet. Send to someone and they'll appear here.</div>
                  </div>
                  <button style={{ ...s.btn, opacity: !recipient.contact ? .4 : 1 }} disabled={!recipient.contact} onClick={nextStep}>
                    Continue →
                  </button>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div>
                  <button onClick={prevStep} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font)', padding: 0 }}>← Back</button>
                  <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>How much?</div>
                  <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 24, lineHeight: 1.6 }}>Enter the amount you'd like to send.</div>

                  {/* Recipient preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, border: '1.5px solid var(--border-g)', background: 'var(--page)', marginBottom: 20 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--g-soft)', color: 'var(--g1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{recipient.initials}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{recipient.name}</div><div style={{ fontSize: 12, color: 'var(--ink3)' }}>{recipient.contact}</div></div>
                    <div style={{ marginLeft: 'auto', width: 24, height: 24, borderRadius: '50%', background: 'var(--g1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}><Icon icon="ph:check-bold" /></div>
                  </div>

                  {/* Amount display */}
                  <div style={{ background: amt > 0 ? 'var(--g-soft)' : 'var(--page)', border: `1.5px solid ${amt > 0 ? 'var(--border-g)' : 'var(--border)'}`, borderRadius: 14, padding: '20px 24px', marginBottom: 16, textAlign: 'center', transition: 'all .2s' }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Amount to send</div>
                    <div style={{ fontSize: 64, fontWeight: 700, color: amt > 0 ? 'var(--ink)' : 'var(--ink3)', letterSpacing: '-.06em', lineHeight: 1, marginBottom: 8 }}>
                      <span style={{ fontSize: '0.42em', verticalAlign: 'super', fontWeight: 500 }}>$</span>{amountStr}
                    </div>
                    {amt > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--g1)', background: 'rgba(255,107,0,.12)', padding: '4px 12px', borderRadius: 20 }}>{amt.toFixed(2)} USDC · Arc</span>}
                  </div>

                  {/* Numpad */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
                    {['1','2','3','4','5','6','7','8','9','.','0','del'].map(k => (
                      <button key={k} onClick={() => numpad(k)} style={{ background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 8px', fontFamily: 'var(--font)', fontSize: k === 'del' ? 17 : 20, fontWeight: 500, color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 54 }}>
                        {k === 'del' ? <Icon icon="ph:backspace-bold" /> : k}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 18px', marginBottom: 0 }}>
                    <Icon icon="ph:pencil-simple-bold" style={{ fontSize: 18, color: 'var(--ink3)' }} />
                    <input style={{ border: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 14, color: 'var(--ink)', outline: 'none', flex: 1 }} placeholder="Add a note (optional)" value={note} onChange={e => setNote(e.target.value)} />
                  </div>

                  <button style={{ ...s.btn, opacity: amt <= 0 ? .4 : 1 }} disabled={amt <= 0} onClick={nextStep}>
                    Continue →
                  </button>
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div>
                  <button onClick={prevStep} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font)', padding: 0 }}>← Back</button>
                  <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>How are you paying?</div>
                  <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 24, lineHeight: 1.6 }}>Choose how you'd like to fund this payment.</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, border: '1.5px solid var(--border-g)', background: 'var(--page)', marginBottom: 20 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--g-soft)', color: 'var(--g1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{recipient.initials}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 500 }}>{recipient.name}</div><div style={{ fontSize: 12, color: 'var(--ink3)' }}>Sending <strong style={{ color: 'var(--g1)' }}>${amt.toFixed(2)}</strong> USDC</div></div>
                    <div style={{ marginLeft: 'auto', width: 24, height: 24, borderRadius: '50%', background: 'var(--g1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}><Icon icon="ph:check-bold" /></div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    {[
                      { id: 'email_otp', label: 'Email or phone OTP', desc: 'Wallet created automatically — no crypto needed', badge: '$0 fee', rec: true },
                      { id: 'wallet', label: 'Crypto wallet', desc: 'MetaMask, Coinbase Wallet, WalletConnect', badge: null, rec: false },
                      { id: 'card', label: 'Card or bank transfer', desc: 'Debit card, bank transfer, mobile money', badge: '~1.5%', rec: false },
                    ].map(m => (
                      <div key={m.id} onClick={() => setSelectedMethod(m.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 16, border: `1.5px solid ${selectedMethod === m.id ? 'var(--g1)' : 'var(--border)'}`, borderRadius: 16, padding: '16px 18px', cursor: 'pointer', background: selectedMethod === m.id ? 'var(--g-soft)' : 'var(--page)', position: 'relative' }}>
                        {m.rec && <div style={{ position: 'absolute', top: -10, left: 18, fontSize: 10, fontWeight: 700, background: 'var(--g1)', color: '#fff', padding: '3px 10px', borderRadius: 20 }}>Recommended</div>}
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${selectedMethod === m.id ? 'var(--g1)' : 'var(--border)'}`, background: selectedMethod === m.id ? 'var(--g1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {selectedMethod === m.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>{m.label}</div>
                          <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{m.desc}</div>
                        </div>
                        {m.badge && <div style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20, background: m.id === 'card' ? 'rgba(204,136,0,.1)' : 'var(--g-soft)', color: m.id === 'card' ? '#B8880A' : 'var(--g1)' }}>{m.badge}</div>}
                      </div>
                    ))}
                  </div>

                  <button style={s.btn} onClick={() => {
                    const params = new URLSearchParams({
                      flow: 'send',
                      amount: amt.toFixed(2),
                      to: recipient.name || recipient.contact,
                      contact: recipient.contact,
                      note: note || '',
                    })
                    router.push(`/verify?${params.toString()}`)
                  }}>
                    <Icon icon="ph:lock-bold" /> Send ${amt.toFixed(2)}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                    {['256-bit encrypted', 'Non-custodial', 'Powered by Arc'].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink3)' }}><Icon icon="ph:shield-bold" /> {item}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 82 }}>
          <div style={{ ...s.card, padding: '22px 24px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Payment summary</div>
            <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 18 }}>Details update as you go</div>
            <div style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>You are sending</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: amt > 0 ? 'var(--g1)' : 'var(--ink)', letterSpacing: '-.04em' }}>${amt > 0 ? amt.toFixed(2) : '—'}</div>
              {amt > 0 && <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 4 }}>{amt.toFixed(2)} USDC · Arc Network</div>}
            </div>
            {[
              { key: 'To', val: recipient.name || 'Not set yet', empty: !recipient.name },
              { key: 'For', val: note || 'No note', empty: !note },
              { key: 'Gas fee', val: '$0.00', green: true },
              { key: 'Network', val: 'Arc · USDC' },
              { key: 'Settlement', val: '<1 second', green: true },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{row.key}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: (row as any).green ? 'var(--g1)' : (row as any).empty ? 'var(--ink3)' : 'var(--ink)', fontStyle: (row as any).empty ? 'italic' : 'normal' }}>{row.val}</span>
              </div>
            ))}
          </div>

          <div style={{ ...s.card, padding: '20px 22px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>How it works</div>
            {[
              { n: '1', text: 'Verify yourself with a one-time code sent to your email or phone.' },
              { n: '2', text: 'Enter recipient details — just their email or phone. No wallet address needed.' },
              { n: '3', text: 'Payment settles in under a second on Arc. Recipient is notified instantly.' },
            ].map(item => (
              <div key={item.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--g-soft)', border: '1px solid var(--border-g)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--g1)', flexShrink: 0, marginTop: 1 }}>{item.n}</div>
                <div style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.5 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
