# PayLink

Send and receive money globally with just a link. Built on Arc Network, powered by USDC.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth & Wallets | Privy |
| Blockchain | Arc Network (testnet) |
| Stablecoin | USDC |
| Gas sponsorship | Pimlico |
| Database | Supabase |
| Deployment | Vercel |
| Fiat on-ramp | Ramp Network |
| Africa off-ramp | Yellow Card |

---

## Quick Start

### 1. Clone and install

```bash
cd paylink
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your keys:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | [dashboard.privy.io](https://dashboard.privy.io) |
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com/dashboard](https://supabase.com/dashboard) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `NEXT_PUBLIC_PIMLICO_API_KEY` | [dashboard.pimlico.io](https://dashboard.pimlico.io) |

### 3. Set up Supabase database

1. Go to your Supabase project
2. Open the **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run**

### 4. Copy HTML pages to public folder

Copy these files into the `/public` folder:
- `paylink-final (2).html` → rename to `landing.html`
- `paylink-send-v2.html` → rename to `send.html`
- `paylink-create-v2.html` → rename to `create.html`
- `paylink-otp-v2.html` → rename to `otp.html`
- `paylink-success-v2.html` → rename to `success.html`
- `paylink-bank-v2.html` → rename to `bank-setup.html`
- `paylink-dashboard.html` → rename to `dashboard.html`

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
paylink/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── links/
│   │   │   │   ├── create/route.ts      # POST - create payment link
│   │   │   │   └── [slug]/route.ts      # GET - fetch link by slug
│   │   │   └── transactions/
│   │   │       └── confirm/route.ts     # POST - record transaction
│   │   ├── pay/[id]/
│   │   │   ├── page.tsx                 # Payment page (server)
│   │   │   └── PaymentClient.tsx        # Payment page (client)
│   │   ├── send/page.tsx
│   │   ├── create/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── layout.tsx                   # Root layout with Privy
│   │   ├── globals.css
│   │   └── page.tsx                     # Homepage
│   ├── components/
│   │   ├── ui/
│   │   │   └── TestnetBanner.tsx
│   │   └── layout/
│   │       └── Nav.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── public/                              # Static HTML pages go here
├── supabase-schema.sql                  # Database schema
├── .env.example                         # Environment variables template
└── package.json
```

---

## Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/pay/[id]` | Payment page — fully functional |
| `/send` | Send money flow |
| `/create` | Create payment link |
| `/verify` | OTP verification |
| `/success` | Payment success |
| `/bank-setup` | Bank details setup |
| `/dashboard` | User dashboard |

---

## Arc Testnet

This app runs on Arc Testnet. All transactions use test USDC — no real money.

- **RPC:** https://rpc.testnet.arc.network
- **Explorer:** https://testnet.arcscan.app
- **Chain ID:** 1038

To get test USDC for development, use the Arc faucet (link to be added when available).

---

## Deployment on Vercel

```bash
npm install -g vercel
vercel
```

Add all environment variables from `.env.example` in your Vercel project settings.

---

## Roadmap

- [x] Landing page
- [x] Payment page (`/pay/[id]`)
- [x] Send money flow
- [x] Create link flow
- [x] OTP verification
- [x] Success receipt
- [x] Bank setup (KYC)
- [x] User dashboard
- [ ] Privy wallet integration (live)
- [ ] Arc App Kit `kit.send()` (live)
- [ ] Pimlico gas sponsorship (live)
- [ ] Supabase real-time balance
- [ ] Ramp Network fiat on-ramp
- [ ] Yellow Card Africa off-ramp
- [ ] Push notifications
- [ ] Mobile app (React Native)
