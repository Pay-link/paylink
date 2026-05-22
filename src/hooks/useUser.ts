'use client'

import { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'


export interface UserProfile {
  id: string
  email: string | null
  phone: string | null
  display_name: string
  wallet_address: string
  balance_usdc: number
  bank_setup: boolean
  created_at: string
}

export function useUser() {
  const { authenticated, ready, user } = usePrivy()
  const { wallets } = useWallets()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ready && authenticated && user) {
      syncUser()
    } else if (ready && !authenticated) {
      setProfile(null)
      setLoading(false)
    }
  }, [ready, authenticated, user, wallets])

  const syncUser = async () => {
    try {
      const embeddedWallet = wallets.find(w => w.walletClientType === 'privy')
      const walletAddress = embeddedWallet?.address || ''
      const email = user?.email?.address || null
      const phone = user?.phone?.number || null
      const displayName = email?.split('@')[0] || phone || 'ZaPay User'

      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user!.id,
          email,
          phone,
          displayName,
          walletAddress,
        }),
      })

      if (!res.ok) {
        throw new Error(`Sync request failed with status ${res.status}`)
      }

      const synced = await res.json()
      if (synced && !synced.error) {
        setProfile(synced)
      }
    } catch (err) {
      console.error('useUser sync error:', err)
    } finally {
      setLoading(false)
    }
  }

  const walletAddress = wallets.find(w => w.walletClientType === 'privy')?.address || ''
  const email = user?.email?.address || null
  const phone = user?.phone?.number || null
  const displayName = profile?.display_name || email?.split('@')[0] || phone || 'ZaPay User'

  return {
    profile,
    loading,
    walletAddress,
    email,
    phone,
    displayName,
    userId: user?.id || null,
    isReady: ready && !loading,
  }
}
