'use client'

import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { sendPayment, estimatePayment } from '@/lib/arc'
import type { SendPaymentResult } from '@/lib/arc'

export type PaymentStatus =
  | 'idle'
  | 'connecting'
  | 'estimating'
  | 'sending'
  | 'success'
  | 'error'

export interface UsePaymentReturn {
  status: PaymentStatus
  result: SendPaymentResult | null
  error: string | null
  pay: (recipientAddress: string, amount: string, linkId?: string) => Promise<void>
  reset: () => void
}

export function usePayment(): UsePaymentReturn {
  const { ready, authenticated, login } = usePrivy()
  const { wallets } = useWallets()
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [result, setResult] = useState<SendPaymentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pay = async (
    recipientAddress: string,
    amount: string,
    linkId?: string
  ) => {
    try {
      setStatus('connecting')
      setError(null)

      if (!authenticated) {
        await login()
        return
      }

      const embeddedWallet = wallets.find(w => w.walletClientType === 'privy')

      if (!embeddedWallet) {
        throw new Error('No embedded wallet found. Please try again.')
      }

      await embeddedWallet.switchChain(1038)

      const provider = await embeddedWallet.getEthereumProvider()

      setStatus('estimating')

      await estimatePayment({
        provider,
        recipientAddress,
        amount,
      })

      setStatus('sending')

      const paymentResult = await sendPayment({
        provider,
        recipientAddress,
        amount,
      })

      if (paymentResult.success) {
        await fetch('/api/transactions/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            link_id: linkId || null,
            sender_wallet: embeddedWallet.address,
            recipient_wallet: recipientAddress,
            amount,
            tx_hash: paymentResult.txHash,
            payment_method: 'email_otp',
          }),
        })

        setResult(paymentResult)
        setStatus('success')
      } else {
        throw new Error(paymentResult.error || 'Payment failed')
      }
    } catch (err: any) {
      setError(err?.message || 'Payment failed. Please try again.')
      setStatus('error')
    }
  }

  const reset = () => {
    setStatus('idle')
    setResult(null)
    setError(null)
  }

  return { status, result, error, pay, reset }
}