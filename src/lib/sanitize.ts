// Strip any HTML/script tags from user-supplied strings
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>/g, '')          // strip HTML tags
    .replace(/[<>'"]/g, '')           // strip remaining dangerous chars
    .trim()
    .slice(0, maxLength)
}

// Validate Ethereum address format
export function isValidAddress(addr: unknown): boolean {
  return typeof addr === 'string' && /^0x[0-9a-fA-F]{40}$/.test(addr)
}

// Validate transaction hash format
export function isValidTxHash(hash: unknown): boolean {
  return typeof hash === 'string' && /^0x[0-9a-fA-F]{64}$/.test(hash)
}

// Validate email format
export function isValidEmail(email: unknown): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 255
}

// Validate amount — must be a positive number with at most 6 decimal places, max $1M
export function isValidAmount(amount: unknown): boolean {
  const n = parseFloat(String(amount))
  return !isNaN(n) && n >= 0 && n <= 1_000_000 && /^\d+(\.\d{1,6})?$/.test(String(amount))
}
