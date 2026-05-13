'use client'

import './globals.css'
import { PrivyProvider } from '@privy-io/react-auth'
import { TestnetBanner } from '@/components/ui/TestnetBanner'

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
        </PrivyProvider>
      </body>
    </html>
  )
}
