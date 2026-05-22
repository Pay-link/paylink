'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { Nav } from '@/components/layout/Nav'
import Link from 'next/link'

import { useUser } from '@/hooks/useUser'
import { timeAgo } from '@/lib/utils'
import { Icon } from '@iconify/react'

export default function TransactionsHistoryPage() {
  const { authenticated, ready, logout } = usePrivy()
  const { profile, displayName, userId } = useUser()
  const router = useRouter()
  const [transactions, setTransactions] = useState<any[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [selectedTx, setSelectedTx] = useState<any | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'sent' | 'received'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending'>('all')

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
    if (authenticated && userId) loadTransactions()
  }, [authenticated, userId])

  const loadTransactions = async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/transactions?userId=${encodeURIComponent(userId)}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setTransactions(data)
      } else {
        console.error('Transactions fetch error status:', res.status)
      }
    } catch (err) {
      console.error('Transactions fetch exception:', err)
    } finally {
      setDataLoaded(true)
    }
  }

  const displayTxs = transactions.map(tx => ({
    ...tx,
    type: tx.recipient_id === userId ? 'received' : 'sent',
    name: tx.recipient_id === userId 
          ? (tx.sender_email || tx.sender_id || 'Unknown') 
          : (tx.recipient_contact || tx.recipient_email || tx.recipient_wallet?.slice(0,8) || 'Unknown'),
    initials: (tx.recipient_id === userId ? (tx.sender_email || 'UK') : (tx.recipient_contact || tx.recipient_email || 'UK')).slice(0,2).toUpperCase(),
    color: tx.recipient_id === userId ? 'rgba(37,92,180,.12)' : 'rgba(220,50,50,.12)',
    tc: tx.recipient_id === userId ? 'var(--g1)' : '#CC2020',
  }))

  const filteredTxs = displayTxs.filter(tx => {
    const matchesSearch = tx.name.toLowerCase().includes(search.toLowerCase()) || 
                          (tx.note && tx.note.toLowerCase().includes(search.toLowerCase()))
    const matchesType = typeFilter === 'all' || tx.type === typeFilter
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

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
            { label: 'Transaction history', icon: 'ph:clock-countdown-bold', href: '/dashboard/transactions', active: true },
            { label: 'My links', icon: 'ph:link-simple-bold', href: '/dashboard/links' },
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
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Transaction History</div>
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
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Activity</h1>
              <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Search, filter and analyze your global ecosystem payments.</div>
            </div>
          </div>

          {/* Ledger Control & Filters Bar */}
          <div style={{ ...cardStyle, padding: '16px 20px', marginBottom: 20, background: 'var(--white)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                <Icon icon="ph:magnifying-glass-bold" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink4)', fontSize: 16 }} />
                <input
                  type="text"
                  placeholder="Search recipient, sender, or note..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--page)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    fontFamily: 'var(--font)',
                    outline: 'none',
                    transition: 'border-color .15s',
                  }}
                  className="search-input"
                />
              </div>

              {/* Filters Toggle Group */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                
                {/* Type Filter */}
                <div style={{ display: 'flex', background: 'var(--page)', borderRadius: 10, padding: 3, border: '1px solid var(--border)' }}>
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'sent', label: 'Sent' },
                    { key: 'received', label: 'Received' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setTypeFilter(tab.key as any)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: typeFilter === tab.key ? 700 : 500,
                        color: typeFilter === tab.key ? 'var(--g1)' : 'var(--ink3)',
                        background: typeFilter === tab.key ? 'var(--white)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: typeFilter === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all .15s'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div style={{ display: 'flex', background: 'var(--page)', borderRadius: 10, padding: 3, border: '1px solid var(--border)' }}>
                  {[
                    { key: 'all', label: 'All Status' },
                    { key: 'confirmed', label: 'Confirmed' },
                    { key: 'pending', label: 'Pending' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key as any)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: statusFilter === tab.key ? 700 : 500,
                        color: statusFilter === tab.key ? 'var(--g1)' : 'var(--ink3)',
                        background: statusFilter === tab.key ? 'var(--white)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: statusFilter === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all .15s'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

              </div>
            </div>
          </div>

          {/* Transactions Ledger */}
          <div style={cardStyle}>
            {filteredTxs.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink3)' }}>
                <Icon icon="ph:empty-bold" style={{ fontSize: 42, color: 'var(--ink4)', marginBottom: 12, display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink2)', marginBottom: 4 }}>No transactions found</div>
                <div style={{ fontSize: 12, color: 'var(--ink4)' }}>
                  {dataLoaded ? 'Try adjusting your filters or search keywords.' : 'Loading transactions...'}
                </div>
              </div>
            ) : (
              filteredTxs.map((tx: any, i: number) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 20px',
                    borderBottom: i < filteredTxs.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--page)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Initials Circle */}
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: tx.color, color: tx.tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {tx.initials}
                  </div>

                  {/* Transaction Metadata */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {tx.name}
                      </span>
                      {tx.tx_hash && (
                        <span title="On-chain Transaction" style={{ fontSize: 11, color: 'var(--g1)', display: 'inline-flex', alignItems: 'center' }}>
                          <Icon icon="ph:shield-check-bold" />
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink4)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: tx.type === 'sent' ? '#E53935' : 'var(--g1)', textTransform: 'capitalize' }}>
                        {tx.type}
                      </span>
                      <span>·</span>
                      <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.note || 'No note'}
                      </span>
                      <span>·</span>
                      <span>{timeAgo(tx.created_at)}</span>
                    </div>
                  </div>

                  {/* Amount and Status Badge */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: tx.type === 'sent' ? 'var(--ink)' : 'var(--g1)', marginBottom: 3 }}>
                      {tx.type === 'sent' ? '−' : '+'}${tx.amount.toFixed(2)}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: tx.status === 'confirmed' ? 'var(--g-soft)' : 'rgba(245,158,11,.15)', color: tx.status === 'confirmed' ? 'var(--g1)' : '#FDB64E', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div onClick={() => setSelectedTx(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,.6)', border: '1px solid var(--border)', position: 'relative' }}>
            <button onClick={() => setSelectedTx(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--ink3)', transition: 'color 0.2s' }}>×</button>
            
            <div style={{ textAlign: 'center', marginBottom: 24, marginTop: 10 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: selectedTx.color, color: selectedTx.tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, margin: '0 auto 12px' }}>
                {selectedTx.initials}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                {selectedTx.type === 'sent' ? 'Sent Money' : 'Received Money'}
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: selectedTx.type === 'sent' ? 'var(--ink)' : 'var(--g1)', letterSpacing: '-.04em' }}>
                {selectedTx.type === 'sent' ? '−' : '+'}${selectedTx.amount.toFixed(2)} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink3)' }}>USDC</span>
              </div>
            </div>

            {/* Money Flow Visual */}
            <div style={{ background: 'var(--page)', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, border: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'left', width: '40%', overflow: 'hidden' }}>
                <div style={{ fontSize: 10, color: 'var(--ink4)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Sender</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {selectedTx.type === 'sent' ? 'You' : selectedTx.name}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%' }}>
                <Icon icon="ph:arrow-right-bold" style={{ fontSize: 18, color: 'var(--g1)', animation: 'pulse 2s infinite' }} />
              </div>
              <div style={{ textAlign: 'right', width: '40%', overflow: 'hidden' }}>
                <div style={{ fontSize: 10, color: 'var(--ink4)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Recipient</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {selectedTx.type === 'sent' ? selectedTx.name : 'You'}
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--ink3)' }}>Status</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: selectedTx.status === 'confirmed' ? 'var(--g-soft)' : 'rgba(245,158,11,.15)', color: selectedTx.status === 'confirmed' ? 'var(--g1)' : '#FDB64E' }}>
                  {selectedTx.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--ink3)' }}>Date</span>
                <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
                  {new Date(selectedTx.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--ink3)' }}>Note</span>
                <span style={{ color: 'var(--ink)', fontWeight: 500, fontStyle: selectedTx.note ? 'normal' : 'italic' }}>
                  {selectedTx.note || 'No note'}
                </span>
              </div>
              {selectedTx.tx_hash && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--ink3)' }}>On-Chain Hash</span>
                  <span style={{ color: 'var(--ink)', fontFamily: 'monospace', fontSize: 12 }}>
                    {selectedTx.tx_hash.slice(0, 8)}...{selectedTx.tx_hash.slice(-8)}
                  </span>
                </div>
              )}
            </div>

            {/* Block Explorer Link */}
            {selectedTx.tx_hash ? (
              <a href={`https://testnet.arcscan.app/tx/${selectedTx.tx_hash}`} target="_blank" rel="noopener noreferrer" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--g1)', color: '#fff', borderRadius: 100, padding: '14px', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 14px rgba(37,92,180,.25)', transition: 'all .2s' }}>
                <Icon icon="ph:magnifying-glass-bold" /> View on ArcScan Explorer ↗
              </a>
            ) : (
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink4)', background: 'var(--page)', padding: '10px 14px', borderRadius: 12 }}>
                <Icon icon="ph:info-bold" style={{ verticalAlign: 'middle', marginRight: 4 }} /> Off-chain payment (No on-chain hash available)
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .dash-mobile-nav-wrapper { display: none; }
        @media(max-width:768px){
          .dash-mobile-nav-wrapper { display: block; }
          .desktop-sidebar{display:none!important}
          .desktop-main{margin-left:0!important}
          .desktop-topbar{display:none!important}
          .dash-content{padding-top:16px!important;padding-bottom:90px!important;padding-left:16px!important;padding-right:16px!important}
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

      <MobileBottomNav activeTab="activity" />
    </div>
  )
}
