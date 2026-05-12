import { AppKit } from '@circle-fin/app-kit'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'

const kit = new AppKit()

export interface SendPaymentParams {
  provider: any
  recipientAddress: string
  amount: string
}

export interface SendPaymentResult {
  success: boolean
  txHash?: string
  explorerUrl?: string
  error?: string
  settlementMs?: number
}

export async function sendPayment({
  provider,
  recipientAddress,
  amount,
}: SendPaymentParams): Promise<SendPaymentResult> {
  const start = Date.now()

  try {
    const adapter = createViemAdapterFromProvider({ provider })

    const result = await kit.send({
      from: {
        adapter,
        chain: 'Arc_Testnet',
      },
      to: recipientAddress,
      amount: amount,
      token: 'USDC',
    })

    const settlementMs = Date.now() - start

    if (result.state === 'success') {
      return {
        success: true,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        settlementMs,
      }
    } else {
      return {
        success: false,
        error: `Payment failed with state: ${result.state}`,
        settlementMs,
      }
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Payment failed',
      settlementMs: Date.now() - start,
    }
  }
}

export async function estimatePayment({
  provider,
  recipientAddress,
  amount,
}: SendPaymentParams) {
  try {
    const adapter = createViemAdapterFromProvider({ provider })

    const estimate = await kit.estimateSend({
      from: {
        adapter,
        chain: 'Arc_Testnet',
      },
      to: recipientAddress,
      amount,
      token: 'USDC',
    })

    return { success: true, estimate }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}