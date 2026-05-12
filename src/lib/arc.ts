import { AppKit } from '@circle-fin/app-kit'
import { createViemAdapterFromWalletClient } from '@circle-fin/adapter-viem-v2'
import type { WalletClient } from 'viem'

// Single AppKit instance
const kit = new AppKit()

export interface SendPaymentParams {
  walletClient: WalletClient
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
  walletClient,
  recipientAddress,
  amount,
}: SendPaymentParams): Promise<SendPaymentResult> {
  const start = Date.now()

  try {
    // Create Viem adapter from Privy wallet client
    const adapter = createViemAdapterFromWalletClient({ walletClient })

    // Send USDC on Arc Testnet
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
  walletClient,
  recipientAddress,
  amount,
}: SendPaymentParams) {
  try {
    const adapter = createViemAdapterFromWalletClient({ walletClient })

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
