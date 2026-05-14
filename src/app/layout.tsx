'use client'

import './globals.css'
import { PrivyProvider } from '@privy-io/react-auth'
import { TestnetBanner } from '@/components/ui/TestnetBanner'
import { ChatWidget } from '@/components/ui/ChatWidget'

const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>ZaPay — Send money to anyone with just a link</title>
        <meta name="description" content="Send or receive USDC instantly across borders. No middlemen, no delays. Powered by Arc." />
        <meta name="theme-color" content="#09090E" />
        <meta property="og:title" content="ZaPay — Send money to anyone with just a link" />
        <meta property="og:description" content="Send or receive USDC instantly across borders. No middlemen, no delays. Powered by Arc." />
        <meta property="og:site_name" content="ZaPay" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Google+Sans+Display:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script
          src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"
          async
        />
      </head>
      <body>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'placeholder'}
          config={{
            loginMethods: ['email', 'sms'],
            appearance: {
              theme: 'light',
              accentColor: '#1E6B32',
            },
            embeddedWallets: {
              createOnLogin: 'users-without-wallets',
            },
            defaultChain: arcTestnet,
            supportedChains: [arcTestnet],
          }}
        >
          <TestnetBanner />
          {children}
          <ChatWidget />
        </PrivyProvider>
      </body>
    </html>
  )
}
