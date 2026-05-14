'use client'

import { useState } from 'react'

export function TestnetBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div style={{
      background: '#255CB4',
      color: '#fff',
      padding: '8px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      fontSize: '13px',
      fontWeight: 500,
      position: 'relative',
      zIndex: 1000,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: '#6a9be4',
        display: 'inline-block',
        animation: 'pulse 2s ease-in-out infinite',
        flexShrink: 0,
      }} />
      ZaPay is live on Arc Testnet — all transactions use test funds.&nbsp;
      <a
        href="https://testnet.arcscan.app"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#FFE0B2', textDecoration: 'underline' }}
      >
        View explorer
      </a>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer', fontSize: 16, marginLeft: 8, lineHeight: 1,
          position: 'absolute', right: 16,
        }}
      >
        ×
      </button>
    </div>
  )
}
