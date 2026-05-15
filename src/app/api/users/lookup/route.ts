import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { rateLimit, getIp, rateLimitResponse } from '@/lib/rateLimit'
import { isValidEmail, isValidPhone } from '@/lib/utils'

// Uses service role to bypass RLS — safe because we only return { registered, name }
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

  // Only allow valid email or phone — prevents query injection
  if (!isValidEmail(contact) && !isValidPhone(contact)) {
    return Response.json({ registered: false, name: null })
  }

  try {
    // Use separate .eq() calls to avoid interpolating user input into .or() string
    const [emailRes, phoneRes] = await Promise.all([
      supabase.from('users').select('id, display_name').eq('email', contact).maybeSingle(),
      supabase.from('users').select('id, display_name').eq('phone', contact).maybeSingle(),
    ])

    const found = emailRes.data || phoneRes.data
    return Response.json({ registered: !!found, name: found?.display_name || null })
  } catch (err) {
    console.error('User lookup error:', err)
    return Response.json({ registered: false, name: null })
  }
}
