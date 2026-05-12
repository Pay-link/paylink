// ── PAYMENT LINK ──────────────────────────────────────────────
export interface PayLink {
  id: string
  slug: string                          // e.g. "ox-apr-8f2k"
  owner_id: string                      // Privy user ID
  owner_name: string
  owner_email: string
  owner_wallet: string                  // Arc wallet address
  amount: number                        // in USD
  note: string
  receive_type: 'crypto' | 'bank'
  expiry: string | null                 // ISO date or null for never
  status: 'active' | 'paid' | 'expired' | 'cancelled'
  paid_count: number
  created_at: string
  updated_at: string
}

// ── TRANSACTION ───────────────────────────────────────────────
export interface Transaction {
  id: string
  link_id: string | null
  sender_id: string | null
  sender_email: string | null
  sender_wallet: string
  recipient_id: string
  recipient_wallet: string
  amount: number
  note: string
  tx_hash: string
  arc_block: string | null
  gas_fee: number                       // always 0 on Arc
  status: 'pending' | 'confirmed' | 'failed'
  payment_method: 'email_otp' | 'wallet' | 'card' | 'bank' | 'mobile_money'
  created_at: string
  confirmed_at: string | null
}

// ── USER PROFILE ──────────────────────────────────────────────
export interface UserProfile {
  id: string                            // Privy user ID
  email: string | null
  phone: string | null
  display_name: string
  wallet_address: string
  balance_usdc: number
  bank_setup: boolean
  bank_country: string | null
  bank_name: string | null
  bank_account: string | null
  bank_currency: string | null
  kyc_status: 'none' | 'pending' | 'verified' | 'failed'
  created_at: string
}

// ── PAYMENT METHOD ────────────────────────────────────────────
export type PaymentMethod = 'email_otp' | 'wallet' | 'card' | 'bank' | 'mobile_money'

// ── RECEIVE TYPE ──────────────────────────────────────────────
export type ReceiveType = 'crypto' | 'bank'

// ── EXPIRY OPTIONS ────────────────────────────────────────────
export type ExpiryOption = '24 hours' | '7 days' | '30 days' | 'Never'

// ── API RESPONSES ─────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface CreateLinkResponse {
  link: PayLink
  url: string
}

export interface SendPaymentResponse {
  transaction: Transaction
  tx_hash: string
  settled_in_ms: number
}

// ── FORM STATES ───────────────────────────────────────────────
export interface CreateLinkForm {
  amount: string
  note: string
  receive_type: ReceiveType
  expiry: ExpiryOption
}

export interface SendMoneyForm {
  sender_contact: string
  recipient_contact: string
  amount: string
  note: string
  payment_method: PaymentMethod
}
