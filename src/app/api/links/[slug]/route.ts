import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const supabase = createServerClient()

    const { data: link, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    // Check expiry
    if (link.expiry && new Date(link.expiry) < new Date()) {
      // Update status to expired
      await supabase
        .from('payment_links')
        .update({ status: 'expired' })
        .eq('id', link.id)

      return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
    }

    if (link.status === 'cancelled') {
      return NextResponse.json({ error: 'This link has been cancelled' }, { status: 410 })
    }

    return NextResponse.json({ data: link, error: null })
  } catch (err) {
    console.error('Get link error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

