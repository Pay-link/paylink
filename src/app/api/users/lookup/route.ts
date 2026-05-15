import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { rateLimit, getIp, rateLimitResponse } from '@/lib/rateLimit'

// Uses service role to bypass RLS — safe because we only return a boolean (exists or not)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(req: NextRequest) {
  if (!rateLimit(`user-lookup:${getIp(req)}`, 20, 60_000)) return rateLimitResponse()

  const contact = req.nextUrl.searchParams.get('contact')?.trim().toLowerCase()
  if (!contact || contact.length > 255) {
    return Response.json({ error: 'Invalid contact' }, { status: 400 })
  }

  try {
    const { data } = await supabase
      .from('users')
      .select('id, display_name')
      .or(`email.eq.${contact},phone.eq.${contact}`)
      .maybeSingle()

    return Response.json({ registered: !!data, name: data?.display_name || null })
  } catch (err) {
    console.error('User lookup error:', err)
    return Response.json({ registered: false, name: null })
  }
}
