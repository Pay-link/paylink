import { createServerClient } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient()

    const [linksRes, txsRes] = await Promise.all([
      supabase.from('payment_links').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('id', { count: 'exact', head: true }),
    ])

    return Response.json({
      links: linksRes.count ?? 0,
      txs: txsRes.count ?? 0,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (err: any) {
    console.error('API stats error:', err)
    return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
