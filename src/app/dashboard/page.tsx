'use client'

import { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { Nav } from '@/components/layout/Nav'
import Link from 'next/link'
import { createWalletClient, custom, createPublicClient, http, parseAbiItem, padHex } from 'viem'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { formatUSD, timeAgo, getExpiryLabel } from '@/lib/utils'
import { useLocalCurrency } from '@/hooks/useLocalCurrency'
import { Icon } from '@iconify/react'
import { escrowAbi, ESCROW_ADDRESS } from '@/lib/escrowAbi'
import { OnboardingTour } from '@/components/onboarding/OnboardingTour'

const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] }, public: { http: ['https://rpc.testnet.arc.network'] } },
} as const

const usdcAddress = '0x3600000000000000000000000000000000000000' as `0x${string}`
const usdcAbi = [
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
] as const

export default function DashboardPage() {
  const { authenticated, ready, logout } = usePrivy()
  const { wallets } = useWallets()
  const { profile, walletAddress, email, phone, displayName, userId } = useUser()
  const router = useRouter()
  const [links, setLinks] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [pendingClaims, setPendingClaims] = useState<any[]>([])
  const [displayBalance, setDisplayBalance] = useState(0)
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [showLocal, setShowLocal] = useState(false)
  const localCurrency = useLocalCurrency()
  const [topUpMethod, setTopUpMethod] = useState(0)
  const [copied, setCopied] = useState(false)
  const [mobileTab, setMobileTab] = useState<'home' | 'links' | 'send' | 'activity'>('home')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifOpen, setNotifOpen] = useState(false)
  const [openLinkMenuId, setOpenLinkMenuId] = useState<string | null>(null)
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [selectedTx, setSelectedTx] = useState<any | null>(null)

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
    if (!notifOpen) return
    const close = () => setNotifOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [notifOpen])

  useEffect(() => {
    if (!openLinkMenuId) return
    const close = () => setOpenLinkMenuId(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [openLinkMenuId])

  useEffect(() => {
    if (authenticated && userId) loadRealData()
  }, [authenticated, userId])

  const loadRealData = async () => {
    try {
      const [linksData, txData, claimsData] = await Promise.all([
        supabase.from('payment_links').select('*').eq('owner_id', userId).order('created_at', { ascending: false }).limit(10),
        supabase.from('transactions').select('*').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at', { ascending: false }).limit(10),
        supabase.from('pending_claims').select('*').eq('sender_id', userId).eq('status', 'pending').order('created_at', { ascending: false }).limit(10),
      ])
      if (linksData.error) console.error('Links fetch error:', linksData.error)
      else if (linksData.data?.length) setLinks(linksData.data)

      if (txData.error) console.error('Transactions fetch error:', txData.error)
      else if (txData.data?.length) setTransactions(txData.data)

      if (claimsData.error) console.error('Claims fetch error:', claimsData.error)
      else if (claimsData.data) setPendingClaims(claimsData.data)
    } catch (err) {
      console.error('Dashboard data error:', err)
    } finally {
      setDataLoaded(true)
    }
  }

  // Fetch live USDC balance from Arc chain
  useEffect(() => {
    if (!walletAddress || !userId) return

    const client = createPublicClient({ chain: arcTestnet, transport: http('https://rpc.testnet.arc.network') })

    const fetchBalance = async () => {
      try {
        const raw = await client.readContract({
          address: usdcAddress,
          abi: usdcAbi,
          functionName: 'balanceOf',
          args: [walletAddress as `0x${string}`],
        })
        const bal = Number(raw) / 1_000_000 // USDC has 6 decimals
        animateBalance(bal)
      } catch (err) {
        console.error('Balance fetch error:', err)
      }
    }

    // Initial fetch
    fetchBalance()

    const transferAbi = [...usdcAbi, parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')] as const
    const addr = walletAddress as `0x${string}`

    // 1a. On-chain: incoming transfers (top-up / received payment)
    const unwatchIn = client.watchContractEvent({
      address: usdcAddress, abi: transferAbi, eventName: 'Transfer',
      args: { to: addr },
      onLogs: () => fetchBalance(),
      poll: true, pollingInterval: 4000,
    })

    // 1b. On-chain: outgoing transfers (send money)
    const unwatchOut = client.watchContractEvent({
      address: usdcAddress, abi: transferAbi, eventName: 'Transfer',
      args: { from: addr },
      onLogs: () => fetchBalance(),
      poll: true, pollingInterval: 4000,
    })

    // 2. Supabase Realtime: any transaction involving this user (sent or received)
    const channel = supabase
      .channel(`txns-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'transactions',
        filter: `recipient_id=eq.${userId}`,
      }, (payload) => {
        fetchBalance()
        setTransactions(prev =>
          prev.some(t => t.id === (payload.new as any).id) ? prev : [payload.new as any, ...prev]
        )
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'transactions',
        filter: `sender_id=eq.${userId}`,
      }, (payload) => {
        fetchBalance()
        setTransactions(prev =>
          prev.some(t => t.id === (payload.new as any).id) ? prev : [payload.new as any, ...prev]
        )
      })
      .subscribe()

    return () => {
      unwatchIn()
      unwatchOut()
      supabase.removeChannel(channel)
    }
  }, [walletAddress, userId])

  const handleRefund = async (claim: any) => {
    if (!ESCROW_ADDRESS || ESCROW_ADDRESS === '0x') {
      alert("Escrow contract not deployed. Simulating refund on DB...")
      await supabase.from('pending_claims').update({ status: 'expired' }).eq('id', claim.id)
      setPendingClaims(prev => prev.filter(c => c.id !== claim.id))
      return
    }
    try {
      const activeWallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0]
      if (!activeWallet) return alert("Wallet not connected")

      const provider = await activeWallet.getEthereumProvider()
      const walletClient = createWalletClient({
        account: activeWallet.address as `0x${string}`,
        transport: custom(provider),
      })
      
      const claimHash = padHex(`0x${claim.claim_token}`, { size: 32 })
      
      const refundHash = await walletClient.writeContract({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: 'refund',
        args: [claimHash],
        chain: null,
      })

      const rpcUrl = 'https://rpc.testnet.arc.network'
      const publicClient = createPublicClient({
        chain: arcTestnet,
        transport: http(rpcUrl)
      })

      // Wait for refund transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash: refundHash })

      // Update DB to mark as expired/refunded
      await supabase.from('pending_claims').update({ status: 'expired' }).eq('id', claim.id)
      setPendingClaims(prev => prev.filter(c => c.id !== claim.id))
      alert("Refund successful!")
    } catch (e: any) {
      console.error(e)
      alert(e.message || "Failed to refund")
    }
  }

  const animateBalance = (target: number) => {
    const duration = 1200
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayBalance(Math.round(eased * target * 100) / 100)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
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

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentTxs = displayTxs.filter(tx => new Date(tx.created_at) >= sevenDaysAgo)

  const displayLinks = links.map(link => {
    const isExpired = link.expiry && new Date(link.expiry) < new Date()
    return { ...link, status: isExpired ? 'expired' : link.status }
  })
  const balance = displayBalance || (dataLoaded ? 0 : 0)

  const favMap = new Map<string, any>()
  displayTxs.filter(tx => tx.type === 'sent').forEach(tx => {
    if (!favMap.has(tx.name)) {
      favMap.set(tx.name, {
        name: tx.name,
        initials: tx.initials,
        color: tx.color,
        tc: tx.tc,
        count: 1,
        lastSent: new Date(tx.created_at).getTime(),
        online: Math.random() > 0.7 // fake online status for UI polish
      })
    } else {
      const existing = favMap.get(tx.name)
      existing.count += 1
      existing.lastSent = Math.max(existing.lastSent, new Date(tx.created_at).getTime())
    }
  })
  const favourites = Array.from(favMap.values())
    .sort((a, b) => b.count - a.count || b.lastSent - a.lastSent)
    .slice(0, 5)

  const notifications = [
    ...transactions.filter(tx => tx.recipient_id === userId).map(tx => ({
      id: tx.id,
      icon: 'ph:arrow-down-bold',
      color: 'var(--g1)',
      bg: 'var(--g-soft)',
      title: `Received $${(tx.amount || 0).toFixed(2)} USDC`,
      body: tx.note || 'Payment received',
      time: tx.created_at,
    })),
    ...links.filter(l => l.paid_count > 0).map(l => ({
      id: `link-${l.id}`,
      icon: 'ph:link-bold',
      color: '#818CF8',
      bg: 'rgba(99,102,241,.15)',
      title: `Link paid ×${l.paid_count}`,
      body: l.note || 'Payment link',
      time: l.updated_at || l.created_at,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10)

  const unreadCount = notifications.filter(n => !seenIds.has(n.id)).length

  const openNotifs = () => {
    setNotifOpen(o => !o)
    setSeenIds(new Set(notifications.map(n => n.id)))
  }

  const now = new Date()
  const monthTxs = transactions.filter(tx => {
    const d = new Date(tx.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthReceived = monthTxs.filter(tx => tx.recipient_id === userId).reduce((a, tx) => a + (tx.amount || 0), 0)
  const monthSent = monthTxs.filter(tx => tx.recipient_id !== userId).reduce((a, tx) => a + (tx.amount || 0), 0)

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
            { label: 'Dashboard', icon: 'ph:squares-four-bold', href: '/dashboard', active: true },
            { label: 'Send money', icon: 'ph:paper-plane-right-bold', href: '/send', id: 'tour-dash-send' },
            { label: 'Create link', icon: 'ph:link-bold', href: '/create', id: 'tour-dash-createlink' },
            { label: 'Faucet', icon: 'ph:drop-bold', href: 'https://faucet.circle.com', external: true, id: 'tour-dash-faucet' },
          ].map(item => {
            const style = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: (item as any).active ? 700 : 500, color: (item as any).active ? 'var(--g1)' : 'var(--ink3)', background: (item as any).active ? 'var(--g-soft)' : 'transparent', textDecoration: 'none', marginBottom: 2 } as React.CSSProperties
            return (item as any).external ? (
              <a key={item.label} id={item.id} href={item.href} target="_blank" rel="noopener noreferrer" style={style}>
                <Icon icon={item.icon} style={{ fontSize: 16 }} />{item.label}
              </a>
            ) : (
              <Link key={item.label} id={item.id} href={item.href} style={style}>
                <Icon icon={item.icon} style={{ fontSize: 16 }} />{item.label}
              </Link>
            )
          })}

          <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink4)', letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 12px', margin: '16px 0 6px' }}>Account</div>
          {[
            { label: 'Transaction history', icon: 'ph:clock-countdown-bold', href: '/dashboard/transactions', id: 'tour-dash-history' },
            { label: 'My links', icon: 'ph:link-simple-bold', href: '/dashboard/links', id: 'tour-dash-links' },
            { label: 'Bank settings', icon: 'ph:bank-bold', href: '/bank-setup' },
            { label: 'Settings', icon: 'ph:gear-six-bold', href: '#' },
            { label: 'Zapay support', icon: 'ph:question-bold', action: () => window.dispatchEvent(new CustomEvent('open-chat')) },
          ].map(item => item.href ? (
            <Link key={item.label} id={item.id} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: 'var(--ink3)', textDecoration: 'none', marginBottom: 2 }}>
              <Icon icon={item.icon} style={{ fontSize: 16 }} />{item.label}
            </Link>
          ) : (
            <button key={item.label} onClick={item.action} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: 'var(--ink3)', textDecoration: 'none', marginBottom: 2, width: '100%', fontFamily: 'var(--font)' }}>
              <Icon icon={item.icon} style={{ fontSize: 16 }} />{item.label}
            </button>
          ))}
        </nav>

      </aside>

      {/* Main content */}
      <div className="desktop-main" style={{ flex: 1, marginLeft: sidebarOpen ? 240 : 0, minWidth: 0, transition: 'margin-left .2s ease' }}>

        {/* Mobile nav — replaces fixed mobile-topbar; hidden on desktop */}
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
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>Good morning, {displayName} <Icon icon="ph:hand-waving-bold" style={{ color: 'var(--g3)' }} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setTopUpOpen(true)} title="Top up" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 17, color: 'var(--ink3)' }}><Icon icon="ph:plus-bold" /></button>
            <div style={{ position: 'relative' }}>
              <button onClick={openNotifs} style={{ width: 36, height: 36, borderRadius: '50%', background: notifOpen ? 'var(--g-soft)' : 'var(--white)', border: `1px solid ${notifOpen ? 'var(--border-g)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: notifOpen ? 'var(--g1)' : 'var(--ink3)', cursor: 'pointer', transition: 'all .15s' }}>
                <Icon icon="ph:bell-bold" />
              </button>
              {unreadCount > 0 && (
                <div style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: '50%', background: '#E53935', border: '2px solid var(--page)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', pointerEvents: 'none' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
              {notifOpen && (
                <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 44, right: 0, width: 320, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: '0 12px 40px rgba(0,0,0,.5)', zIndex: 300, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Notifications</div>
                    <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 16, lineHeight: 1 }}>×</button>
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
                        <Icon icon="ph:bell-slash-bold" style={{ fontSize: 28, display: 'block', margin: '0 auto 10px' }} />
                        No notifications yet
                      </div>
                    ) : notifications.map((n, i) => (
                      <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 18px', borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none', background: seenIds.has(n.id) ? 'transparent' : 'rgba(37,92,180,.04)' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: n.bg, color: n.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                          <Icon icon={n.icon} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--ink3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.body}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 3 }}>{timeAgo(n.time)}</div>
                        </div>
                        {!seenIds.has(n.id) && (
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--g1)', flexShrink: 0, marginTop: 6 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, color: 'var(--ink3)', flexShrink: 0, transition: 'all .15s' }}>
              <Icon icon={theme === 'dark' ? 'ph:sun-bold' : 'ph:moon-bold'} />
            </button>
            <button onClick={logout} style={{ padding: '7px 16px', borderRadius: 100, border: '1px solid var(--border)', color: 'var(--ink3)', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'transparent', fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}>Log out</button>
          </div>
        </div>

        <div style={{ padding: '24px 20px 80px' }} className="dash-content">

          {/* Balance card */}
          <div style={{ background: 'var(--g1)', borderRadius: 24, padding: '24px 24px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(37,92,180,.2)', filter: 'blur(60px)', top: -100, right: -60, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.55)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                    Available balance
                    {!localCurrency.loading && localCurrency.code !== 'USD' && (
                      <button onClick={() => setShowLocal(v => !v)} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 10, cursor: 'pointer', transition: 'all .2s' }}>
                        ⇄ {showLocal ? 'USD' : localCurrency.code}
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 52, fontWeight: 700, color: '#fff', letterSpacing: '-.06em', lineHeight: 1 }}>
                    <span style={{ fontSize: '0.42em', fontWeight: 500, verticalAlign: 'super', color: 'rgba(255,255,255,.7)' }}>
                      {showLocal ? localCurrency.symbol : '$'}
                    </span>
                    {showLocal
                      ? (displayBalance * localCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })
                      : displayBalance.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 5 }}>
                    {localCurrency.loading ? (
                      <span>Detecting your currency…</span>
                    ) : localCurrency.code === 'USD' ? (
                      <span>Arc Network · USDC</span>
                    ) : (
                      <span>≈ <strong style={{ color: 'rgba(255,255,255,.75)' }}>
                        {showLocal
                          ? `$${displayBalance.toFixed(2)} USD`
                          : `${localCurrency.symbol}${(displayBalance * localCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${localCurrency.code}`}
                      </strong></span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{email || phone}</div>
                  {walletAddress && (
                    <div onClick={() => { navigator.clipboard.writeText(walletAddress); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                      title="Click to copy"
                      style={{ fontSize: 10, color: copied ? 'var(--g3)' : 'rgba(255,255,255,.4)', marginTop: 4, fontFamily: 'monospace', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'color .2s' }}>
                      {walletAddress.slice(0,8)}...{walletAddress.slice(-4)}
                      <Icon icon={copied ? 'ph:check-bold' : 'ph:copy-bold'} style={{ fontSize: 10 }} />
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[['● Arc Network · Live', true], ['USDC', false], ['$0 gas fee', false]].map(([label, live], i) => (
                  <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, color: live ? 'var(--g3)' : 'rgba(255,255,255,.6)', background: live ? 'rgba(37,92,180,.12)' : 'rgba(255,255,255,.1)', padding: '4px 12px', borderRadius: 20, border: `0.5px solid ${live ? 'rgba(37,92,180,.3)' : 'rgba(255,255,255,.15)'}` }}>
                    {label as string}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="quick-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Send', icon: 'ph:paper-plane-right-bold', bg: 'var(--g1)', color: '#fff', href: '/send' },
              { label: 'Create link', icon: 'ph:link-bold', bg: 'var(--g-soft)', color: 'var(--g1)', href: '/create' },
              { label: 'Top up', icon: 'ph:arrow-down-bold', bg: 'rgba(99,102,241,.18)', color: '#818CF8', action: () => setTopUpOpen(true) },
              { label: 'Withdraw', icon: 'ph:arrow-up-bold', bg: 'rgba(245,158,11,.15)', color: '#FDB64E', action: () => {} },
            ].map(item => (
              <div key={item.label}
                onClick={item.href ? () => router.push(item.href!) : item.action}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'var(--white)', borderRadius: 18, border: '1px solid var(--border)', padding: '16px 10px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.35)', transition: 'all .2s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><Icon icon={item.icon} /></div>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink2)' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div className="desktop-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
            <div>

              {/* Favourites */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Favourites</div>
                <span style={{ fontSize: 13, color: 'var(--g1)', fontWeight: 500, cursor: 'pointer' }}>Manage</span>
              </div>
              <div style={{ ...cardStyle, marginBottom: 20 }}>
                {favourites.length === 0 ? (
                  <div style={{ padding: '20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--page)', border: '1.5px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--ink4)', cursor: 'pointer', flexShrink: 0 }} onClick={() => router.push('/send')}>+</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)', marginBottom: 2 }}>No favourites yet</div>
                      <div style={{ fontSize: 12, color: 'var(--ink4)' }}>Send money to someone and they'll appear here for quick access.</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 12, padding: '16px 18px', overflowX: 'auto' }}>
                    {favourites.map((fav: any) => (
                      <div key={fav.name} onClick={() => router.push('/send')}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer', flexShrink: 0, width: 60 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: fav.color, color: fav.tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, border: '2px solid var(--border)', position: 'relative' }}>
                          {fav.initials}
                          {fav.online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: 'var(--g3)', border: '2px solid var(--white)' }} />}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink3)', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fav.name.split(' ')[0]}</div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flexShrink: 0, width: 60 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--page)', border: '1.5px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--ink4)', cursor: 'pointer' }}>+</div>
                      <div style={{ fontSize: 10, color: 'var(--ink4)' }}>Add</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Transactions */}
              <div id="recent-transactions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Recent transactions (Last 7 Days)</div>
                <span style={{ fontSize: 13, color: 'var(--g1)', fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push('/dashboard/transactions')}>View all</span>
              </div>
              <div style={{ ...cardStyle, marginBottom: 20 }}>
                {recentTxs.map((tx: any, i: number) => (
                  <div key={tx.id} onClick={() => setSelectedTx(tx)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: i < recentTxs.length-1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--page)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: tx.color, color: tx.tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{tx.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink4)', display: 'flex', gap: 4 }}>
                        <span>{tx.type === 'sent' ? 'Sent' : 'Received'}</span>
                        <span>·</span>
                        <span>{tx.note}</span>
                        <span>·</span>
                        <span>{timeAgo(tx.created_at)}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: tx.type === 'sent' ? 'var(--ink)' : 'var(--g1)', marginBottom: 2 }}>
                        {tx.type === 'sent' ? '−' : '+'}${tx.amount.toFixed(2)}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20, background: tx.status === 'confirmed' ? 'var(--g-soft)' : 'rgba(245,158,11,.15)', color: tx.status === 'confirmed' ? 'var(--g1)' : '#FDB64E' }}>
                        {tx.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
                {recentTxs.length === 0 && (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ink3)', fontSize: 14 }}>
                    No recent transactions in the last 7 days. <span onClick={() => router.push('/dashboard/transactions')} style={{ color: 'var(--g1)', fontWeight: 500, cursor: 'pointer' }}>View all-time history →</span>
                  </div>
                )}
              </div>

              {/* Escrow Claims */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Pending Escrow Claims</div>
              </div>
              <div style={{ ...cardStyle, marginBottom: 20 }}>
                {pendingClaims.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ink3)', fontSize: 14 }}>
                    No pending escrow claims. <Link href="/send" style={{ color: 'var(--g1)', fontWeight: 500 }}>Send to an email →</Link>
                  </div>
                ) : (
                  pendingClaims.map((claim: any, i: number) => {
                    const isExpired = new Date(claim.expires_at) < new Date()
                    return (
                      <div key={claim.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: i < pendingClaims.length-1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--g-soft)', color: 'var(--g1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}><Icon icon="ph:lock-key-bold" /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>To: {claim.recipient_email}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink4)' }}>
                            ${claim.amount} · {isExpired ? 'Expired' : `Expires ${new Date(claim.expires_at).toLocaleDateString()}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {isExpired ? (
                            <button onClick={() => handleRefund(claim)} style={{ padding: '6px 12px', background: 'var(--g1)', color: '#fff', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>Refund</button>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20, background: 'rgba(245,158,11,.15)', color: '#FDB64E' }}>Pending</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Payment Links Quick Access Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(37,92,180,0.08) 100%)',
                borderRadius: 20,
                border: '1px solid var(--border)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              className="links-banner-widget"
              onClick={() => router.push('/dashboard/links')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'var(--g-soft)',
                    color: 'var(--g1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}>
                    <Icon icon="ph:link-simple-bold" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>Payment Links Manager</div>
                    <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                      You have {links.filter(l => !l.expiry || new Date(l.expiry) >= new Date()).length} active links. Share and collect payments.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--g1)', fontSize: 13, fontWeight: 700 }}>
                  Manage <Icon icon="ph:arrow-right-bold" />
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="desktop-right-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 70 }}>

              {/* Wallet */}
              <div style={{ ...cardStyle, padding: '18px 18px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>Your wallet</div>
                {[
                  { key: 'USDC balance', val: `$${displayBalance.toFixed(2)}`, green: true },
                  { key: `Local value (${localCurrency.code})`, val: localCurrency.loading ? '…' : localCurrency.code === 'USD' ? '—' : `${localCurrency.symbol}${(displayBalance * localCurrency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                  { key: 'Gas paid', val: '$0.00', green: true },
                  { key: 'Network', val: 'Arc · USDC' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{row.key}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: row.green ? 'var(--g1)' : 'var(--ink)' }}>{row.val}</span>
                  </div>
                ))}
                <button onClick={() => setTopUpOpen(true)}
                  style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '12px', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 14, boxShadow: '0 4px 14px rgba(37,92,180,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon icon="ph:arrow-down-bold" /> Top up wallet
                </button>
              </div>

              {/* Stats */}
              <div style={{ ...cardStyle, padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>This month</div>
                  <span style={{ fontSize: 11, color: 'var(--ink4)' }}>{now.toLocaleString('default', { month: 'long' })} {now.getFullYear()}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Received', val: `$${monthReceived.toFixed(2)}`, green: true, change: monthReceived > 0 ? `+$${monthReceived.toFixed(0)}` : '$0', up: true },
                    { label: 'Sent', val: `$${monthSent.toFixed(2)}`, green: false, change: monthSent > 0 ? `-$${monthSent.toFixed(0)}` : '$0', up: false },
                    { label: 'Payments', val: `${monthTxs.length}`, green: false, change: `${monthTxs.length} total`, up: monthTxs.length > 0 },
                    { label: 'Gas saved', val: '$0', green: true, change: 'vs chains', up: true },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'var(--page)', borderRadius: 12, padding: '12px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--ink4)', marginBottom: 4, fontWeight: 500 }}>{stat.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: stat.green ? 'var(--g1)' : 'var(--ink)', letterSpacing: '-.02em' }}>{stat.val}</div>
                      <div style={{ fontSize: 10, color: stat.up ? 'var(--g1)' : '#E53935', marginTop: 2 }}>{stat.up ? '↑' : '↓'} {stat.change}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arc status */}
              <div style={{ ...cardStyle, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Arc Network</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, color: 'var(--g1)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g3)' }} />Live
                  </div>
                </div>
                {[
                  { key: 'Settlement', val: '<1 second', green: true },
                  { key: 'Gas fee', val: '$0.00', green: true },
                  { key: 'Network', val: 'Testnet' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0' }}>
                    <span style={{ color: 'var(--ink4)' }}>{row.key}</span>
                    <span style={{ color: row.green ? 'var(--g1)' : 'var(--ink2)', fontWeight: 500 }}>{row.val}</span>
                  </div>
                ))}
                <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', fontSize: 11, color: 'var(--g1)', marginTop: 8, textDecoration: 'none', fontWeight: 500 }}>
                  View explorer ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top up modal */}
      {topUpOpen && (
        <div onClick={() => setTopUpOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.6)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Top up wallet</div>
              <button onClick={() => setTopUpOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--ink3)' }}>×</button>
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 20, lineHeight: 1.6 }}>Add USDC to your ZaPay wallet. Send to anyone instantly with $0 gas.</div>
            {topUpMethod !== 3 && (
              <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {['$50', '$100', '$250', '$500'].map(amt => (
                    <div key={amt} style={{ padding: '7px 14px', borderRadius: 100, border: '1.5px solid var(--border)', background: 'var(--page)', fontSize: 13, fontWeight: 500, color: 'var(--ink3)', cursor: 'pointer' }}>{amt}</div>
                  ))}
                </div>
                <input type="text" defaultValue="100" style={{ width: '100%', background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 18px', fontFamily: 'var(--font)', fontSize: 15, color: 'var(--ink)', outline: 'none', marginBottom: 16 }} placeholder="Custom amount" />
              </>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { id: 0, icon: 'ph:credit-card-bold', label: 'Debit or credit card', desc: 'Visa, Mastercard — global · ~1.5%' },
                { id: 1, icon: 'ph:bank-bold', label: 'Bank transfer', desc: 'GTBank, Access, Zenith · ~0.5%' },
                { id: 2, icon: 'ph:device-mobile-bold', label: 'Mobile money', desc: 'MTN MoMo, Opay · ~0.5%' },
                { id: 3, icon: 'ph:currency-circle-dollar-bold', label: 'Crypto wallet', desc: 'USDC on Arc Testnet · $0 fee' },
              ].map((m) => (
                <div key={m.id} onClick={() => setTopUpMethod(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${topUpMethod === m.id ? 'var(--g1)' : 'var(--border)'}`, background: topUpMethod === m.id ? 'var(--g-soft)' : 'var(--page)', cursor: 'pointer' }}>
                  <Icon icon={m.icon} style={{ fontSize: 20 }} />
                  <div><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{m.label}</div><div style={{ fontSize: 11, color: 'var(--ink3)' }}>{m.desc}</div></div>
                </div>
              ))}
            </div>
            
            {topUpMethod === 3 ? (
              <div style={{ background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 12 }}>Send only Testnet USDC to this address on the Arc Network.</div>
                <div style={{ background: 'var(--page)', border: '1.5px dashed var(--border)', borderRadius: 12, padding: '16px', wordBreak: 'break-all', fontSize: 14, fontFamily: 'monospace', color: 'var(--ink)', marginBottom: 16 }}>
                  {walletAddress || 'Loading...'}
                </div>
                <button onClick={() => {
                  if (walletAddress) {
                    navigator.clipboard.writeText(walletAddress);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }} style={{ width: '100%', background: copied ? 'var(--g-soft)' : 'var(--page)', color: copied ? 'var(--g1)' : 'var(--ink)', border: '1.5px solid var(--border)', borderRadius: 100, padding: '12px', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
                  <Icon icon={copied ? 'ph:check-bold' : 'ph:copy-bold'} style={{ fontSize: 16 }} />
                  {copied ? 'Copied' : 'Copy address'}
                </button>
              </div>
            ) : (
              <button onClick={() => alert('Fiat top up via Yellow Card coming soon!')} style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '15px', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(37,92,180,.28)' }}>
                <Icon icon="ph:arrow-down-bold" /> Top up $100
              </button>
            )}
          </div>
        </div>
      )}

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

            {/* Transaction Lifecycle Stepper */}
            {selectedTx.tx_hash && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, padding: '12px 14px', background: 'var(--page)', border: '1px solid var(--border)', borderRadius: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>
                  On-Chain Status
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Step 1 */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--g-soft)', border: '1px solid var(--g3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--g1)', fontSize: 9, fontWeight: 700 }}>
                        ✓
                      </div>
                      <div style={{ width: 1.5, height: 12, background: 'var(--border-g)', marginTop: 2 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>Payment Sent</div>
                      <div style={{ fontSize: 10, color: 'var(--ink4)' }}>Transmitted to Arc Network</div>
                    </div>
                  </div>
                  
                  {/* Step 2 */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--g-soft)', border: '1px solid var(--g3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--g1)', fontSize: 9, fontWeight: 700 }}>
                        ✓
                      </div>
                      <div style={{ width: 1.5, height: 12, background: 'var(--border)', marginTop: 2 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>On-Chain Confirmed</div>
                      <div style={{ fontSize: 10, color: 'var(--ink4)' }}>Mined & settled in block (RPC verified)</div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(245,158,11,.1)', border: '1.5px dashed #FDB64E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FDB64E', fontSize: 10, fontWeight: 700 }}>
                      ⏳
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>Explorer Syncing</div>
                      <div style={{ fontSize: 10, color: 'var(--ink4)' }}>indexer catching up (~few mins)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href={`https://testnet.arcscan.app/tx/${selectedTx.tx_hash}`} target="_blank" rel="noopener noreferrer" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--g1)', color: '#fff', borderRadius: 100, padding: '14px', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 14px rgba(37,92,180,.25)', transition: 'all .2s' }}>
                  <Icon icon="ph:magnifying-glass-bold" /> View on ArcScan Explorer ↗
                </a>
                <div style={{ display: 'flex', gap: 8, background: 'rgba(245,158,11,.05)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 12, padding: '10px 12px' }}>
                  <Icon icon="ph:info-bold" style={{ fontSize: 16, color: '#FDB64E', flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 11, color: '#B27612', lineHeight: 1.4, textAlign: 'left' }}>
                    <strong>Explorer lag note:</strong> The blockchain confirmed this transaction instantly, but the Arc Testnet block explorer website operates a lagging database indexer and may take several minutes to reflect the amount and time details.
                  </div>
                </div>
              </div>
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
        /* Mobile nav wrapper — only shown on mobile */
        .dash-mobile-nav-wrapper { display: none; }
        @media(max-width:768px){
          .dash-mobile-nav-wrapper { display: block; }
          .desktop-sidebar{display:none!important}
          .desktop-main{margin-left:0!important}
          .desktop-topbar{display:none!important}
          .desktop-right-sidebar{display:none!important}
          .desktop-grid{grid-template-columns:1fr!important}
          .quick-actions{grid-template-columns:repeat(2,1fr)!important}
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

      <MobileBottomNav activeTab={mobileTab} onTabChange={tab => setMobileTab(tab as any)} />
      <OnboardingTour />
    </div>
  )
}
