import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      link_id,
      sender_id,
      sender_email,
      sender_wallet,
      recipient_id,
      recipient_wallet,
      amount,
      note,
      tx_hash,
      payment_method,
    } = body

    if (!sender_wallet || !recipient_wallet || !amount || !tx_hash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Record the transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        link_id: link_id || null,
        sender_id: sender_id || null,
        sender_email: sender_email || null,
        sender_wallet,
        recipient_id,
        recipient_wallet,
        amount: parseFloat(amount),
        note: note || '',
        tx_hash,
        gas_fee: 0,
        status: 'confirmed',
        payment_method: payment_method || 'email_otp',
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Transaction error:', error)
      return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 })
    }

    // If this was a link payment, increment paid_count
    if (link_id) {
      await supabase.rpc('increment_paid_count', { link_id })
    }

    return NextResponse.json({ data: transaction, error: null })
  } catch (err) {
    console.error('Transaction error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
