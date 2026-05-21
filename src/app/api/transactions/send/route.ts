import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { rateLimit, getIp, rateLimitResponse } from '@/lib/rateLimit'
import { sanitizeText, isValidAmount, isValidTxHash } from '@/lib/sanitize'
import { isValidEmail, isValidPhone } from '@/lib/utils'
import { createPublicClient, http } from 'viem'

const arcPublicClient = createPublicClient({
  transport: http('https://rpc.testnet.arc.network'),
})
const usdcOnchainAbi = [
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
] as const
const usdcOnchainAddress = '0x3600000000000000000000000000000000000000' as `0x${string}`

async function getOnchainBalance(walletAddress: string): Promise<number> {
  try {
    const raw = await arcPublicClient.readContract({
      address: usdcOnchainAddress,
      abi: usdcOnchainAbi,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    })
    return Number(raw) / 1_000_000
  } catch {
    return 0
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  if (!rateLimit(`tx-send:${getIp(req)}`, 10, 60_000)) return rateLimitResponse()

  try {
    const body = await req.json()
    const { senderId, senderEmail, recipientContact, amount, note, txHash } = body

    if (!senderId || typeof senderId !== 'string' || senderId.length > 255) {
      return Response.json({ error: 'Invalid sender' }, { status: 400 })
    }
    if (txHash && !isValidTxHash(txHash)) {
      return Response.json({ error: 'Invalid transaction hash' }, { status: 400 })
    }
    if (!isValidAmount(String(amount)) || parseFloat(String(amount)) <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const amountNum = parseFloat(String(amount))

    // Fetch sender balance
    const { data: sender } = await supabase
      .from('users')
      .select('id, balance_usdc, display_name, wallet_address')
      .eq('id', senderId)
      .maybeSingle()

    if (!sender) {
      return Response.json({ error: 'Sender not found' }, { status: 404 })
    }

    // Use on-chain balance as the source of truth (dashboard balance comes from Arc blockchain)
    // Supabase balance_usdc may be stale (e.g. funded via faucet, not through the app)
    const supabaseBalance = sender.balance_usdc ?? 0
    const onchainBalance = sender.wallet_address ? await getOnchainBalance(sender.wallet_address) : 0
    const currentBalance = Math.max(supabaseBalance, onchainBalance)

    if (currentBalance < amountNum) {
      return Response.json({ error: 'Insufficient balance', balance: currentBalance }, { status: 402 })
    }

    // Sync Supabase balance with on-chain if out of date, then deduct
    const newBalance = currentBalance - amountNum
    const { error: deductErr } = await supabase
      .from('users')
      .update({ balance_usdc: newBalance, updated_at: new Date().toISOString() })
      .eq('id', senderId)

    if (deductErr) {
      return Response.json({ error: 'Balance update failed — please retry' }, { status: 409 })
    }

    // Look up recipient using safe separate .eq() queries (no .or() string interpolation)
    let recipient: { id: string; balance_usdc: number; display_name: string } | null = null
    const contact = recipientContact?.trim().toLowerCase()
    if (contact && (isValidEmail(contact) || isValidPhone(contact))) {
      const [emailRes, phoneRes] = await Promise.all([
        supabase.from('users').select('id, balance_usdc, display_name').eq('email', contact).maybeSingle(),
        supabase.from('users').select('id, balance_usdc, display_name').eq('phone', contact).maybeSingle(),
      ])
      recipient = emailRes.data || phoneRes.data || null
    }

    // Credit recipient if they exist
    if (recipient) {
      await supabase
        .from('users')
        .update({
          balance_usdc: (recipient.balance_usdc ?? 0) + amountNum,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recipient.id)
    }

    // Record transaction in history
    const { data: tx } = await supabase
      .from('transactions')
      .insert({
        sender_id: senderId,
        sender_email: sanitizeText(senderEmail, 255),
        sender_wallet: '',
        recipient_id: recipient?.id || null,
        recipient_wallet: '',
        amount: amountNum,
        note: sanitizeText(note, 300),
        tx_hash: txHash || `zapay-internal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        gas_fee: 0,
        status: 'confirmed',
        payment_method: 'email_otp',
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single()

    return Response.json({
      success: true,
      recipientFound: !!recipient,
      recipientName: recipient?.display_name || null,
      newBalance: currentBalance - amountNum,
      transaction: tx,
    })
  } catch (err) {
    console.error('Send transaction error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
