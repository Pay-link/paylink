import { createServerClient } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const senderId = req.nextUrl.searchParams.get('senderId')
    if (!senderId) {
      return Response.json({ error: 'Missing senderId' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Query pending claims where the user is the sender and status is pending
    const { data, error } = await supabase
      .from('pending_claims')
      .select('*')
      .eq('sender_id', senderId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching claims from API:', error)
      return Response.json({ error: 'Database query failure' }, { status: 500 })
    }

    return Response.json(data || [])
  } catch (err: any) {
    console.error('API claims fetch error:', err)
    return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { claimId, status } = body

    if (!claimId || !status) {
      return Response.json({ error: 'Missing claimId or status' }, { status: 400 })
    }

    // Only allow updating to 'expired' (e.g. for refunding/reclaiming)
    if (status !== 'expired') {
      return Response.json({ error: 'Unauthorized status update' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('pending_claims')
      .update({ status })
      .eq('id', claimId)
      .select()
      .single()

    if (error) {
      console.error('Error updating claim status:', error)
      return Response.json({ error: 'Database update failure' }, { status: 500 })
    }

    return Response.json(data)
  } catch (err: any) {
    console.error('API claim update error:', err)
    return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
