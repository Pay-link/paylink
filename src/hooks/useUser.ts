'use client'

import { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { supabase } from '@/lib/supabase'

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

      // Check if user exists
      const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle()

      if (existing) {
        // Update wallet address if changed
        if (existing.wallet_address !== walletAddress && walletAddress) {
          await supabase
            .from('users')
            .update({ wallet_address: walletAddress, updated_at: new Date().toISOString() })
            .eq('id', user!.id)
        }
        setProfile({ ...existing, wallet_address: walletAddress || existing.wallet_address })
      } else {
        // Create new user
        const newUser = {
          id: user!.id,
          email,
          phone,
          display_name: displayName,
          wallet_address: walletAddress,
          balance_usdc: 0,
          bank_setup: false,
          kyc_status: 'none',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        const { data: created } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single()
        if (created) setProfile(created)
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
