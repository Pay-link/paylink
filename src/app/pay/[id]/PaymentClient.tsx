'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import type { PayLink, PaymentMethod } from '@/types'
import { createWalletClient, custom, parseUnits } from 'viem'
import { useWallets } from '@privy-io/react-auth'
import {
  formatUSD,
  getExpiryLabel,
  getInitials,
  shortenTxHash,
} from '@/lib/utils'
import { Icon } from '@iconify/react'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
}

const usdcAddress = '0x3600000000000000000000000000000000000000' as const
const usdcAbi = [
  {
    "type": "function",
    "name": "transfer",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "value", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable"
  }
] as const

interface PaymentClientProps {
  link: PayLink | null
  error: string | null
  slug: string
}

type PayState = 'amount' | 'method' | 'email' | 'otp' | 'wallet' | 'card' | 'processing' | 'success'

export function PaymentClient({ link, error, slug }: PaymentClientProps) {
  const { login, authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const router = useRouter()

  const isOpen = link?.amount === 0
  const [state, setState] = useState<PayState>(isOpen ? 'amount' : 'method')
  const [openAmountStr, setOpenAmountStr] = useState('0')
  const [openNote, setOpenNote] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('email_otp')
  const [contact, setContact] = useState('')
  const [txHash, setTxHash] = useState('')
  const [settlementMs, setSettlementMs] = useState(0)
  const [step, setStep] = useState('Step 1 of 2')
  const [wantsToPay, setWantsToPay] = useState(false)

  const openAmt = parseFloat(openAmountStr) || 0
  const effectiveAmount = isOpen ? openAmt : (link?.amount ?? 0)

  const openNumpad = (key: string) => {
    setOpenAmountStr(prev => {
      if (key === 'del') return prev.length > 1 ? prev.slice(0, -1) : '0'
      if (key === '.') return prev.includes('.') ? prev : prev + '.'
      if (prev === '0') return key
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev
      return prev + key
    })
  }

  // Auto-pay when authenticated after clicking pay
  useEffect(() => {
    if (wantsToPay && authenticated && wallets.length > 0) {
      setWantsToPay(false)
      handleProcess()
    }
  }, [wantsToPay, authenticated, wallets])

  // Link not found or error
  if (error || !link) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 62px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <Icon icon="ph:link-break-bold" style={{ fontSize: 48, marginBottom: 16, color: 'var(--ink3)' }} />
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
            Create your own ZaPay
          </a>
        </div>
      </div>
    )
  }

  const handlePayNow = () => {
    if (authenticated && user?.id === link?.owner_id) {
      alert("You cannot pay your own link!")
      return
    }
    if (selectedMethod === 'wallet') {
      setWantsToPay(true)
      if (!authenticated) login()
    }
    else if (selectedMethod === 'card') { setState('card'); setStep('Step 2 of 2') }
    else { setState('email'); setStep('Step 2 of 2') }
  }

  const handleProcess = async () => {
    if (!link) return
    setState('processing')
    const start = Date.now()

    try {
      const activeWallet = wallets[0]
      if (!activeWallet) throw new Error('No active wallet found')

      const provider = await activeWallet.getEthereumProvider()

      // Use the raw EIP-1193 method — Privy's switchChain wrapper throws
      // even when already on the correct chain.
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x4CEF52' }], // 5042002 decimal
        })
      } catch (_) {}

      // Omit `chain` from walletClient and writeContract: viem's
      // assertCurrentChain() fires when chain is defined and throws
      // "invalid chain ID" before the tx reaches the wallet. Without it,
      // Privy's embedded wallet fills in chainId 1038 from its own config.
      const walletClient = createWalletClient({
        account: activeWallet.address as `0x${string}`,
        transport: custom(provider),
      })

      const amountRaw = parseUnits(effectiveAmount.toString(), 6)
      const recipient = link.owner_wallet as `0x${string}`

      const realTxHash = await walletClient.writeContract({
        address: usdcAddress,
        abi: usdcAbi,
        functionName: 'transfer',
        args: [recipient, amountRaw],
        chain: null, // null = skip viem's chain ID assertion
      })

      const elapsed = Date.now() - start
      if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed))

      setTxHash(realTxHash)
      setSettlementMs(Date.now() - start)

      await fetch('/api/transactions/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link_id: link.id,
          sender_wallet: activeWallet.address,
          recipient_id: link.owner_id,
          recipient_wallet: link.owner_wallet,
          amount: effectiveAmount, // use effectiveAmount so open links record the actual amount paid
          note: isOpen ? openNote : link.note,
          tx_hash: realTxHash,
          payment_method: selectedMethod,
        }),
      })

      setState('success')
    } catch (err: any) {
      console.error('Payment Error:', err)
      alert(err.message || 'Payment failed')
      setState('method') // always return to method selection on failure
      setStep('Step 1 of 2')
    }
  }

  return (
    <div style={{
      background: 'var(--page)',
      minHeight: 'calc(100vh - 62px)',
    }}>

      <div className="page-header" style={{ padding: '16px 40px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', marginBottom: 6 }}>
          {isOpen ? `Pay ${link?.owner_name || 'someone'}` : 'Complete your payment'}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink3)' }}>
          {isOpen ? 'Enter the amount you want to send and a note, then choose how to pay.' : 'Review the details below and choose how you\'d like to pay.'}
        </p>
      </div>

      {/* Open link: amount + note input screen */}
      {state === 'amount' && isOpen && (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 60px' }}>
          <div style={{ background: 'var(--white)', borderRadius: 20, border: '1px solid var(--border)', padding: '28px 28px 32px' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>How much do you want to send?</div>
            <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 20 }}>You're paying {link?.owner_name || 'this person'} — enter any amount.</div>

            <div style={{ background: openAmt > 0 ? 'var(--g-soft)' : 'var(--page)', border: `1.5px solid ${openAmt > 0 ? 'var(--border-g)' : 'var(--border)'}`, borderRadius: 14, padding: '20px 24px', marginBottom: 16, textAlign: 'center', transition: 'all .2s' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Amount</div>
              <div style={{ fontSize: 56, fontWeight: 700, color: openAmt > 0 ? 'var(--ink)' : 'var(--ink3)', letterSpacing: '-.06em', lineHeight: 1, marginBottom: 8 }}>
                <span style={{ fontSize: '0.42em', verticalAlign: 'super', fontWeight: 500 }}>$</span>{openAmountStr}
              </div>
              {openAmt > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--g1)', background: 'rgba(37,92,180,.12)', padding: '4px 12px', borderRadius: 20 }}>{openAmt.toFixed(2)} USDC · Arc</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
              {['1','2','3','4','5','6','7','8','9','.','0','del'].map(k => (
                <button key={k} onClick={() => openNumpad(k)} style={{ background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '12px 8px', fontFamily: 'var(--font)', fontSize: k === 'del' ? 17 : 20, fontWeight: 500, color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 50 }}>
                  {k === 'del' ? <Icon icon="ph:backspace-bold" /> : k}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
              <Icon icon="ph:pencil-simple-bold" style={{ fontSize: 18, color: 'var(--ink3)' }} />
              <input style={{ border: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 14, color: 'var(--ink)', outline: 'none', flex: 1 }} placeholder="Add a note (e.g. Thanks for the coffee)" value={openNote} onChange={e => setOpenNote(e.target.value)} />
            </div>

            <button
              style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '17px 28px', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 6px 20px rgba(37,92,180,.28)', opacity: openAmt <= 0 ? .4 : 1 }}
              disabled={openAmt <= 0}
              onClick={() => setState('method')}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Two column layout — hidden during open link amount entry */}
      {state !== 'amount' && <div className="two-col-layout" style={{
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
                  fontSize: 10, color: '#fff',
                }}><Icon icon="ph:check-bold" /></div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>
                  {link.owner_name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink3)' }}>
                  {link.owner_email || `zapay.xyz/pay/${slug}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>Amount</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em' }}>
                  {formatUSD(effectiveAmount)}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 500, color: 'var(--g1)',
                  background: 'var(--g-soft)', padding: '3px 10px', borderRadius: 20,
                  marginTop: 4,
                }}>
                  {effectiveAmount.toFixed(2)} USDC · Arc
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
                <Icon icon="ph:lightning-bold" style={{ color: 'var(--g1)' }} /> Settles in <strong style={{ color: 'var(--ink2)' }}>&lt;1 second</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--ink3)' }}>
                <Icon icon="ph:clock-bold" /> {getExpiryLabel(link.expiry)}
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
                          boxShadow: selectedMethod === method.id ? '0 0 0 3px rgba(37,92,180,.12)' : 'none',
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
                      { key: 'You send', val: formatUSD(effectiveAmount), green: false },
                      { key: 'Gas fee', val: '$0.00', green: true },
                      { key: 'Total', val: formatUSD(effectiveAmount), green: false, bold: true },
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
                    {selectedMethod === 'wallet'
                      ? <><Icon icon="ph:link-bold" /> Connect Wallet to Pay</>
                      : <><Icon icon="ph:lock-bold" /> Continue to pay · {formatUSD(effectiveAmount)}</>}
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
                    onClick={() => {
                      if (!authenticated && link && contact && (contact === link.owner_email)) {
                        alert("You cannot pay your own link!")
                        return
                      }
                      setWantsToPay(true)
                      if (!authenticated) {
                        login()
                      }
                    }}
                    disabled={(!authenticated && (!contact || contact.length < 5))}
                  >
                    {authenticated ? <><Icon icon="ph:lock-bold" /> Secure Checkout</> : <><Icon icon="ph:envelope-bold" /> Verify to pay</>}
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
                    Settling {formatUSD(effectiveAmount)} on Arc Network.<br />
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
                    <Icon icon="ph:check-bold" style={{ fontSize: 28 }} />
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                    Payment sent!
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--g1)', marginBottom: 8 }}>
                    {formatUSD(effectiveAmount)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                    <span style={{ fontSize: 12, background: 'var(--g-soft)', color: 'var(--g1)', padding: '4px 12px', borderRadius: 20, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon icon="ph:lightning-bold" /> Settled in {(settlementMs / 1000).toFixed(1)}s
                    </span>
                    <span style={{ fontSize: 12, background: 'var(--page)', color: 'var(--ink3)', padding: '4px 12px', borderRadius: 20 }}>
                      Arc Network
                    </span>
                  </div>

                  {/* Receipt */}
                  <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 20, textAlign: 'left' }}>
                    {[
                      { key: 'To', val: link.owner_name },
                      { key: 'Amount', val: `${formatUSD(effectiveAmount)} USDC`, green: true },
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
                    <Icon icon="ph:house-bold" /> Done
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
              { key: 'Amount', val: formatUSD(effectiveAmount) },
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
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{formatUSD(effectiveAmount)}</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>USDC</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--g-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--g1)', flexShrink: 0 }}>
              <Icon icon="ph:shield-check-bold" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', marginBottom: 3 }}>Secure checkout</div>
              <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6 }}>
                Protected by Arc Network. Non-custodial. Your funds stay in your control.
              </div>
            </div>
          </div>
        </div>
      </div>}
      <style>{`
        @media(max-width:768px){
          .two-col-layout{grid-template-columns:1fr!important;padding:0 16px 140px!important;gap:0!important}
          .two-col-layout>div:last-child{display:none!important}
          .page-header{padding:12px 16px 20px!important}
          .card{padding:16px 18px!important}
        }
      `}</style>
      <MobileBottomNav />
    </div>
  )
}
