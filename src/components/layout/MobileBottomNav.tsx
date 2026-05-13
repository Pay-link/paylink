'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'

interface MobileBottomNavProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

const TABS = [
  { id: 'home',     icon: 'ph:squares-four-bold',        label: 'Home',     href: '/dashboard' },
  { id: 'links',    icon: 'ph:link-bold',                label: 'Links',    href: '/dashboard' },
  { id: 'send',     icon: 'ph:paper-plane-right-bold',   label: 'Send',     href: '/send' },
  { id: 'activity', icon: 'ph:clock-countdown-bold',     label: 'Activity', href: '/dashboard' },
]

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const resolvedActive = activeTab ?? (
    pathname.startsWith('/send') || pathname.startsWith('/verify') || pathname.startsWith('/success')
      ? 'send'
      : pathname.startsWith('/create')
      ? 'create'
      : 'home'
  )

  const handleTab = (tab: typeof TABS[number]) => {
    if (onTabChange) {
      onTabChange(tab.id)
      if (tab.id === 'send') router.push('/send')
    } else {
      router.push(tab.href)
    }
  }

  return (
    <>
      <style>{`
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 100;
          background: var(--white);
          border-top: 1px solid var(--border);
          height: calc(64px + env(safe-area-inset-bottom));
          align-items: center;
          justify-content: space-around;
          padding: 0 4px env(safe-area-inset-bottom);
        }
        @media(max-width: 768px) {
          .mobile-bottom-nav { display: flex; }
        }
      `}</style>
      <div className="mobile-bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTab(tab)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 12px', borderRadius: 12, fontFamily: 'var(--font)',
              color: resolvedActive === tab.id ? 'var(--g1)' : 'var(--ink4)',
            }}
          >
            <Icon icon={tab.icon} style={{ fontSize: 22 }} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>{tab.label}</span>
          </button>
        ))}
        <button
          onClick={() => router.push('/create')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'var(--g1)', border: 'none', cursor: 'pointer',
            padding: '10px 16px', borderRadius: 14, color: '#fff',
            fontFamily: 'var(--font)', boxShadow: '0 4px 14px rgba(255,107,0,.3)',
          }}
        >
          <Icon icon="ph:plus-bold" style={{ fontSize: 20 }} />
          <span style={{ fontSize: 10, fontWeight: 700 }}>Create</span>
        </button>
      </div>
    </>
  )
}
