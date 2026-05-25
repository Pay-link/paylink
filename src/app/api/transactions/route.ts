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

    if (!data || data.length === 0) {
      return Response.json([])
    }

    // Extract all unique sender/recipient user IDs to batch-query profiles in a single query
    const userIds = Array.from(new Set([
      ...data.map(tx => tx.recipient_id),
      ...data.map(tx => tx.sender_id)
    ].filter(id => id)))

    const profileMap = new Map()
    if (userIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from('users')
          .select('id, display_name, email, phone')
          .in('id', userIds)
        
        if (profiles) {
          for (const p of profiles) {
            profileMap.set(p.id, p)
          }
        }
      } catch (profileErr) {
        console.error('Failed to pre-fetch user profiles for enrichment:', profileErr)
      }
    }

    // Enrich transactions with resolved profiles for complete sender/recipient visualization
    const enrichedData = data.map(tx => {
      const recipientProfile = tx.recipient_id ? profileMap.get(tx.recipient_id) : null
      const senderProfile = tx.sender_id ? profileMap.get(tx.sender_id) : null
      return {
        ...tx,
        sender_email: tx.sender_email || senderProfile?.email || senderProfile?.phone || senderProfile?.display_name || null,
        recipient_contact: tx.recipient_contact || recipientProfile?.display_name || recipientProfile?.email || recipientProfile?.phone || null,
        recipient_email: tx.recipient_email || recipientProfile?.email || recipientProfile?.phone || null,
      }
    })

    return Response.json(enrichedData)
  } catch (err: any) {
    console.error('API transactions fetch error:', err)
    return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
