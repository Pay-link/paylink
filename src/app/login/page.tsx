'use client'

import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { authenticated, ready, login } = usePrivy()
  const router = useRouter()

  useEffect(() => {
    if (ready && authenticated) router.push('/dashboard')
    else if (ready && !authenticated) login()
  }, [ready, authenticated])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--page)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          pay<span style={{ color: 'var(--g1)' }}>link</span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink3)' }}>Signing you in...</div>
      </div>
    </div>
  )
}
