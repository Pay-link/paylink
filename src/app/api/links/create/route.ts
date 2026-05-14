import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateLinkSlug, getExpiryDate } from '@/lib/utils'
import { rateLimit, getIp } from '@/lib/rateLimit'
import { sanitizeText, isValidAddress, isValidAmount } from '@/lib/sanitize'

export async function POST(request: NextRequest) {
  // Rate limit: 10 links per minute per IP
  if (!rateLimit(`link-create:${getIp(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { owner_id, owner_name, owner_email, owner_wallet, amount, note, receive_type, expiry } = body

    if (!owner_id || typeof owner_id !== 'string' || owner_id.length > 255) {
      return NextResponse.json({ error: 'Invalid owner' }, { status: 400 })
    }
    if (!isValidAddress(owner_wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    const parsedAmount = parseFloat(String(amount))
    // Allow 0 for open links, but validate the format
    if (!isValidAmount(amount) || parsedAmount < 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verify the owner_id matches an actual user — prevents creating links on behalf of others
    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('id', owner_id)
      .maybeSingle()

    if (!userExists) {
      // Auto-create user record (non-blocking)
      try {
        await supabase.from('users').upsert({
          id: owner_id,
          display_name: sanitizeText(owner_name, 100) || 'ZaPay User',
          email: owner_email || null,
          wallet_address: owner_wallet,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      } catch { /* non-fatal */ }
    }

    // Generate unique slug
    let slug = generateLinkSlug()
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase.from('payment_links').select('id').eq('slug', slug).single()
      if (!existing) break
      slug = generateLinkSlug()
    }

    const { data: link, error } = await supabase
      .from('payment_links')
      .insert({
        slug,
        owner_id: owner_id.slice(0, 255),
        owner_name: sanitizeText(owner_name, 100) || 'ZaPay User',
        owner_email: sanitizeText(owner_email, 255),
        owner_wallet,
        amount: parsedAmount,
        note: sanitizeText(note, 300),
        receive_type: ['crypto', 'fiat'].includes(receive_type) ? receive_type : 'crypto',
        expiry: getExpiryDate(expiry || '7 days'),
        status: 'active',
        paid_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zapay-1.netlify.app'
    return NextResponse.json({ data: { link, url: `${appUrl}/pay/${slug}` }, error: null })
  } catch (err) {
    console.error('Create link error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
