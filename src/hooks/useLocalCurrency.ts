'use client'

import { useState, useEffect } from 'react'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',  EUR: '€',  GBP: '£',  NGN: '₦',  GHS: 'GH₵',
  KES: 'KSh', ZAR: 'R', UGX: 'USh', TZS: 'TSh', ETB: 'Br',
  XOF: 'CFA', XAF: 'CFA', MAD: 'MAD', EGP: 'E£', ZMW: 'ZK',
  RWF: 'RF',  MZN: 'MT', BWP: 'P',   SZL: 'L',   MUR: '₨',
  CAD: 'CA$', AUD: 'A$', NZD: 'NZ$', JPY: '¥',   CNY: '¥',
  INR: '₹',  BRL: 'R$', MXN: 'MX$', AED: 'AED', SGD: 'S$',
  CHF: 'CHF', SEK: 'kr', NOK: 'kr',  DKK: 'kr',  PLN: 'zł',
  TRY: '₺',  PKR: '₨',  BDT: '৳',  PHP: '₱',  IDR: 'Rp',
  VND: '₫',  THB: '฿',  MYR: 'RM',  KRW: '₩',   SAR: '﷼',
  QAR: '﷼',  KWD: 'KD', BHD: '.BD', OMR: '﷼',   JOD: 'JD',
}

interface LocalCurrency {
  code: string
  symbol: string
  rate: number         // how many local units = 1 USD
  country: string
  loading: boolean
}

const CACHE_KEY = 'paylink_currency_v1'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export function useLocalCurrency(): LocalCurrency {
  const [state, setState] = useState<LocalCurrency>({
    code: 'USD', symbol: '$', rate: 1, country: '', loading: true,
  })

  useEffect(() => {
    const detect = async () => {
      try {
        // Check session cache first to avoid hammering free APIs
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_TTL_MS) {
            setState({ ...data, loading: false })
            return
          }
        }

        // 1. Detect country + currency from IP (no API key required)
        const geoRes = await fetch('https://ipapi.co/json/', { cache: 'no-store' })
        const geo = await geoRes.json()
        const code: string = geo.currency || 'USD'
        const country: string = geo.country_name || ''

        // 2. Fetch live exchange rate (USD base, no API key required)
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD')
        const rateData = await rateRes.json()
        const rate: number = rateData?.rates?.[code] ?? 1

        const symbol = CURRENCY_SYMBOLS[code] ?? code
        const data = { code, symbol, rate, country }

        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
        setState({ ...data, loading: false })
      } catch (err) {
        console.error('Currency detection failed:', err)
        // Graceful fallback to USD — no crash
        setState(s => ({ ...s, loading: false }))
      }
    }

    detect()
  }, [])

  return state
}
