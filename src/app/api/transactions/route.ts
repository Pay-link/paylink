import { createServerClient } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Query transactions where the user is either the sender or the recipient
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching transactions from API:', error)
      return Response.json({ error: 'Database query failure' }, { status: 500 })
    }

    return Response.json(data || [])
  } catch (err: any) {
    console.error('API transactions fetch error:', err)
    return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
