/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },               // prevent clickjacking
  { key: 'X-Content-Type-Options', value: 'nosniff' },           // prevent MIME sniffing
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://code.iconify.design https://api.iconify.design",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://logo.clearbit.com https://www.google.com https://icon.horse https://*.privy.io",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://rpc.testnet.arc.network https://ipapi.co https://open.er-api.com https://api.openai.com https://auth.privy.io https://*.privy.io wss://relay.walletconnect.com wss://www.walletlink.org",
      "frame-src 'self' https://auth.privy.io https://*.privy.io",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig = {
  images: {
    domains: ['logo.clearbit.com', 'www.google.com', 'icon.horse'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
