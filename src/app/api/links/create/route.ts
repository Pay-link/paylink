import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateLinkSlug, getExpiryDate } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { owner_id, owner_name, owner_email, owner_wallet, amount, note, receive_type, expiry } = body

    // Validate required fields
    if (!owner_id || !owner_wallet || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Generate unique slug
    let slug = generateLinkSlug()
    let attempts = 0

    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('payment_links')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!existing) break
      slug = generateLinkSlug()
      attempts++
    }

    // Create the link
    const { data: link, error } = await supabase
      .from('payment_links')
      .insert({
        slug,
        owner_id,
        owner_name: owner_name || 'PayLink User',
        owner_email,
        owner_wallet,
        amount: parseFloat(amount),
        note: note || '',
        receive_type: receive_type || 'crypto',
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://paylink.xyz'

    return NextResponse.json({
      data: {
        link,
        url: `${appUrl}/pay/${slug}`,
      },
      error: null,
    })
  } catch (err) {
    console.error('Create link error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
