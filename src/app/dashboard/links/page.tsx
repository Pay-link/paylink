'use client'

import { useEffect, useState, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { Nav } from '@/components/layout/Nav'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { getExpiryLabel, getLinkUrl, formatUSD } from '@/lib/utils'
import { Icon } from '@iconify/react'

export default function PaymentLinksPage() {
  const { authenticated, ready, logout } = usePrivy()
  const { profile, displayName, userId } = useUser()
  const router = useRouter()
  const [links, setLinks] = useState<any[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')
  
  // Kebab Dropdown menu state
  const [openKebabId, setOpenKebabId] = useState<string | null>(null)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('zp-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('zp-theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  useEffect(() => {
    if (ready && !authenticated) router.push('/')
  }, [ready, authenticated])

  useEffect(() => {
    if (authenticated && userId) loadLinks()
  }, [authenticated, userId])

  const loadLinks = async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/links?ownerId=${encodeURIComponent(userId)}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setLinks(data)
      } else {
        console.error('Payment links fetch error status:', res.status)
      }
    } catch (err) {
      console.error('Payment links load exception:', err)
    } finally {
      setDataLoaded(true)
    }
  }

  const handleDelete = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this payment link? This action cannot be undone.')) return
    try {
      const res = await fetch('/api/links', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: linkId }),
      })

      if (res.ok) {
        setLinks(prev => prev.filter(l => l.id !== linkId))
        setOpenKebabId(null)
      } else {
        console.error('Failed to delete payment link')
        alert('Failed to delete payment link.')
      }
    } catch (err) {
      console.error('Exception deleting link:', err)
    }
  }

  const handleCopy = (slug: string, id: string) => {
    const url = getLinkUrl(slug)
    navigator.clipboard.writeText(url)
    setCopiedLinkId(id)
    setTimeout(() => {
      setCopiedLinkId(null)
      setOpenKebabId(null)
    }, 1500)
  }

  // Close menus on outside click
  useEffect(() => {
    if (!openKebabId) return
    const handleOutsideClick = () => {
      setOpenKebabId(null)
      setShowShareMenu(false)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [openKebabId])

  const processedLinks = links.map(link => {
    const isExpired = link.expiry && new Date(link.expiry) < new Date()
    const resolvedStatus = isExpired ? 'expired' : link.status
    const isActive = resolvedStatus === 'active'
    return { ...link, resolvedStatus, isActive }
  })

  const activeLinks = processedLinks.filter(l => l.isActive)
  const inactiveLinks = processedLinks.filter(l => !l.isActive)

  const currentDisplayList = activeTab === 'active' ? activeLinks : inactiveLinks

  if (!authenticated) return null

  const cardStyle = { background: 'var(--white)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,.35)' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page)', fontFamily: 'var(--font)' }}>

      {/* Sidebar */}
      <aside className="desktop-sidebar" style={{ width: sidebarOpen ? 240 : 0, flexShrink: 0, background: 'var(--white)', borderRight: sidebarOpen ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: 'auto', overflowX: 'hidden', transition: 'width .2s ease', }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 208 }}>
          <div>
            <Link href="/" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', textDecoration: 'none', display: 'block' }}>
              za<span style={{ color: 'var(--g1)' }}>pay</span>
            </Link>
            <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 3 }}>Your global wallet</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink3)', flexShrink: 0 }}>
            <Icon icon="ph:x-bold" style={{ fontSize: 14 }} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink4)', letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 6 }}>Main</div>
          {[
            { label: 'Dashboard', icon: 'ph:squares-four-bold', href: '/dashboard' },
            { label: 'Send money', icon: 'ph:paper-plane-right-bold', href: '/send' },
            { label: 'Create link', icon: 'ph:link-bold', href: '/create' },
            { label: 'Faucet', icon: 'ph:drop-bold', href: 'https://faucet.circle.com', external: true },
          ].map(item => {
            const style = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: 'var(--ink3)', background: 'transparent', textDecoration: 'none', marginBottom: 2 } as React.CSSProperties
            return (item as any).external ? (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={style}>
                <Icon icon={item.icon} style={{ fontSize: 16 }} />{item.label}
              </a>
            ) : (
              <Link key={item.label} href={item.href} style={style}>
                <Icon icon={item.icon} style={{ fontSize: 16 }} />{item.label}
              </Link>
            )
          })}

          <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink4)', letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 12px', margin: '16px 0 6px' }}>Account</div>
          {[
            { label: 'Transaction history', icon: 'ph:clock-countdown-bold', href: '/dashboard/transactions' },
            { label: 'My links', icon: 'ph:link-simple-bold', href: '/dashboard/links', active: true },
            { label: 'Escrow claims', icon: 'ph:lock-key-bold', href: '/dashboard?escrow=true' },
            { label: 'Bank settings', icon: 'ph:bank-bold', href: '/bank-setup' },
            { label: 'Settings', icon: 'ph:gear-six-bold', href: '#' },
            { label: 'Zapay support', icon: 'ph:question-bold', action: () => window.dispatchEvent(new CustomEvent('open-chat')) },
          ].map(item => {
            const isActive = (item as any).active
            return item.href ? (
              <Link key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--g1)' : 'var(--ink3)', background: isActive ? 'var(--g-soft)' : 'transparent', textDecoration: 'none', marginBottom: 2 }}>
                <Icon icon={item.icon} style={{ fontSize: 16 }} />{item.label}
              </Link>
            ) : (
              <button key={item.label} onClick={(item as any).action} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: 'var(--ink3)', textDecoration: 'none', marginBottom: 2, width: '100%', fontFamily: 'var(--font)' }}>
                <Icon icon={item.icon} style={{ fontSize: 16 }} />{item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="desktop-main" style={{ flex: 1, marginLeft: sidebarOpen ? 240 : 0, minWidth: 0, transition: 'margin-left .2s ease' }}>

        {/* Mobile nav */}
        <div className="dash-mobile-nav-wrapper">
          <Nav variant="app" />
        </div>

        {/* Top bar */}
        <div className="desktop-topbar zp-dash-topbar" style={{ position: 'sticky', top: 0, zIndex: 40, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(9,9,14,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink3)', flexShrink: 0 }}>
                <Icon icon="ph:list-bold" style={{ fontSize: 16 }} />
              </button>
            )}
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Payment Links</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, color: 'var(--ink3)', flexShrink: 0, transition: 'all .15s' }}>
              <Icon icon={theme === 'dark' ? 'ph:sun-bold' : 'ph:moon-bold'} />
            </button>
            <button onClick={logout} style={{ padding: '7px 16px', borderRadius: 100, border: '1px solid var(--border)', color: 'var(--ink3)', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'transparent', fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}>Log out</button>
          </div>
        </div>

        <div style={{ padding: '24px 20px 80px' }} className="dash-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>My Links</h1>
              <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Generate, distribute, and collect global ecosystem payments seamlessly.</div>
            </div>
            <button
              onClick={() => router.push('/create')}
              style={{
                background: 'var(--g1)',
                color: '#fff',
                border: 'none',
                borderRadius: 100,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(37,92,180,.25)',
                transition: 'all 0.2s',
              }}
              className="create-link-btn"
            >
              <Icon icon="ph:plus-bold" /> Create New Link
            </button>
          </div>

          {/* Active / Inactive Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 24, marginBottom: 20 }}>
            {[
              { key: 'active', label: `Active Links (${activeLinks.length})` },
              { key: 'inactive', label: `Expired & Paid (${inactiveLinks.length})` }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any)
                  setOpenKebabId(null)
                  setShowShareMenu(false)
                }}
                style={{
                  padding: '12px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid var(--g1)' : '2px solid transparent',
                  color: activeTab === tab.key ? 'var(--ink)' : 'var(--ink3)',
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* MetaMask Activity Style Single-Column List */}
          <div style={{ ...cardStyle, background: 'var(--white)', overflow: 'visible' }}>
            {currentDisplayList.length === 0 ? (
              <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--ink3)' }}>
                <Icon icon="ph:link-break-bold" style={{ fontSize: 48, color: 'var(--ink4)', marginBottom: 12, display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink2)', marginBottom: 4 }}>No links here</div>
                <div style={{ fontSize: 13, color: 'var(--ink4)', marginBottom: 16 }}>
                  {activeTab === 'active' 
                    ? "You don't have any active payment links right now." 
                    : "No inactive or expired payment links found."}
                </div>
                {activeTab === 'active' && (
                  <button onClick={() => router.push('/create')} style={{ background: 'var(--g-soft)', color: 'var(--g1)', border: 'none', borderRadius: 100, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Create your first link
                  </button>
                )}
              </div>
            ) : (
              currentDisplayList.map((link, i) => (
                <div
                  key={link.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 20px',
                    borderBottom: i < currentDisplayList.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background-color 0.15s ease',
                    position: 'relative',
                  }}
                  className="list-row-item"
                >
                  
                  {/* Soft circular avatar */}
                  <div 
                    style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: '50%', 
                      background: link.isActive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(0, 0, 0, 0.06)', 
                      color: link.isActive ? 'var(--g1)' : 'var(--ink4)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      flexShrink: 0 
                    }}
                  >
                    <Icon icon="ph:link-simple-bold" style={{ fontSize: 20 }} />
                  </div>

                  {/* Main Link Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                        {formatUSD(link.amount)}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)' }}>
                        USDC
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500, marginBottom: 4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontStyle: link.note ? 'normal' : 'italic' }}>
                      {link.note || 'No description'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink4)', flexWrap: 'wrap' }}>
                      <Icon icon="ph:clock-bold" />
                      <span>Created {new Date(link.created_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span style={{ textTransform: 'capitalize' }}>{link.receive_type} payout</span>
                    </div>
                  </div>

                  {/* Expiry Pill, usage count, and Kebab action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    
                    {/* Status badges & usage info */}
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6 }} className="badges-column">
                      <div>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '.06em',
                          padding: '3px 8px',
                          borderRadius: 20,
                          background: link.isActive ? 'var(--g-soft)' : 'rgba(0,0,0,0.06)',
                          color: link.isActive ? 'var(--g1)' : 'var(--ink4)',
                        }}>
                          {getExpiryLabel(link.expiry)}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--g1)' }}>
                        {link.paid_count} collected
                      </div>
                    </div>

                    {/* Vertical Kebab Button & Floating Dropdown */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation() // Prevent triggers
                          if (openKebabId === link.id) {
                            setOpenKebabId(null)
                            setShowShareMenu(false)
                          } else {
                            setOpenKebabId(link.id)
                            setShowShareMenu(false)
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--ink3)',
                          cursor: 'pointer',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                        className="kebab-btn"
                      >
                        <Icon icon="ph:dots-three-vertical-bold" style={{ fontSize: 18 }} />
                      </button>

                      {/* Floating Kebab Dropdown */}
                      {openKebabId === link.id && (
                        <div
                          onClick={(e) => e.stopPropagation()} // Stop closing
                          style={{
                            position: 'absolute',
                            top: 36,
                            right: 0,
                            background: 'var(--white)',
                            border: '1px solid var(--border)',
                            borderRadius: 14,
                            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                            padding: 6,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            zIndex: 100,
                            minWidth: 168,
                            animation: 'fadeInUp 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                        >
                          {!showShareMenu ? (
                            <>
                              {/* Option: Copy Link */}
                              <button
                                onClick={() => handleCopy(link.slug, link.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: copiedLinkId === link.id ? 'var(--g1)' : 'var(--ink)',
                                  background: copiedLinkId === link.id ? 'var(--g-soft)' : 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  width: '100%',
                                  transition: 'background-color 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  if (copiedLinkId !== link.id) e.currentTarget.style.backgroundColor = 'var(--page)'
                                }}
                                onMouseLeave={(e) => {
                                  if (copiedLinkId !== link.id) e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                <Icon icon={copiedLinkId === link.id ? 'ph:check-bold' : 'ph:copy-bold'} style={{ fontSize: 14 }} />
                                {copiedLinkId === link.id ? 'Copied URL!' : 'Copy Payment URL'}
                              </button>

                              {/* Option: Share Link */}
                              <button
                                onClick={() => setShowShareMenu(true)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: 'var(--ink)',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  width: '100%',
                                  transition: 'background-color 0.15s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--page)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Icon icon="ph:share-network-bold" style={{ fontSize: 14 }} />
                                Share Link...
                              </button>

                              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                              {/* Option: Delete Link */}
                              <button
                                onClick={() => handleDelete(link.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: '#DC2626',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  width: '100%',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.08)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                <Icon icon="ph:trash-bold" style={{ fontSize: 14 }} />
                                Delete Link
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Submenu Header / Back Button */}
                              <button
                                onClick={() => setShowShareMenu(false)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '6px 8px',
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: 'var(--ink3)',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  width: '100%',
                                  textAlign: 'left',
                                  marginBottom: 4,
                                }}
                              >
                                <Icon icon="ph:arrow-left-bold" /> Back
                              </button>

                              {/* WhatsApp */}
                              <a
                                href={`https://wa.me/?text=${encodeURIComponent(`Pay me ${formatUSD(link.amount)} via ZaPay: ${getLinkUrl(link.slug)}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                  setOpenKebabId(null)
                                  setShowShareMenu(false)
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  color: 'var(--ink2)',
                                  textDecoration: 'none',
                                  fontWeight: 500,
                                  transition: 'background-color .15s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--page)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Icon icon="ph:whatsapp-logo-bold" style={{ fontSize: 15, color: '#25D366' }} />
                                WhatsApp
                              </a>

                              {/* Telegram */}
                              <a
                                href={`https://t.me/share/url?url=${encodeURIComponent(getLinkUrl(link.slug))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                  setOpenKebabId(null)
                                  setShowShareMenu(false)
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  color: 'var(--ink2)',
                                  textDecoration: 'none',
                                  fontWeight: 500,
                                  transition: 'background-color .15s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--page)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Icon icon="ph:telegram-logo-bold" style={{ fontSize: 15, color: '#0088cc' }} />
                                Telegram
                              </a>

                              {/* Twitter / X */}
                              <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Pay me ${formatUSD(link.amount)} via ZaPay: ${getLinkUrl(link.slug)}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                  setOpenKebabId(null)
                                  setShowShareMenu(false)
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  color: 'var(--ink2)',
                                  textDecoration: 'none',
                                  fontWeight: 500,
                                  transition: 'background-color .15s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--page)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Icon icon="ph:twitter-logo-bold" style={{ fontSize: 15, color: '#1DA1F2' }} />
                                Twitter / X
                              </a>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dash-mobile-nav-wrapper { display: none; }
        .list-row-item:hover {
          background-color: var(--page) !important;
        }
        .kebab-btn:hover {
          background-color: var(--page) !important;
          color: var(--ink) !important;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media(max-width:768px){
          .dash-mobile-nav-wrapper { display: block; }
          .desktop-sidebar{display:none!important}
          .desktop-main{margin-left:0!important}
          .desktop-topbar{display:none!important}
          .dash-content{padding-top:16px!important;padding-bottom:90px!important;padding-left:12px!important;padding-right:12px!important}
          .badges-column { display: none !important; }
        }
        [data-theme="light"] .zp-dash-topbar {
          background: rgba(242,244,250,0.95) !important;
          border-bottom-color: rgba(0,0,0,0.08) !important;
        }
        [data-theme="light"] .desktop-sidebar {
          background: var(--white) !important;
          border-right-color: rgba(0,0,0,0.08) !important;
        }
      `}</style>

      <MobileBottomNav activeTab="links" />
    </div>
  )
}
