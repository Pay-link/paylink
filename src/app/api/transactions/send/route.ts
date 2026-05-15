import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { rateLimit, getIp, rateLimitResponse } from '@/lib/rateLimit'
import { sanitizeText, isValidAmount } from '@/lib/sanitize'
import { isValidEmail, isValidPhone } from '@/lib/utils'

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
    if (!isValidAmount(String(amount)) || parseFloat(String(amount)) <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const amountNum = parseFloat(String(amount))

    // Fetch sender balance
    const { data: sender } = await supabase
      .from('users')
      .select('id, balance_usdc, display_name')
      .eq('id', senderId)
      .maybeSingle()

    if (!sender) {
      return Response.json({ error: 'Sender not found' }, { status: 404 })
    }

    const currentBalance = sender.balance_usdc ?? 0
    if (currentBalance < amountNum) {
      return Response.json({ error: 'Insufficient balance', balance: currentBalance }, { status: 402 })
    }

    // Atomic optimistic-lock deduction: WHERE balance_usdc = known value prevents double-spend
    const { error: deductErr, count } = await supabase
      .from('users')
      .update({ balance_usdc: currentBalance - amountNum, updated_at: new Date().toISOString() })
      .eq('id', senderId)
      .eq('balance_usdc', currentBalance) // optimistic lock — fails if another request changed it first

    if (deductErr || count === 0) {
      return Response.json({ error: 'Balance changed — please retry' }, { status: 409 })
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
        tx_hash: `zapay-internal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
