'use client'

import { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatUSD, timeAgo, getExpiryLabel, getInitials } from '@/lib/utils'

interface Transaction {
  id: string
  amount: number
  note: string
  status: string
  created_at: string
  sender_wallet: string
  recipient_wallet: string
}

interface PayLink {
  id: string
  slug: string
  amount: number
  note: string
  status: string
  paid_count: number
  expiry: string | null
  created_at: string
}

export default function DashboardPage() {
  const { authenticated, ready, logout, user } = usePrivy()
  const { wallets } = useWallets()
  const router = useRouter()
  const [balance, setBalance] = useState(0)
  const [displayBalance, setDisplayBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [links, setLinks] = useState<PayLink[]>([])
  const [loading, setLoading] = useState(true)
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'home'|'send'|'request'|'account'>('home')

  useEffect(() => {
    if (ready && !authenticated) router.push('/login')
  }, [ready, authenticated])

  useEffect(() => {
    if (authenticated && user) loadDashboardData()
  }, [authenticated, user])

  const loadDashboardData = async () => {
    try {
      setLoading(false)
      const mockBalance = 1080
      setBalance(mockBalance)
      // Count up animation
      let start = 0
      const duration = 1200
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayBalance(Math.floor(eased * mockBalance * 100) / 100)
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const wallet = wallets.find(w => w.walletClientType === 'privy')
  const userEmail = user?.email?.address || user?.phone?.number || 'paylink user'
  const userInitials = userEmail.slice(0, 2).toUpperCase()

  const mockTxs = [
    { id: '1', amount: 500, note: 'Website redesign', status: 'confirmed', created_at: new Date(Date.now() - 3600000).toISOString(), sender_wallet: wallet?.address || '', recipient_wallet: '', type: 'sent', name: 'James K.', initials: 'JK', color: 'rgba(30,107,50,.1)', tc: 'var(--g1)' },
    { id: '2', amount: 150, note: 'Consulting fee', status: 'confirmed', created_at: new Date(Date.now() - 7200000).toISOString(), sender_wallet: '', recipient_wallet: wallet?.address || '', type: 'received', name: 'Amara M.', initials: 'AM', color: 'rgba(255,180,0,.1)', tc: '#CC8800' },
    { id: '3', amount: 800, note: 'April retainer', status: 'confirmed', created_at: new Date(Date.now() - 86400000).toISOString(), sender_wallet: '', recipient_wallet: wallet?.address || '', type: 'received', name: 'Tolu L.', initials: 'TL', color: 'rgba(100,130,255,.1)', tc: '#6080FF' },
    { id: '4', amount: 1000, note: 'Top up via Ramp', status: 'confirmed', created_at: new Date(Date.now() - 172800000).toISOString(), sender_wallet: '', recipient_wallet: wallet?.address || '', type: 'received', name: 'Top up', initials: '↓', color: 'rgba(30,107,50,.1)', tc: 'var(--g1)' },
    { id: '5', amount: 250, note: 'Freelance payment', status: 'confirmed', created_at: new Date(Date.now() - 259200000).toISOString(), sender_wallet: wallet?.address || '', recipient_wallet: '', type: 'sent', name: 'Rita C.', initials: 'RC', color: 'rgba(220,50,50,.1)', tc: '#CC2020' },
  ]

  const mockLinks = [
    { id: '1', slug: 'ox-apr-8f2k', amount: 250, note: 'Logo design — April invoice', status: 'active', paid_count: 0, expiry: new Date(Date.now() + 6*86400000).toISOString(), created_at: new Date().toISOString() },
    { id: '2', slug: 'ret-may-9g3k', amount: 800, note: 'Monthly retainer — May', status: 'active', paid_count: 3, expiry: null, created_at: new Date().toISOString() },
    { id: '3', slug: 'con-q1-2m1x', amount: 150, note: 'Consulting session — Q1', status: 'expired', paid_count: 1, expiry: new Date(Date.now() - 30*86400000).toISOString(), created_at: new Date().toISOString() },
  ]

  const favourites = [
    { name: 'James K.', initials: 'JK', color: 'rgba(30,107,50,.1)', tc: 'var(--g1)', online: true },
    { name: 'Amara M.', initials: 'AM', color: 'rgba(255,180,0,.1)', tc: '#CC8800', online: false },
    { name: 'Tolu L.', initials: 'TL', color: 'rgba(100,130,255,.1)', tc: '#6080FF', online: false },
    { name: 'Rita C.', initials: 'RC', color: 'rgba(220,50,50,.1)', tc: '#CC2020', online: true },
    { name: 'Sam K.', initials: 'SK', color: 'rgba(0,150,200,.1)', tc: '#0096C8', online: false },
  ]

  if (!authenticated) return null

  const sidebar = (
    <aside style={{ width: 240, flexShrink: 0, background: '#fff', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: 'auto' }}>
      <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.04em', textDecoration: 'none', display: 'block' }}>
          pay<span style={{ color: 'var(--g1)' }}>link</span>
        </Link>
        <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 3 }}>Your global wallet</div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {[
          { label: 'Dashboard', icon: '⊞', href: '/dashboard', active: true },
          { label: 'Send money', icon: '→', href: '/send' },
          { label: 'Create link', icon: '🔗', href: '/create' },
          { label: 'Pay a link', icon: '💳', href: '/pay/demo' },
        ].map(item => (
          <Link key={item.label} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12,
            fontSize: 14, fontWeight: item.active ? 700 : 500,
            color: item.active ? 'var(--g1)' : 'var(--ink3)',
            background: item.active ? 'var(--g-soft)' : 'transparent',
            textDecoration: 'none', marginBottom: 2, transition: 'all .15s',
          }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
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
          <Link key={item.label} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12,
            fontSize: 14, fontWeight: 500, color: 'var(--ink3)', textDecoration: 'none', marginBottom: 2,
          }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, cursor: 'pointer' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--g-soft)', border: '1.5px solid var(--border-g)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--g1)', flexShrink: 0 }}>{userInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 1 }}>{userEmail.split('@')[0]}</div>
            <div style={{ fontSize: 11, color: 'var(--ink4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--ink4)' }}>↗</button>
        </div>
      </div>
    </aside>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page)' }}>
      {/* Sidebar */}
      <div style={{ display: 'none' }} className="desktop-sidebar">{sidebar}</div>
      {sidebar}

      {/* Main */}
      <div style={{ flex: 1, marginLeft: 240, minWidth: 0 }}>

        {/* Top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(250,251,250,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Good morning, {userEmail.split('@')[0]} 👋</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setTopUpOpen(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 17, color: 'var(--ink3)' }}>+</button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 17, color: 'var(--ink3)' }}>🔔</div>
          </div>
        </div>

        <div style={{ padding: '28px 32px 60px' }}>

          {/* Balance card */}
          <div style={{ background: 'var(--g1)', borderRadius: 24, padding: '28px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(141,198,63,.2)', filter: 'blur(60px)', top: -100, right: -60 }} />
            <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.06)', filter: 'blur(40px)', bottom: -60, left: 20 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.55)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>Available balance</div>
                  <div style={{ fontSize: 56, fontWeight: 700, color: '#fff', letterSpacing: '-.06em', lineHeight: 1 }}>
                    <span style={{ fontSize: '0.42em', fontWeight: 500, verticalAlign: 'super', color: 'rgba(255,255,255,.7)' }}>$</span>
                    {displayBalance.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', marginTop: 6 }}>
                    ≈ <strong style={{ color: 'rgba(255,255,255,.75)' }}>₦{(displayBalance * 1650).toLocaleString()}</strong> NGN
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{userEmail.split('@')[0]}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>{userEmail}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[['● Arc Network · Live', true], ['USDC', false], ['$0 gas fee', false]].map(([label, live], i) => (
                  <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, color: live ? 'var(--g3)' : 'rgba(255,255,255,.6)', background: live ? 'rgba(141,198,63,.12)' : 'rgba(255,255,255,.1)', padding: '4px 12px', borderRadius: 20, border: `0.5px solid ${live ? 'rgba(141,198,63,.25)' : 'rgba(255,255,255,.15)'}` }}>{label as string}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Send', icon: '→', bg: 'var(--g1)', color: '#fff', href: '/send' },
              { label: 'Request', icon: '🔗', bg: 'var(--g-soft)', color: 'var(--g1)', href: '/create' },
              { label: 'Top up', icon: '↓', bg: '#EEF2FF', color: '#4F46E5', action: () => setTopUpOpen(true) },
              { label: 'Withdraw', icon: '↑', bg: '#FFF8E8', color: '#B8880A', action: () => {} },
            ].map(item => (
              <div key={item.label} onClick={item.href ? () => router.push(item.href!) : item.action}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 20, border: '1px solid var(--border)', padding: '18px 12px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.05)', transition: 'all .2s' }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21 }}>{item.icon}</div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink2)' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
            <div>
              {/* Favourites */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Favourites</div>
                <span style={{ fontSize: 13, color: 'var(--g1)', fontWeight: 500, cursor: 'pointer' }}>Manage</span>
              </div>
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,.05)', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, padding: '18px 20px', overflowX: 'auto' }}>
                  {favourites.map(fav => (
                    <div key={fav.name} onClick={() => router.push('/send')}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer', flexShrink: 0, width: 64 }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: fav.color, color: fav.tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,.08)', position: 'relative' }}>
                        {fav.initials}
                        {fav.online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: 'var(--g3)', border: '2px solid #fff' }} />}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink3)', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fav.name.split(' ')[0]}</div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flexShrink: 0, width: 64 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--page)', border: '1.5px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--ink4)', cursor: 'pointer' }}>+</div>
                    <div style={{ fontSize: 11, color: 'var(--ink4)' }}>Add</div>
                  </div>
                </div>
              </div>

              {/* Transactions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Recent transactions</div>
                <span style={{ fontSize: 13, color: 'var(--g1)', fontWeight: 500, cursor: 'pointer' }}>View all</span>
              </div>
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,.05)', marginBottom: 20 }}>
                {mockTxs.map((tx, i) => (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < mockTxs.length-1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background .15s', opacity: 0, animation: `slideIn .4s ease ${i*0.05}s forwards` }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: (tx as any).color, color: (tx as any).tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{(tx as any).initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(tx as any).name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{(tx as any).type === 'sent' ? 'Sent' : 'Received'}</span>
                        <span>·</span>
                        <span>{tx.note}</span>
                        <span>·</span>
                        <span>{timeAgo(tx.created_at)}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: (tx as any).type === 'sent' ? 'var(--ink)' : 'var(--g1)', marginBottom: 3 }}>
                        {(tx as any).type === 'sent' ? '−' : '+'}${tx.amount.toFixed(2)}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: 'var(--g-soft)', color: 'var(--g1)' }}>Confirmed</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* My links */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>My active links</div>
                <Link href="/create" style={{ fontSize: 13, color: 'var(--g1)', fontWeight: 500, textDecoration: 'none' }}>Create new</Link>
              </div>
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                {mockLinks.map((link, i) => (
                  <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < mockLinks.length-1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: link.status === 'expired' ? 'var(--page)' : 'var(--g-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: link.status === 'expired' ? 'var(--ink4)' : 'var(--g1)', flexShrink: 0 }}>🔗</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: link.status === 'expired' ? 'var(--ink3)' : 'var(--ink)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.note}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink4)' }}>
                        paylink-1.netlify.app/pay/{link.slug} · {link.expiry ? getExpiryLabel(link.expiry) : 'Never expires'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>${link.amount.toFixed(2)}</div>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: link.status === 'active' ? 'var(--g-soft)' : link.status === 'expired' ? 'var(--page)' : '#EEF2FF', color: link.status === 'active' ? 'var(--g1)' : link.status === 'expired' ? 'var(--ink4)' : '#4F46E5' }}>
                        {link.status === 'active' ? 'Active' : link.status === 'expired' ? 'Expired' : `Paid ×${link.paid_count}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>
              {/* Wallet */}
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '20px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>Your wallet</div>
                {[
                  { key: 'USDC balance', val: `$${displayBalance.toFixed(2)}`, green: true },
                  { key: 'Local value', val: `₦${(displayBalance * 1650).toLocaleString()}` },
                  { key: 'Gas paid', val: '$0.00', green: true },
                  { key: 'Network', val: 'Arc · USDC' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{row.key}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: row.green ? 'var(--g1)' : 'var(--ink)' }}>{row.val}</span>
                  </div>
                ))}
                <button onClick={() => setTopUpOpen(true)}
                  style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '14px', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, boxShadow: '0 4px 14px rgba(30,107,50,.2)' }}>
                  ↓ Top up wallet
                </button>
              </div>

              {/* Stats */}
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>This month</div>
                  <span style={{ fontSize: 12, color: 'var(--ink4)' }}>May 2026</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Received', val: '$950', green: true, change: '+12%', up: true },
                    { label: 'Sent', val: '$870', green: false, change: '-4%', up: false },
                    { label: 'Payments', val: '14', green: false, change: '+3', up: true },
                    { label: 'Gas saved', val: '$0', green: true, change: 'vs chains', up: true },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'var(--page)', borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 5, fontWeight: 500 }}>{stat.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: stat.green ? 'var(--g1)' : 'var(--ink)', letterSpacing: '-.03em' }}>{stat.val}</div>
                      <div style={{ fontSize: 11, color: stat.up ? 'var(--g1)' : '#E53935', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                        {stat.up ? '↑' : '↓'} {stat.change}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arc status */}
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Arc Network</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, color: 'var(--g1)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g3)', animation: 'pulse 2s ease-in-out infinite' }} />
                    Live
                  </div>
                </div>
                {[
                  { key: 'Avg settlement', val: '<1 second', green: true },
                  { key: 'Gas fee', val: '$0.00', green: true },
                  { key: 'Network', val: 'Testnet' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0' }}>
                    <span style={{ color: 'var(--ink4)' }}>{row.key}</span>
                    <span style={{ color: row.green ? 'var(--g1)' : 'var(--ink2)', fontWeight: 500 }}>{row.val}</span>
                  </div>
                ))}
                <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', fontSize: 12, color: 'var(--g1)', marginTop: 8, textDecoration: 'none', fontWeight: 500 }}>
                  View explorer ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tabs mobile */}
      <div style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)', padding: '8px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {[{ icon: '⊞', label: 'Home', tab: 'home' as const }, { icon: '→', label: 'Send', tab: 'send' as const }, { icon: '🔗', label: 'Request', tab: 'request' as const }, { icon: '👤', label: 'Account', tab: 'account' as const }].map(item => (
            <div key={item.label} onClick={() => setActiveTab(item.tab)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 16px', cursor: 'pointer' }}>
              <span style={{ fontSize: 22, color: activeTab === item.tab ? 'var(--g1)' : 'var(--ink4)' }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: activeTab === item.tab ? 'var(--g1)' : 'var(--ink4)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top up modal */}
      {topUpOpen && (
        <div onClick={() => setTopUpOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Top up wallet</div>
              <button onClick={() => setTopUpOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--ink3)' }}>×</button>
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 24, lineHeight: 1.6 }}>Add USDC to your PayLink balance. Send to anyone instantly with $0 gas.</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {['$50', '$100', '$250', '$500'].map(amt => (
                <div key={amt} style={{ padding: '8px 16px', borderRadius: 100, border: '1.5px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 500, color: 'var(--ink3)', cursor: 'pointer' }}>{amt}</div>
              ))}
            </div>
            <input type="text" defaultValue="100" style={{ width: '100%', background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 18px', fontFamily: 'var(--font)', fontSize: 15, color: 'var(--ink)', outline: 'none', marginBottom: 16 }} placeholder="Custom amount" />
            <button style={{ width: '100%', background: 'var(--g1)', color: '#fff', border: 'none', borderRadius: 100, padding: '16px', fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(30,107,50,.2)' }}>
              ↓ Top up $100
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        @keyframes popIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
        @media(max-width:768px){
          aside { display: none !important; }
          .main-content { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
