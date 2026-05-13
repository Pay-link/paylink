// In-memory rate limiter — protects API routes from abuse
// Each entry: { count, resetAt }
const store = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now()
  store.forEach((val, key) => {
    if (now > val.resetAt) store.delete(key)
  })
}, 5 * 60 * 1000)

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key     Unique key (e.g. IP + route)
 * @param limit   Max requests per window
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

export function getIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please slow down.' }),
    { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
  )
}
