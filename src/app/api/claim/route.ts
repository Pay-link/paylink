import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { rateLimit, getIp, rateLimitResponse } from '@/lib/rateLimit'
import { sanitizeText, isValidEmail, isValidAmount } from '@/lib/sanitize'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Cryptographically secure token — 128 bits of entropy, URL-safe
function makeToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// POST — create a pending claim
export async function POST(req: NextRequest) {
  // Rate limit: 5 claims per minute per IP
  if (!rateLimit(`claim-create:${getIp(req)}`, 5, 60_000)) return rateLimitResponse()

  try {
    const body = await req.json()
    const { senderId, senderName, senderEmail, recipientEmail, amount, note } = body

    // Strict input validation
    if (!senderId || typeof senderId !== 'string' || senderId.length > 255) {
      return Response.json({ error: 'Invalid sender' }, { status: 400 })
    }
    if (!isValidEmail(recipientEmail)) {
      return Response.json({ error: 'Invalid recipient email' }, { status: 400 })
    }
    if (!isValidAmount(amount) || parseFloat(amount) <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const claim_token = makeToken()
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('pending_claims')
      .insert({
        claim_token,
        sender_id: senderId.slice(0, 255),
        sender_name: sanitizeText(senderName, 100),
        sender_email: sanitizeText(senderEmail, 255),
        recipient_email: recipientEmail.toLowerCase().trim(),
        amount: parseFloat(String(amount)),
        note: sanitizeText(note, 300),
        expires_at,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ token: claim_token, claim: data })
  } catch (err: any) {
    console.error('Create claim error:', err)
    return Response.json({ error: 'Failed to create claim' }, { status: 500 })
  }
}

// GET — fetch claim details by token (rate limited to prevent enumeration)
export async function GET(req: NextRequest) {
  // Rate limit: 30 lookups per minute per IP
  if (!rateLimit(`claim-get:${getIp(req)}`, 30, 60_000)) return rateLimitResponse()

  const token = req.nextUrl.searchParams.get('token')
  if (!token || !/^[0-9a-f]{32}$/.test(token)) {
    return Response.json({ error: 'Invalid token format' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('pending_claims')
    .select('id, claim_token, sender_name, sender_email, recipient_email, amount, note, status, expires_at')
    .eq('claim_token', token)
    .single()

  if (error || !data) {
    // Return same response for invalid token vs not found — prevents enumeration
    return Response.json({ error: 'Claim not found' }, { status: 404 })
  }

  return Response.json({ claim: data })
}

// PATCH — atomically mark claim as claimed (prevents race conditions)
export async function PATCH(req: NextRequest) {
  // Rate limit: 10 claim attempts per minute per IP
  if (!rateLimit(`claim-patch:${getIp(req)}`, 10, 60_000)) return rateLimitResponse()

  try {
    const { token, claimedBy } = await req.json()

    if (!token || !/^[0-9a-f]{32}$/.test(token)) {
      return Response.json({ error: 'Invalid token format' }, { status: 400 })
    }
    if (!claimedBy || typeof claimedBy !== 'string' || claimedBy.length > 255) {
      return Response.json({ error: 'Invalid claimedBy' }, { status: 400 })
    }

    // Atomic update: only succeeds if status='pending' AND not expired in one query
    // This prevents race conditions — two concurrent requests cannot both succeed
    const { data, error } = await supabase
      .from('pending_claims')
      .update({
        status: 'claimed',
        claimed_by: claimedBy,
        claimed_at: new Date().toISOString(),
      })
      .eq('claim_token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .select()
      .single()

    if (error || !data) {
      // Could be: not found, already claimed, or expired
      const { data: existing } = await supabase
        .from('pending_claims')
        .select('status, expires_at')
        .eq('claim_token', token)
        .single()

      if (!existing) return Response.json({ error: 'Claim not found' }, { status: 404 })
      if (existing.status === 'claimed') return Response.json({ error: 'Already claimed' }, { status: 409 })
      if (new Date(existing.expires_at) < new Date()) return Response.json({ error: 'Claim has expired' }, { status: 410 })
      return Response.json({ error: 'Claim unavailable' }, { status: 409 })
    }

    return Response.json({ claim: data })
  } catch (err: any) {
    return Response.json({ error: 'Failed to process claim' }, { status: 500 })
  }
}
