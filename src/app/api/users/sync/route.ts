import { createServerClient } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, email, phone, displayName, walletAddress } = body

    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if user exists
    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching user on sync:', fetchError)
      return Response.json({ error: 'Database fetch error' }, { status: 500 })
    }

    if (existing) {
      // Update fields if changed
      let needsUpdate = false
      const updates: any = {}

      if (existing.wallet_address !== walletAddress && walletAddress) {
        updates.wallet_address = walletAddress
        needsUpdate = true
      }
      if (existing.email !== email && email) {
        updates.email = email
        needsUpdate = true
      }
      if (existing.phone !== phone && phone) {
        updates.phone = phone
        needsUpdate = true
      }
      if (existing.display_name !== displayName && displayName) {
        updates.display_name = displayName
        needsUpdate = true
      }

      if (needsUpdate) {
        updates.updated_at = new Date().toISOString()
        const { data: updated, error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', userId)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating user on sync:', updateError)
          return Response.json({ error: 'Database update error' }, { status: 500 })
        }
        return Response.json(updated)
      }

      return Response.json(existing)
    } else {
      // Create new user
      const newUser = {
        id: userId,
        email: email || null,
        phone: phone || null,
        display_name: displayName || email?.split('@')[0] || phone || 'ZaPay User',
        wallet_address: walletAddress || '',
        balance_usdc: 0,
        bank_setup: false,
        kyc_status: 'none',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: created, error: createError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single()

      if (createError) {
        console.error('Error creating user on sync:', createError)
        return Response.json({ error: 'Database insertion error' }, { status: 500 })
      }

      return Response.json(created)
    }
  } catch (err: any) {
    console.error('API sync error:', err)
    return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
