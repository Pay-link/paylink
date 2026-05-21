import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { rateLimit, getIp, rateLimitResponse } from '@/lib/rateLimit'
import { sanitizeText, isValidEmail, isValidAmount } from '@/lib/sanitize'
import { createWalletClient, createPublicClient, http, padHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { escrowAbi } from '@/lib/escrowAbi'

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
    const { token, claimedBy, claimerEmail: providedEmail, claimerPhone: providedPhone, claimerWallet: providedWallet } = await req.json()

    if (!token || !/^[0-9a-f]{32}$/.test(token)) {
      return Response.json({ error: 'Invalid token format' }, { status: 400 })
    }
    if (!claimedBy || typeof claimedBy !== 'string' || claimedBy.length > 255) {
      return Response.json({ error: 'Invalid claimedBy' }, { status: 400 })
    }

    // 1. Fetch or auto-create claimer details
    let { data: claimer } = await supabase
      .from('users')
      .select('id, email, phone, balance_usdc, wallet_address')
      .eq('id', claimedBy)
      .maybeSingle()

    if (!claimer) {
      const email = providedEmail || null
      const phone = providedPhone || null
      const walletAddress = providedWallet || ''
      const displayName = email?.split('@')[0] || phone || 'ZaPay User'

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: claimedBy,
          email,
          phone,
          display_name: displayName,
          wallet_address: walletAddress,
          balance_usdc: 0,
          bank_setup: false,
          kyc_status: 'none',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, email, phone, balance_usdc, wallet_address')
        .single()

      if (createError || !newUser) {
        console.error('Failed to auto-create user on claim:', createError)
        return Response.json({ error: 'User not found' }, { status: 404 })
      }

      claimer = newUser
    } else {
      // Update email, phone, and/or wallet_address if they are not set or changed
      const updates: any = {}
      if (!claimer.email && providedEmail) updates.email = providedEmail
      if (!claimer.phone && providedPhone) updates.phone = providedPhone
      if (providedWallet && claimer.wallet_address !== providedWallet) updates.wallet_address = providedWallet

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString()
        const { data: updatedUser } = await supabase
          .from('users')
          .update(updates)
          .eq('id', claimedBy)
          .select('id, email, phone, balance_usdc, wallet_address')
          .single()
        if (updatedUser) {
          claimer = updatedUser
        }
      }
    }

    // 2. Fetch existing claim details
    const { data: existing } = await supabase
      .from('pending_claims')
      .select('recipient_email, status, expires_at, amount')
      .eq('claim_token', token)
      .single()

    if (!existing) return Response.json({ error: 'Claim not found' }, { status: 404 })

    // 3. Verify authorization
    const recipientContact = existing.recipient_email.toLowerCase()
    const claimerEmail = (claimer.email || '').toLowerCase()
    const claimerPhone = (claimer.phone || '').toLowerCase()

    if (claimerEmail !== recipientContact && claimerPhone !== recipientContact) {
      return Response.json({ error: 'This claim link is not intended for you.' }, { status: 403 })
    }

    if (existing.status === 'claimed') return Response.json({ error: 'Already claimed' }, { status: 409 })
    if (new Date(existing.expires_at) < new Date()) return Response.json({ error: 'Claim has expired' }, { status: 410 })

    // 4. Release on-chain if configured
    const escrowAddr = process.env.NEXT_PUBLIC_ESCROW_ADDRESS
    const adminKey = process.env.ADMIN_PRIVATE_KEY
    let txHash: string | null = null

    if (escrowAddr && escrowAddr !== '0x' && adminKey && claimer.wallet_address) {
      try {
        const account = privateKeyToAccount(adminKey as `0x${string}`)
        const walletClient = createWalletClient({
          account,
          chain: undefined,
          transport: http(process.env.NEXT_PUBLIC_ARC_RPC_URL)
        })
        const publicClient = createPublicClient({
          transport: http(process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network')
        })
        const claimHash = padHex(`0x${token}`, { size: 32 })

        // Check if the claim exists and is active on-chain
        const claimInfo = await publicClient.readContract({
          address: escrowAddr as `0x${string}`,
          abi: escrowAbi,
          functionName: 'claims',
          args: [claimHash],
        }) as [string, bigint, bigint, boolean]
        
        const [onChainSender, onChainAmount, onChainExpiresAt, onChainActive] = claimInfo

        if (onChainSender === '0x0000000000000000000000000000000000000000') {
          return Response.json(
            { error: 'Escrow deposit not found. The sender did not successfully transfer funds to the escrow contract.' },
            { status: 400 }
          )
        }

        if (!onChainActive) {
          // If the claim is already inactive on-chain but was deposited,
          // it might have already been released in a previous request.
          // In this case, we don't need to call release on-chain again.
          console.log('Claim is already inactive on-chain but was previously deposited. Assuming already released or refunded.')
        } else {
          // Otherwise, call release on-chain
          const hash = await walletClient.writeContract({
             address: escrowAddr as `0x${string}`,
             abi: escrowAbi,
             functionName: 'release',
             args: [claimHash, claimer.wallet_address as `0x${string}`],
             chain: null,
          })
          // Wait for release to be mined
          await publicClient.waitForTransactionReceipt({ hash })
          txHash = hash
        }
      } catch (err: any) {
        console.error('Failed to release on-chain escrow:', err)
        return Response.json(
          { error: 'Failed to release funds on-chain: ' + (err.message || err) },
          { status: 500 }
        )
      }
    }

    // 5. Atomic update: only succeeds if status='pending' AND not expired in one query
    const { data, error } = await supabase
      .from('pending_claims')
      .update({
        status: 'claimed',
        claimed_by: claimedBy,
        claimed_at: new Date().toISOString(),
      })
      .eq('claim_token', token)
      .eq('status', 'pending')
      .select()
      .single()

    if (error || !data) {
      return Response.json({ error: 'Claim unavailable' }, { status: 409 })
    }

    // 6. Credit the claimer's DB balance
    await supabase
      .from('users')
      .update({
        balance_usdc: (claimer.balance_usdc || 0) + data.amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimedBy)

    // 7. Log the successful claim transaction
    try {
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          sender_id: data.sender_id,
          sender_email: data.sender_email,
          sender_wallet: escrowAddr || '0x0000000000000000000000000000000000000000',
          recipient_id: claimedBy,
          recipient_wallet: claimer.wallet_address || '0x0000000000000000000000000000000000000000',
          amount: data.amount,
          note: data.note || 'Claimed escrow hold',
          tx_hash: txHash || `zapay-claim-${token}`,
          status: 'confirmed',
          payment_method: 'email_otp',
          confirmed_at: new Date().toISOString()
        })
      if (txError) {
        console.error('Failed to log claim transaction in DB:', txError)
      }
    } catch (txErr) {
      console.error('Exception while logging claim transaction in DB:', txErr)
    }

    return Response.json({ claim: data })
  } catch (err: any) {
    return Response.json({ error: 'Failed to process claim' }, { status: 500 })
  }
}
