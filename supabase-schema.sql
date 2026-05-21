-- ─────────────────────────────────────────────────────────────
-- PayLink Database Schema
-- Run this in your Supabase SQL editor to set up the database
-- ─────────────────────────────────────────────────────────────

-- ── USERS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                      -- Privy user ID
  email TEXT,
  phone TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  wallet_address TEXT,
  balance_usdc DECIMAL(18,6) DEFAULT 0,
  bank_setup BOOLEAN DEFAULT FALSE,
  bank_country TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_currency TEXT,
  kyc_status TEXT DEFAULT 'none'
    CHECK (kyc_status IN ('none','pending','verified','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PAYMENT LINKS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                -- e.g. "ox-apr-8f2k"
  owner_id TEXT NOT NULL REFERENCES users(id),
  owner_name TEXT NOT NULL,
  owner_email TEXT,
  owner_wallet TEXT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  note TEXT DEFAULT '',
  receive_type TEXT DEFAULT 'crypto'
    CHECK (receive_type IN ('crypto','bank')),
  expiry TIMESTAMPTZ,                       -- NULL = never expires
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','paid','expired','cancelled')),
  paid_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TRANSACTIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES payment_links(id),
  sender_id TEXT REFERENCES users(id),
  sender_email TEXT,
  sender_wallet TEXT NOT NULL,
  recipient_id TEXT NOT NULL REFERENCES users(id),
  recipient_wallet TEXT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  note TEXT DEFAULT '',
  tx_hash TEXT,
  arc_block TEXT,
  gas_fee DECIMAL(18,6) DEFAULT 0,          -- always 0 on Arc
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','failed')),
  payment_method TEXT DEFAULT 'email_otp'
    CHECK (payment_method IN ('email_otp','wallet','card','bank','mobile_money')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- ── FAVOURITE CONTACTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL REFERENCES users(id),
  contact_id TEXT REFERENCES users(id),
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_initials TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PENDING CLAIMS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pending_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_token TEXT UNIQUE NOT NULL,
  sender_id TEXT NOT NULL REFERENCES users(id),
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  recipient_email TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  note TEXT DEFAULT '',
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','claimed','expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  claimed_by TEXT REFERENCES users(id),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payment_links_slug ON payment_links(slug);
CREATE INDEX IF NOT EXISTS idx_payment_links_owner ON payment_links(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recipient ON transactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_link ON transactions(link_id);
CREATE INDEX IF NOT EXISTS idx_favourites_owner ON favourites(owner_id);
CREATE INDEX IF NOT EXISTS idx_pending_claims_token ON pending_claims(claim_token);
CREATE INDEX IF NOT EXISTS idx_pending_claims_sender ON pending_claims(sender_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_claims ENABLE ROW LEVEL SECURITY;

-- Users: can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid()::text = id);

-- Payment links: owners manage their own, anyone can read active links
CREATE POLICY "Anyone can read active payment links"
  ON payment_links FOR SELECT USING (status = 'active');

CREATE POLICY "Owners can manage their links"
  ON payment_links FOR ALL USING (auth.uid()::text = owner_id);

-- Transactions: users see their own sent/received
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid()::text = sender_id OR auth.uid()::text = recipient_id);

-- Favourites: users manage their own
CREATE POLICY "Users manage own favourites"
  ON favourites FOR ALL USING (auth.uid()::text = owner_id);

-- Pending Claims: anyone can read claims via token, senders manage their own
CREATE POLICY "Anyone can view pending claims via token"
  ON pending_claims FOR SELECT USING (TRUE);

CREATE POLICY "Senders can manage their claims"
  ON pending_claims FOR ALL USING (auth.uid()::text = sender_id);

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_links_updated_at
  BEFORE UPDATE ON payment_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pending_claims_updated_at
  BEFORE UPDATE ON pending_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RPC FUNCTIONS ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_paid_count(link_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE payment_links SET paid_count = paid_count + 1 WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;
