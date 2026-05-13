'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createPublicClient, http } from 'viem'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { formatUSD, timeAgo, getExpiryLabel } from '@/lib/utils'

const arcTestnet = {
  id: 1038,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] }, public: { http: ['https://rpc.testnet.arc.network'] } },
} as const

const usdcAddress = '0x3600000000000000000000000000000000000000' as `0x${string}`
const usdcAbi = [
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
] as const

export default function DashboardPage() {
  const { authenticated, ready, logout } = usePrivy()
  const { profile, walletAddress, email, phone, displayName, userId } = useUser()
  const router = useRouter()
  const [links, setLinks] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [displayBalance, setDisplayBalance] = useState(0)
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD')
  const [topUpMethod, setTopUpMethod] = useState(0)
  const [copied, setCopied] = useState(false)
  const [mobileTab, setMobileTab] = useState<'home' | 'links' | 'send' | 'activity'>('home')

  useEffect(() => {
    if (ready && !authenticated) router.push('/login')
  }, [ready, authenticated])

  useEffect(() => {
    if (authenticated && userId) loadRealData()
  }, [authenticated, userId])

  const loadRealData = async () => {
    try {
      const [linksData, txData] = await Promise.all([
        supabase.from('payment_links').select('*').eq('owner_id', userId).order('created_at', { ascending: false }).limit(10),
        supabase.from('transactions').select('*').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at', { ascending: false }).limit(10),
      ])
      if (linksData.data?.length) setLinks(linksData.data)
      if (txData.data?.length) setTransactions(txData.data)
    } catch (err) {
      console.error('Dashboard data error:', err)
    } finally {
      setDataLoaded(true)
    }
  }

  // Fetch live USDC balance from Arc chain
  useEffect(() => {
    if (!walletAddress) return
    const fetchBalance = async () => {
      try {
        const client = createPublicClient({ chain: arcTestnet, transport: http('https://rpc.testnet.arc.network') })
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
    fetchBalance()
    const interval = setInterval(fetchBalance, 15000) // refresh every 15s
    return () => clearInterval(interval)
  }, [walletAddress])

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
    name: tx.sender_email || tx.recipient_wallet?.slice(0,8) || 'Unknown',
    initials: (tx.sender_email || 'UK').slice(0,2).toUpperCase(),
    color: tx.recipient_id === userId ? 'rgba(30,107,50,.1)' : 'rgba(220,50,50,.1)',
    tc: tx.recipient_id === userId ? 'var(--g1)' : '#CC2020',
  }))

  const displayLinks = links
  const balance = displayBalance || (dataLoaded ? 0 : 0)

  const favourites = [
    { name: 'James K.', initials: 'JK', color: 'rgba(30,107,50,.1)', tc: 'var(--g1)', online: true },
    { name: 'Amara M.', initials: 'AM', color: 'rgba(255,180,0,.1)', tc: '#CC8800', online: false },
    { name: 'Tolu L.', initials: 'TL', color: 'rgba(100,130,255,.1)', tc: '#6080FF', online: false },
    { name: 'Rita C.', initials: 'RC', color: 'rgba(220,50,50,.1)', tc: '#CC2020', online: true },
    { name: 'Sam K.', initials: 'SK', color: 'rgba(0,150,200,.1)', tc: '#0096C8', online: false },
  ]

  if (!authenticated) return null

  const cardStyle = { background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page)', fontFamily: 'var(--font)' }}>

      {/* Sidebar */}
      <aside className="desktop-sidebar" style={{ width: 240, flexShrink: 0, background: '#fff', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: 'auto' }}>
        <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', textDecoration: 'none', display: 'block' }}>
            pay<span style={{ color: 'var(--g1)' }}>link</span>
          </Link>
          <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 3 }}>Your global wallet</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink4)', letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 6 }}>Main</div>
          {[
            { label: 'Dashboard', icon: '⊞', href: '/dashboard', active: true },
            { label: 'Send money', icon: '→', href: '/send' },
            { label: 'Create link', icon: '🔗', href: '/create' },
            { label: 'Pay a link', icon: '💳', href: '/' },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: item.active ? 700 : 500, color: item.active ? 'var(--g1)' : 'var(--ink3)', background: item.active ? 'var(--g-soft)' : 'transparent', textDecoration: 'none', marginBottom: 2 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </Link>
          ))}

          <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink4)', letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 12px', margin: '16px 0 6px' }}>Account</div>
          {[
            { label: 'Transaction history', icon: '🕐', href: '#' },
            { label: 'My links', icon: '🔗', href: '#' },
            { label: 'Bank settings', icon: '🏦', href: '/bank-setup' },
            { label: 'Settings', icon: '⚙️', href: '#' },
            { label: 'Help & support', icon: '❓', href: '#' },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: 'var(--ink3)', textDecoration: 'none', marginBottom: 2 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--g-soft)', border: '1.5px solid var(--border-g)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--g1)', flexShrink: 0 }}>
              {displayName.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 1 }}>{displayName}</div>
              <div style={{ fontSize: 11, color: 'var(--ink4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email || phone || 'paylink user'}</div>
            </div>
            <button onClick={logout} title="Log out" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--ink4)', padding: 4 }}>↗</button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="desktop-main" style={{ flex: 1, marginLeft: 240, minWidth: 0 }}>

        {/* Top bar */}
        <div className="desktop-topbar" style={{ position: 'sticky', top: 0, zIndex: 40, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(250,251,250,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Good morning, {displayName} 👋</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setTopUpOpen(true)} title="Top up" style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 17, color: 'var(--ink3)' }}>+</button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: 'var(--ink3)' }}>🔔</div>
          </div>
        </div>

        <div style={{ padding: '24px 20px 60px' }} className="dash-content">

          {/* Balance card */}
          <div style={{ background: 'var(--g1)', borderRadius: 24, padding: '24px 24px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(141,198,63,.2)', filter: 'blur(60px)', top: -100, right: -60, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.55)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                    Available balance
                    <button onClick={() => setCurrency(c => c === 'USD' ? 'NGN' : 'USD')} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 10, cursor: 'pointer', transition: 'all .2s' }}>
                      ⇄ {currency === 'USD' ? 'NGN' : 'USD'}
                    </button>
                  </div>
                  <div style={{ fontSize: 52, fontWeight: 700, color: '#fff', letterSpacing: '-.06em', lineHeight: 1 }}>
                    <span style={{ fontSize: '0.42em', fontWeight: 500, verticalAlign: 'super', color: 'rgba(255,255,255,.7)' }}>
                      {currency === 'USD' ? '$' : '₦'}
                    </span>
                    {currency === 'USD' ? displayBalance.toFixed(2) : (displayBalance * 1650).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 5 }}>
                    ≈ <strong style={{ color: 'rgba(255,255,255,.75)' }}>
                      {currency === 'USD' ? `₦${(displayBalance * 1650).toLocaleString()} NGN` : `$${displayBalance.toFixed(2)} USD`}
                    </strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{email || phone}</div>
                  {walletAddress && <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 4, fontFamily: 'monospace' }}>{walletAddress.slice(0,8)}...{walletAddress.slice(-4)}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[['● Arc Network · Live', true], ['USDC', false], ['$0 gas fee', false]].map(([label, live], i) => (
                  <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, color: live ? 'var(--g3)' : 'rgba(255,255,255,.6)', background: live ? 'rgba(141,198,63,.12)' : 'rgba(255,255,255,.1)', padding: '4px 12px', borderRadius: 20, border: `0.5px solid ${live ? 'rgba(141,198,63,.25)' : 'rgba(255,255,255,.15)'}` }}>
                    {label as string}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="quick-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Send', icon: '→', bg: 'var(--g1)', color: '#fff', href: '/send' },
              { label: 'Create link', icon: '🔗', bg: 'var(--g-soft)', color: 'var(--g1)', href: '/create' },
              { label: 'Top up', icon: '↓', bg: '#EEF2FF', color: '#4F46E5', action: () => setTopUpOpen(true) },
              { label: 'Withdraw', icon: '↑', bg: '#FFF8E8', color: '#B8880A', action: () => {} },
            ].map(item => (
              <div key={item.label}
                onClick={item.href ? () => router.push(item.href!) : item.action}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 18, border: '1px solid var(--border)', padding: '16px 10px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.05)', transition: 'all .2s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{item.icon}</div>
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
                <div style={{ display: 'flex', gap: 12, padding: '16px 18px', overflowX: 'auto' }}>
                  {favourites.map(fav => (
                    <div key={fav.name} onClick={() => router.push('/send')}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer', flexShrink: 0, width: 60 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: fav.color, color: fav.tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,.08)', position: 'relative' }}>
                        {fav.initials}
                        {fav.online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: 'var(--g3)', border: '2px solid #fff' }} />}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink3)', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fav.name.split(' ')[0]}</div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flexShrink: 0, width: 60 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--page)', border: '1.5px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--ink4)', cursor: 'pointer' }}>+</div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)' }}>Add</div>
                  </div>
                </div>
              </div>

              {/* Transactions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Recent transactions</div>
                <span style={{ fontSize: 13, color: 'var(--g1)', fontWeight: 500, cursor: 'pointer' }}>View all</span>
              </div>
              <div style={{ ...cardStyle, marginBottom: 20 }}>
                {displayTxs.map((tx: any, i: number) => (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: i < displayTxs.length-1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
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
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20, background: tx.status === 'confirmed' ? 'var(--g-soft)' : '#FFF8E8', color: tx.status === 'confirmed' ? 'var(--g1)' : '#B8880A' }}>
                        {tx.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
                {displayTxs.length === 0 && (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ink3)', fontSize: 14 }}>
                    No transactions yet. <Link href="/send" style={{ color: 'var(--g1)', fontWeight: 500 }}>Send your first payment →</Link>
                  </div>
                )}
              </div>

              {/* My Links */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>My active links</div>
                <Link href="/create" style={{ fontSize: 13, color: 'var(--g1)', fontWeight: 500, textDecoration: 'none' }}>Create new</Link>
              </div>
              <div style={cardStyle}>
                {displayLinks.map((link: any, i: number) => (
                  <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: i < displayLinks.length-1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: link.status === 'expired' ? 'var(--page)' : 'var(--g-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: link.status === 'expired' ? 'var(--ink4)' : 'var(--g1)', flexShrink: 0 }}>🔗</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: link.status === 'expired' ? 'var(--ink3)' : 'var(--ink)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.note || 'Payment link'}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink4)' }}>
                        paylink-1.netlify.app/pay/{link.slug} · {link.expiry ? getExpiryLabel(link.expiry) : 'Never expires'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>${link.amount?.toFixed(2)}</div>
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20, background: link.status === 'active' ? 'var(--g-soft)' : link.status === 'expired' ? 'var(--page)' : '#EEF2FF', color: link.status === 'active' ? 'var(--g1)' : link.status === 'expired' ? 'var(--ink4)' : '#4F46E5' }}>
                        {link.status === 'active' ? 'Active' : link.status === 'expired' ? 'Expired' : `Paid ×${link.paid_count}`}
                      </span>
                    </div>
                  </div>
                ))}
                {displayLinks.length === 0 && (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ink3)', fontSize: 14 }}>
                    No links yet. <Link href="/create" style={{ color: 'var(--g1)', fontWeight: 500 }}>Create your first link →</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="desktop-right-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 70 }}>

              {/* Wallet */}
              <div style={{ ...cardStyle, padding: '18px 18px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>Your wallet</div>
                {[
                  { key: 'USDC balance', val: `$${displayBalance.toFixed(2)}`, green: true },
                  { key: 'Local value', val: `₦${(displayBalance * 1650).toLocaleString()}` },
                  { key: 'Gas paid', val: '$0.00', green: true },
                  { key: 'Network', val: 'Arc · USDC' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{row.key}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: row.green ? 'var(--g1)' : 'var(--ink)' }}>{row.val}</span>
                  </div>
                ))}
                <button onClick={() => setTopUpOpen(true)}
                  style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '12px', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 14, boxShadow: '0 4px 14px rgba(30,107,50,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  ↓ Top up wallet
                </button>
              </div>

              {/* Stats */}
              <div style={{ ...cardStyle, padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>This month</div>
                  <span style={{ fontSize: 11, color: 'var(--ink4)' }}>May 2026</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Received', val: '$950', green: true, change: '+12%', up: true },
                    { label: 'Sent', val: '$870', green: false, change: '-4%', up: false },
                    { label: 'Payments', val: '14', green: false, change: '+3', up: true },
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
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 24px 60px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Top up wallet</div>
              <button onClick={() => setTopUpOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--ink3)' }}>×</button>
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 20, lineHeight: 1.6 }}>Add USDC to your PayLink wallet. Send to anyone instantly with $0 gas.</div>
            {topUpMethod !== 3 && (
              <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {['$50', '$100', '$250', '$500'].map(amt => (
                    <div key={amt} style={{ padding: '7px 14px', borderRadius: 100, border: '1.5px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 500, color: 'var(--ink3)', cursor: 'pointer' }}>{amt}</div>
                  ))}
                </div>
                <input type="text" defaultValue="100" style={{ width: '100%', background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 18px', fontFamily: 'var(--font)', fontSize: 15, color: 'var(--ink)', outline: 'none', marginBottom: 16 }} placeholder="Custom amount" />
              </>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { id: 0, icon: '💳', label: 'Debit or credit card', desc: 'Visa, Mastercard — global · ~1.5%' },
                { id: 1, icon: '🏦', label: 'Bank transfer', desc: 'GTBank, Access, Zenith · ~0.5%' },
                { id: 2, icon: '📱', label: 'Mobile money', desc: 'MTN MoMo, Opay · ~0.5%' },
                { id: 3, icon: '⛓️', label: 'Crypto wallet', desc: 'USDC on Arc Testnet · $0 fee' },
              ].map((m) => (
                <div key={m.id} onClick={() => setTopUpMethod(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${topUpMethod === m.id ? 'var(--g1)' : 'var(--border)'}`, background: topUpMethod === m.id ? 'var(--g-soft)' : '#fff', cursor: 'pointer' }}>
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <div><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{m.label}</div><div style={{ fontSize: 11, color: 'var(--ink3)' }}>{m.desc}</div></div>
                </div>
              ))}
            </div>
            
            {topUpMethod === 3 ? (
              <div style={{ background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 12 }}>Send only Testnet USDC to this address on the Arc Network.</div>
                <div style={{ background: '#fff', border: '1.5px dashed var(--border)', borderRadius: 12, padding: '16px', wordBreak: 'break-all', fontSize: 14, fontFamily: 'monospace', color: 'var(--ink)', marginBottom: 16 }}>
                  {walletAddress || 'Loading...'}
                </div>
                <button onClick={() => {
                  if (walletAddress) {
                    navigator.clipboard.writeText(walletAddress);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }} style={{ width: '100%', background: copied ? 'var(--g-soft)' : '#fff', color: copied ? 'var(--g1)' : 'var(--ink)', border: '1.5px solid var(--border)', borderRadius: 100, padding: '12px', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
                  {copied ? '✓ Copied' : '📄 Copy address'}
                </button>
              </div>
            ) : (
              <button onClick={() => alert('Fiat top up via Yellow Card coming soon!')} style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '15px', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(30,107,50,.2)' }}>
                ↓ Top up $100
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        :root { --g1:#1E6B32;--g2:#155226;--g3:#8DC63F;--g-soft:#EBF5EC;--g-mid:#C8E6CA;--ink:#0D1410;--ink2:#2D3D30;--ink3:#5C6E5E;--ink4:#8A9B8C;--page:#FAFBFA;--white:#FFFFFF;--border:#E8EDE8;--border-g:rgba(30,107,50,0.15);--font:'Google Sans','sans-serif'; }
        @media(max-width:768px){
          .desktop-sidebar{display:none!important}
          .desktop-main{margin-left:0!important}
          .desktop-topbar{display:none!important}
          .desktop-right-sidebar{display:none!important}
          .desktop-grid{grid-template-columns:1fr!important}
          .quick-actions{grid-template-columns:repeat(2,1fr)!important}
          .mobile-topbar{display:flex!important}
          .mobile-bottom-nav{display:flex!important}
          .dash-content{padding-top:72px!important;padding-bottom:90px!important;padding-left:16px!important;padding-right:16px!important}
        }
        @media(min-width:769px){
          .mobile-topbar{display:none!important}
          .mobile-bottom-nav{display:none!important}
        }
      `}</style>

      {/* Mobile top bar */}
      <div className="mobile-topbar" style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:56, background:'#fff', borderBottom:'1px solid var(--border)', alignItems:'center', justifyContent:'space-between', padding:'0 20px' }}>
        <div style={{ fontSize:20, fontWeight:700, color:'var(--ink)', letterSpacing:'-.04em' }}>pay<span style={{color:'var(--g1)'}}>link</span></div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={() => setTopUpOpen(true)} style={{ width:34, height:34, borderRadius:'50%', background:'var(--g-soft)', border:'none', color:'var(--g1)', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--g1)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{displayName.slice(0,2).toUpperCase()}</div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-bottom-nav" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100, background:'#fff', borderTop:'1px solid var(--border)', height:64, alignItems:'center', justifyContent:'space-around', padding:'0 8px' }}>
        {[
          { id:'home', icon:'⊞', label:'Home' },
          { id:'links', icon:'🔗', label:'Links' },
          { id:'send', icon:'→', label:'Send' },
          { id:'activity', icon:'🕐', label:'Activity' },
        ].map(tab => (
          <button key={tab.id} onClick={() => tab.id === 'send' ? router.push('/send') : setMobileTab(tab.id as any)}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', padding:'8px 16px', borderRadius:12, color: mobileTab === tab.id ? 'var(--g1)' : 'var(--ink4)', fontFamily:'var(--font)' }}>
            <span style={{ fontSize:20 }}>{tab.icon}</span>
            <span style={{ fontSize:10, fontWeight:600 }}>{tab.label}</span>
          </button>
        ))}
        <button onClick={() => router.push('/create')}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'var(--g1)', border:'none', cursor:'pointer', padding:'10px 18px', borderRadius:14, color:'#fff', fontFamily:'var(--font)' }}>
          <span style={{ fontSize:18 }}>＋</span>
          <span style={{ fontSize:10, fontWeight:600 }}>Create</span>
        </button>
      </div>
    </div>
  )
}
