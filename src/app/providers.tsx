'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { TestnetBanner } from '@/components/ui/TestnetBanner'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { FeedbackModal } from '@/components/ui/FeedbackModal'

const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
}

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  if (!appId) {
    // During build/prerender without env vars — render without Privy
    return <>{children}</>
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email', 'sms'],
        appearance: { theme: 'light', accentColor: '#1E6B32' },
        embeddedWallets: { createOnLogin: 'users-without-wallets' },
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet],
      }}
    >
      <TestnetBanner />
      {children}
      <ChatWidget />
      <FeedbackModal />
    </PrivyProvider>
  )
}
