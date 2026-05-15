import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { rateLimit, getIp, rateLimitResponse } from '@/lib/rateLimit'
import { sanitizeText, isValidAmount } from '@/lib/sanitize'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  if (!rateLimit(`tx-send:${getIp(req)}`, 10, 60_000)) return rateLimitResponse()

  try {
    const body = await req.json()
    const { senderId, senderEmail, recipientContact, amount, note } = body

    if (!senderId || typeof senderId !== 'string' || senderId.length > 255) {
      return Response.json({ error: 'Invalid sender' }, { status: 400 })
    }
    if (!isValidAmount(amount) || parseFloat(amount) <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const amountNum = parseFloat(String(amount))

    // Fetch sender's current balance
    const { data: sender } = await supabase
      .from('users')
      .select('id, balance_usdc, display_name')
      .eq('id', senderId)
      .single()

    if (!sender) {
      return Response.json({ error: 'Sender not found' }, { status: 404 })
    }

    // Enforce balance check — testnet is lenient but prevents wildly negative balances
    if (sender.balance_usdc < amountNum) {
      return Response.json({ error: 'Insufficient balance', balance: sender.balance_usdc }, { status: 402 })
    }

    // Look up recipient by email or phone
    const contact = recipientContact?.trim().toLowerCase()
    const { data: recipient } = await supabase
      .from('users')
      .select('id, balance_usdc, display_name')
      .or(`email.eq.${contact},phone.eq.${contact}`)
      .maybeSingle()

    // Deduct from sender
    const { error: deductErr } = await supabase
      .from('users')
      .update({ balance_usdc: sender.balance_usdc - amountNum, updated_at: new Date().toISOString() })
      .eq('id', senderId)

    if (deductErr) {
      console.error('Deduct error:', deductErr)
      return Response.json({ error: 'Failed to deduct balance' }, { status: 500 })
    }

    // Credit recipient if they exist
    if (recipient) {
      await supabase
        .from('users')
        .update({ balance_usdc: (recipient.balance_usdc || 0) + amountNum, updated_at: new Date().toISOString() })
        .eq('id', recipient.id)
    }

    // Record transaction
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
        tx_hash: `zapay-internal-${Date.now()}`,
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
      newBalance: sender.balance_usdc - amountNum,
      transaction: tx,
    })
  } catch (err) {
    console.error('Send transaction error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
