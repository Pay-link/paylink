import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { rateLimit, getIp } from '@/lib/rateLimit'
import { sanitizeText, isValidAddress, isValidTxHash, isValidAmount } from '@/lib/sanitize'

export async function POST(request: NextRequest) {
  // Rate limit: 10 confirmations per minute per IP
  if (!rateLimit(`tx-confirm:${getIp(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { link_id, sender_id, sender_email, sender_wallet, recipient_id, recipient_wallet, amount, note, tx_hash, payment_method } = body

    // Validate wallet addresses
    if (!isValidAddress(sender_wallet)) {
      return NextResponse.json({ error: 'Invalid sender wallet address' }, { status: 400 })
    }
    if (!isValidAddress(recipient_wallet)) {
      return NextResponse.json({ error: 'Invalid recipient wallet address' }, { status: 400 })
    }

    // Validate transaction hash format
    if (!isValidTxHash(tx_hash)) {
      return NextResponse.json({ error: 'Invalid transaction hash' }, { status: 400 })
    }

    // Validate amount
    if (!isValidAmount(amount) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Validate sender_id format if provided
    if (sender_id && (typeof sender_id !== 'string' || sender_id.length > 255)) {
      return NextResponse.json({ error: 'Invalid sender' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Prevent replay attacks — reject duplicate tx_hash
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('tx_hash', tx_hash)
      .maybeSingle()

    if (existingTx) {
      return NextResponse.json({ error: 'Transaction already recorded' }, { status: 409 })
    }

    // If link_id provided, verify the amount matches the link's amount (prevents underpayment)
    if (link_id) {
      const { data: link } = await supabase
        .from('payment_links')
        .select('amount, status, owner_id')
        .eq('id', link_id)
        .single()

      if (!link) {
        return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
      }
      if (link.status !== 'active') {
        return NextResponse.json({ error: 'Payment link is no longer active' }, { status: 400 })
      }
      // For fixed-amount links: verify the paid amount matches
      if (link.amount > 0 && Math.abs(parseFloat(amount) - link.amount) > 0.01) {
        return NextResponse.json({ error: 'Amount does not match link' }, { status: 400 })
      }
      // Verify the recipient matches the link owner
      if (recipient_id && link.owner_id !== recipient_id) {
        return NextResponse.json({ error: 'Recipient mismatch' }, { status: 400 })
      }
    }

    // Record the transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        link_id: link_id || null,
        sender_id: sender_id ? sender_id.slice(0, 255) : null,
        sender_email: sanitizeText(sender_email, 255),
        sender_wallet,
        recipient_id: recipient_id || null,
        recipient_wallet,
        amount: parseFloat(String(amount)),
        note: sanitizeText(note, 300),
        tx_hash,
        gas_fee: 0,
        status: 'confirmed',
        payment_method: ['email_otp', 'wallet', 'card'].includes(payment_method) ? payment_method : 'email_otp',
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Transaction error:', error)
      return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 })
    }

    // Increment paid_count only after transaction is successfully recorded
    if (link_id) {
      await supabase.rpc('increment_paid_count', { link_id })
    }

    return NextResponse.json({ data: transaction, error: null })
  } catch (err) {
    console.error('Transaction confirm error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
