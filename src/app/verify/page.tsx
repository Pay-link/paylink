'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { createWalletClient, custom, parseUnits, padHex } from 'viem'
import { escrowAbi, ESCROW_ADDRESS } from '@/lib/escrowAbi'

const usdcAddress = '0x3600000000000000000000000000000000000000' as const
const usdcTransferAbi = [
  {
    type: 'function', name: 'transfer',
    inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'approve',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

function VerifyContent() {
  const { authenticated, login, ready, user } = usePrivy()
  const { wallets } = useWallets()
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
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Execute the send: on-chain transfer for registered recipients, escrow for unregistered
  const handleConfirmSend = async () => {
    if (!user?.id) return
    setSending(true)
    setSendError('')

    try {
      const userEmail = user.email?.address || null
      const userName = userEmail?.split('@')[0] || user.phone?.number || 'Someone'
      const base = new URLSearchParams({ flow, amount, to, contact, note })

      if (flow === 'send') {
        // ── Registered recipient: real on-chain USDC transfer ──────────────────

        // 1. Look up recipient's wallet address
        const lookupRes = await fetch(`/api/users/lookup?contact=${encodeURIComponent(contact || to)}`)
        const lookupJson = await lookupRes.json()

        if (!lookupJson.registered) {
          setSendError('Recipient not found. Please check the email or phone number.')
          setSending(false)
          return
        }
        if (!lookupJson.wallet_address) {
          setSendError("Recipient hasn't set up their wallet yet. Ask them to log into ZaPay first.")
          setSending(false)
          return
        }

        // 2. Get sender's embedded Privy wallet
        const activeWallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0]
        if (!activeWallet) {
          setSendError('Wallet not found. Please refresh and try again.')
          setSending(false)
          return
        }

        // 3. Switch to Arc Testnet
        const provider = await activeWallet.getEthereumProvider()
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x4CEF52' }], // Arc Testnet: 5042002
          })
        } catch (_) { /* already on correct chain */ }

        // 4. Execute on-chain USDC transfer
        const walletClient = createWalletClient({
          account: activeWallet.address as `0x${string}`,
          transport: custom(provider),
        })
        const amountRaw = parseUnits(amount, 6) // USDC has 6 decimals
        const txHash = await walletClient.writeContract({
          address: usdcAddress,
          abi: usdcTransferAbi,
          functionName: 'transfer',
          args: [lookupJson.wallet_address as `0x${string}`, amountRaw],
          chain: null, // skip viem chain assertion — Privy handles chain ID
        })

        // 5. Record in DB
        await fetch('/api/transactions/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender_id: user.id,
            sender_email: userEmail,
            sender_wallet: activeWallet.address,
            recipient_id: lookupJson.id,
            recipient_wallet: lookupJson.wallet_address,
            amount: parseFloat(amount),
            note,
            tx_hash: txHash,
            payment_method: 'wallet',
          }),
        })

        // 6. Go to success
        if (txHash) base.set('tx_hash', txHash)
        router.push(`/success?${base.toString()}`)

      } else {
        // ── Unregistered recipient: escrow / pending claim ─────────────────────
        
        // 1. Create the claim record to get the token
        const claimRes = await fetch('/api/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: user.id,
            senderName: userName,
            senderEmail: userEmail,
            recipientEmail: contact || to,
            amount: parseFloat(amount),
            note,
          }),
        })
        const claimJson = await claimRes.json()
        if (!claimRes.ok) {
          setSendError(claimJson.error || 'Failed to create claim')
          setSending(false)
          return
        }

        // 2. Perform On-Chain Escrow Deposit if contract is configured
        let depositTxHash = ''
        if (ESCROW_ADDRESS && ESCROW_ADDRESS !== '0x') {
          const activeWallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0]
          if (!activeWallet) {
             setSendError('Wallet not found')
             setSending(false)
             return
          }
          const provider = await activeWallet.getEthereumProvider()
          try { await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x4CEF52' }] }) } catch (_) {}
          
          const walletClient = createWalletClient({
            account: activeWallet.address as `0x${string}`,
            transport: custom(provider),
          })
          const amountRaw = parseUnits(amount, 6)
          const claimHash = padHex(`0x${claimJson.token}`, { size: 32 })
          
          try {
            await walletClient.writeContract({
              address: usdcAddress,
              abi: usdcTransferAbi,
              functionName: 'approve',
              args: [ESCROW_ADDRESS, amountRaw],
              chain: null,
            })
            depositTxHash = await walletClient.writeContract({
              address: ESCROW_ADDRESS,
              abi: escrowAbi,
              functionName: 'deposit',
              args: [claimHash, amountRaw],
              chain: null,
            })
          } catch (err: any) {
             console.error('Escrow deposit failed', err)
             setSendError('Failed to deposit funds to escrow')
             setSending(false)
             return
          }
        }

        // 3. Record transaction in database
        const sendRes = await fetch('/api/transactions/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: user.id,
            senderEmail: userEmail,
            recipientContact: contact || to,
            amount: parseFloat(amount),
            note: note || 'Escrow hold',
          }),
        })
        const sendJson = await sendRes.json()
        if (!sendRes.ok && (!ESCROW_ADDRESS || ESCROW_ADDRESS === '0x')) {
          setSendError(sendJson.error)
          setSending(false)
          return
        }

        if (claimJson.token) base.set('claim_token', claimJson.token)
        if (typeof depositTxHash !== 'undefined' && depositTxHash) base.set('tx_hash', depositTxHash)
        router.push(`/success?${base.toString()}`)
      }
    } catch (err: any) {
      console.error('Send error:', err)
      setSendError(err.message || 'Transaction failed. Please try again.')
    } finally {
      setSending(false)
    }
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

  // After OTP login completes, trigger the send
  useEffect(() => {
    if (ready && authenticated && verifying && user) {
      handleConfirmSend()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            za<span style={{ color: 'var(--g1)' }}>pay</span>
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
              {sendError && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(229,57,53,.08)', border: '1.5px solid rgba(229,57,53,.25)', borderRadius: 14, padding: '14px 16px', marginTop: 16, marginBottom: 4 }}>
                  <Icon icon="ph:warning-circle-bold" style={{ fontSize: 18, color: '#E53935', flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 13, color: '#E53935', lineHeight: 1.5 }}>{sendError}</div>
                </div>
              )}
              <button
                onClick={handleConfirmSend}
                disabled={sending}
                style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '17px', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, marginBottom: 12, boxShadow: '0 6px 20px rgba(37,92,180,.28)' }}>
                <Icon icon={sending ? 'ph:spinner-bold' : 'ph:paper-plane-right-bold'} style={sending ? { animation: 'spin 1s linear infinite' } : {}} />
                {sending ? 'Processing…' : `Confirm & send${amount ? ` $${amount}` : ''}`}
              </button>
              <button onClick={() => router.back()} disabled={sending}
                style={{ width: '100%', background: 'transparent', color: 'var(--ink3)', border: '1.5px solid var(--border)', borderRadius: 100, padding: '13px', fontFamily: 'var(--font)', fontSize: 14, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.5 : 1 }}>
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
          za<span style={{ color: 'var(--g1)' }}>pay</span>
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
                  boxShadow: i === otp.length ? '0 0 0 3px rgba(37,92,180,.12)' : 'none',
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
                marginBottom: 14, boxShadow: '0 6px 20px rgba(37,92,180,.25)',
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
        @keyframes spin{to{transform:rotate(360deg)}}
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
