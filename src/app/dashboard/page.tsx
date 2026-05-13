'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import Link from 'next/link'
import { createPublicClient, http } from 'viem'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { formatUSD, timeAgo, getExpiryLabel } from '@/lib/utils'
import { Icon } from '@iconify/react'

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
    color: tx.recipient_id === userId ? 'rgba(255,107,0,.12)' : 'rgba(220,50,50,.12)',
    tc: tx.recipient_id === userId ? 'var(--g1)' : '#CC2020',
  }))

  const displayLinks = links
  const balance = displayBalance || (dataLoaded ? 0 : 0)
  const favourites: any[] = []

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
      <aside className="desktop-sidebar" style={{ width: 240, flexShrink: 0, background: 'var(--white)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: 'auto' }}>
        <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', textDecoration: 'none', display: 'block' }}>
            pay<span style={{ color: 'var(--g1)' }}>link</span>
          </Link>
          <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 3 }}>Your global wallet</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink4)', letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 6 }}>Main</div>
          {[
            { label: 'Dashboard', icon: 'ph:squares-four-bold', href: '/dashboard', active: true },
            { label: 'Send money', icon: 'ph:paper-plane-right-bold', href: '/send' },
            { label: 'Create link', icon: 'ph:link-bold', href: '/create' },
            { label: 'Pay a link', icon: 'ph:credit-card-bold', href: '/' },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: item.active ? 700 : 500, color: item.active ? 'var(--g1)' : 'var(--ink3)', background: item.active ? 'var(--g-soft)' : 'transparent', textDecoration: 'none', marginBottom: 2 }}>
              <Icon icon={item.icon} style={{ fontSize: 16 }} />{item.label}
            </Link>
          ))}

          <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink4)', letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 12px', margin: '16px 0 6px' }}>Account</div>
          {[
            { label: 'Transaction history', icon: 'ph:clock-countdown-bold', href: '#' },
            { label: 'My links', icon: 'ph:link-simple-bold', href: '#' },
            { label: 'Bank settings', icon: 'ph:bank-bold', href: '/bank-setup' },
            { label: 'Settings', icon: 'ph:gear-six-bold', href: '#' },
            { label: 'Help & support', icon: 'ph:question-bold', href: '#' },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: 'var(--ink3)', textDecoration: 'none', marginBottom: 2 }}>
              <Icon icon={item.icon} style={{ fontSize: 16 }} />{item.label}
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
            <button onClick={logout} style={{ padding: '6px 12px', borderRadius: 100, border: '1px solid var(--border)', color: 'var(--ink3)', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: 'transparent', fontFamily: 'var(--font)', whiteSpace: 'nowrap', flexShrink: 0 }}>Log out</button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="desktop-main" style={{ flex: 1, marginLeft: 240, minWidth: 0 }}>

        {/* Top bar */}
        <div className="desktop-topbar" style={{ position: 'sticky', top: 0, zIndex: 40, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(9,9,14,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>Good morning, {displayName} <Icon icon="ph:hand-waving-bold" style={{ color: 'var(--g3)' }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setTopUpOpen(true)} title="Top up" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 17, color: 'var(--ink3)' }}><Icon icon="ph:plus-bold" /></button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: 'var(--ink3)' }}><Icon icon="ph:bell-bold" /></div>
            <button onClick={logout} style={{ padding: '7px 16px', borderRadius: 100, border: '1px solid var(--border)', color: 'var(--ink3)', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'transparent', fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}>Log out</button>
          </div>
        </div>

        <div style={{ padding: '24px 20px 60px' }} className="dash-content">

          {/* Balance card */}
          <div style={{ background: 'var(--g1)', borderRadius: 24, padding: '24px 24px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,107,0,.2)', filter: 'blur(60px)', top: -100, right: -60, pointerEvents: 'none' }} />
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
                  <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, color: live ? 'var(--g3)' : 'rgba(255,255,255,.6)', background: live ? 'rgba(255,107,0,.12)' : 'rgba(255,255,255,.1)', padding: '4px 12px', borderRadius: 20, border: `0.5px solid ${live ? 'rgba(255,107,0,.3)' : 'rgba(255,255,255,.15)'}` }}>
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
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20, background: tx.status === 'confirmed' ? 'var(--g-soft)' : 'rgba(245,158,11,.15)', color: tx.status === 'confirmed' ? 'var(--g1)' : '#FDB64E' }}>
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
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: link.status === 'expired' ? 'var(--page)' : 'var(--g-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: link.status === 'expired' ? 'var(--ink4)' : 'var(--g1)', flexShrink: 0 }}><Icon icon="ph:link-bold" /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: link.status === 'expired' ? 'var(--ink3)' : 'var(--ink)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.note || 'Payment link'}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink4)' }}>
                        paylink-1.netlify.app/pay/{link.slug} · {link.expiry ? getExpiryLabel(link.expiry) : 'Never expires'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>${link.amount?.toFixed(2)}</div>
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20, background: link.status === 'active' ? 'var(--g-soft)' : link.status === 'expired' ? 'var(--page)' : 'rgba(99,102,241,.18)', color: link.status === 'active' ? 'var(--g1)' : link.status === 'expired' ? 'var(--ink4)' : '#818CF8' }}>
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
                  style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '12px', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 14, boxShadow: '0 4px 14px rgba(255,107,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.6)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Top up wallet</div>
              <button onClick={() => setTopUpOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--ink3)' }}>×</button>
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 20, lineHeight: 1.6 }}>Add USDC to your PayLink wallet. Send to anyone instantly with $0 gas.</div>
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
              <button onClick={() => alert('Fiat top up via Yellow Card coming soon!')} style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '15px', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(255,107,0,.28)' }}>
                <Icon icon="ph:arrow-down-bold" /> Top up $100
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @media(max-width:768px){
          .desktop-sidebar{display:none!important}
          .desktop-main{margin-left:0!important}
          .desktop-topbar{display:none!important}
          .desktop-right-sidebar{display:none!important}
          .desktop-grid{grid-template-columns:1fr!important}
          .quick-actions{grid-template-columns:repeat(2,1fr)!important}
          .mobile-topbar{display:flex!important}
          .dash-content{padding-top:72px!important;padding-bottom:90px!important;padding-left:16px!important;padding-right:16px!important}
        }
        @media(min-width:769px){
          .mobile-topbar{display:none!important}
        }
      `}</style>

      {/* Mobile top bar */}
      <div className="mobile-topbar" style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:56, background:'var(--white)', borderBottom:'1px solid var(--border)', alignItems:'center', justifyContent:'space-between', padding:'0 20px' }}>
        <div style={{ fontSize:20, fontWeight:700, color:'var(--ink)', letterSpacing:'-.04em' }}>pay<span style={{color:'var(--g1)'}}>link</span></div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={() => setTopUpOpen(true)} style={{ width:34, height:34, borderRadius:'50%', background:'var(--g-soft)', border:'none', color:'var(--g1)', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon icon="ph:plus-bold" /></button>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--g1)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{displayName.slice(0,2).toUpperCase()}</div>
          <button onClick={logout} style={{ padding:'6px 14px', borderRadius:100, border:'1px solid var(--border)', color:'var(--ink3)', fontSize:12, fontWeight:500, cursor:'pointer', background:'transparent', fontFamily:'var(--font)', whiteSpace:'nowrap' }}>Log out</button>
        </div>
      </div>

      <MobileBottomNav activeTab={mobileTab} onTabChange={tab => setMobileTab(tab as any)} />
    </div>
  )
}
