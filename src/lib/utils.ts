import { customAlphabet } from 'nanoid'

// ── LINK ID GENERATION ─────────────────────────────────────────
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
const nanoid = customAlphabet(alphabet, 8)

export function generateLinkSlug(): string {
  return nanoid()
}

export function getLinkUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://paylink.xyz'
  return `${base}/pay/${slug}`
}

export function getShortLinkUrl(slug: string): string {
  return `paylink.xyz/pay/${slug}`
}

// ── FORMATTING ─────────────────────────────────────────────────
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatUSDCompact(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`
  }
  return formatUSD(amount)
}

export function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Rough USD to NGN conversion (in production use a live rate API)
export function usdToNGN(usd: number): number {
  const rate = 1650 // approximate rate
  return usd * rate
}

export function shortenAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function shortenTxHash(hash: string): string {
  if (!hash) return ''
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

// ── DATE / TIME ────────────────────────────────────────────────
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function getExpiryDate(option: string): string | null {
  if (option === 'Never') return null
  const now = new Date()
  if (option === '24 hours') now.setHours(now.getHours() + 24)
  if (option === '7 days') now.setDate(now.getDate() + 7)
  if (option === '30 days') now.setDate(now.getDate() + 30)
  return now.toISOString()
}

export function getExpiryLabel(expiry: string | null): string {
  if (!expiry) return 'Never expires'
  const diff = new Date(expiry).getTime() - Date.now()
  if (diff < 0) return 'Expired'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  if (days > 1) return `Expires in ${days} days`
  if (hours > 1) return `Expires in ${hours} hours`
  return 'Expires soon'
}

// ── VALIDATION ─────────────────────────────────────────────────
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isValidPhone(value: string): boolean {
  return /^\+?[\d\s\-()]{7,15}$/.test(value)
}

export function isValidContact(value: string): boolean {
  return isValidEmail(value) || isValidPhone(value)
}

export function isValidAmount(value: string): boolean {
  const num = parseFloat(value)
  return !isNaN(num) && num > 0 && num <= 100000
}

// ── INITIALS ───────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── SHARE ──────────────────────────────────────────────────────
export function getShareUrls(linkUrl: string, amount: number, note?: string) {
  const msg = note
    ? `Pay me ${formatUSD(amount)} for "${note}" via PayLink: ${linkUrl}`
    : `Pay me ${formatUSD(amount)} via PayLink: ${linkUrl}`

  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(msg)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(linkUrl)}&text=${encodeURIComponent(msg)}`,
    email: `mailto:?subject=Payment request ${formatUSD(amount)}&body=${encodeURIComponent(msg)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`,
  }
}
