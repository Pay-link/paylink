import { createServerClient } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const ownerId = req.nextUrl.searchParams.get('ownerId')
    if (!ownerId) {
      return Response.json({ error: 'Missing ownerId' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Query payment links where the user is the owner
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching links from API:', error)
      return Response.json({ error: 'Database query failure' }, { status: 500 })
    }

    return Response.json(data || [])
  } catch (err: any) {
    console.error('API links fetch error:', err)
    return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body
    if (!id) {
      return Response.json({ error: 'Missing link id' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('payment_links')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting link in API:', error)
      return Response.json({ error: 'Database delete failure' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err: any) {
    console.error('API link delete error:', err)
    return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
