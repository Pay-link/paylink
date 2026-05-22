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
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 28, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/zapay-icon.svg" alt="" aria-hidden="true" width={32} height={32} style={{ display: 'block', flexShrink: 0 }} />
          <span>za<span style={{ color: 'var(--g1)' }}>pay</span></span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink3)' }}>Signing you in...</div>
      </div>
    </div>
  )
}
