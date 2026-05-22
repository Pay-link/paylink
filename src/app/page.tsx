'use client'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { icon?: string; style?: React.CSSProperties; class?: string };
    }
  }
}

import { useEffect, useRef, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import { OnboardingTour } from '@/components/onboarding/OnboardingTour'

function TrustLogo({ logoUrl, fallbackDomain, name, icon, bg, fg }: { logoUrl: string; fallbackDomain: string; name: string; icon: string; bg: string; fg: string }) {
  const [src, setSrc] = useState(logoUrl)
  const [failed, setFailed] = useState(false)
  const handleError = () => {
    if (src !== `https://logo.clearbit.com/${fallbackDomain}`) {
      setSrc(`https://logo.clearbit.com/${fallbackDomain}`)
    } else {
      setFailed(true)
    }
  }
  if (failed) {
    return (
      <div style={{ width: 28, height: 28, borderRadius: 6, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon icon={icon} style={{ fontSize: '16px', color: fg }} />
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={28} height={28} style={{ objectFit: 'contain', borderRadius: 4, display: 'block' }} onError={handleError} />
  )
}

export default function HomePage() {
  const { authenticated, login, logout } = usePrivy()
  const router = useRouter()
  const [liveStats, setLiveStats] = useState({ links: 0, txs: 0 })
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const didMountRef = useRef(false)

  // Load & apply theme
  useEffect(() => {
    const saved = (localStorage.getItem('zp-theme') as 'dark' | 'light') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('zp-theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  // Close menu on outside tap & scroll lock
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data = await res.json()
          setLiveStats({
            links: data.links ?? 0,
            txs: data.txs ?? 0,
          })
        }
      } catch (_) {}
    }
    fetchStats()
  }, [])

  useEffect(() => {
    ;(async () => {
    import('iconify-icon').catch(() => {})
    const { gsap } = await import('gsap')
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    gsap.registerPlugin(ScrollTrigger)

    /* â”€â”€ PARTICLE FIELD â”€â”€ */
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let particles: any[] = []
    let W: number, H: number

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function createParticles() {
      particles = []
      const isMobile = W < 768
      const count = Math.min(Math.floor(W * H / (isMobile ? 18000 : 8000)), isMobile ? 40 : 120)
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const radius = 80 + Math.random() * Math.max(W, H) * 0.55
        particles.push({
          x: W / 2 + Math.cos(angle) * radius * (0.4 + Math.random() * 0.6),
          y: H / 2 + Math.sin(angle) * radius * (0.4 + Math.random() * 0.6),
          r: 0.8 + Math.random() * 2.2,
          alpha: 0.15 + Math.random() * 0.55,
          speed: 0.0002 + Math.random() * 0.0004,
          angle: angle,
          drift: (Math.random() - 0.5) * 0.0003,
          color: Math.random() > 0.5 ? '37,92,180' : '106,155,228',
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.005 + Math.random() * 0.01,
        })
      }
    }
    createParticles()
    window.addEventListener('resize', createParticles)

    let rafId: number | null = null
    function drawParticles() {
      if (!ctx) return
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.pulse += p.pulseSpeed
        p.angle += p.drift
        const pAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color},${pAlpha})`
        ctx.fill()
      })
      rafId = requestAnimationFrame(drawParticles)
    }
    drawParticles()
    const handleVisibility = () => {
      if (document.hidden) {
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
      } else {
        if (rafId === null) drawParticles()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    /* â”€â”€ TYPEWRITER HEADLINE â”€â”€ */
    const fullText = 'Send money to\nanyone with just\na link.'
    const headline = document.getElementById('hero-headline')
    const cursor = document.getElementById('cursor')
    if (!headline || !cursor) return
    let charIndex = 0

    function typeChar() {
      if (!cursor) return
      if (charIndex < fullText.length) {
        const ch = fullText[charIndex]
        if (ch === '\n') {
          cursor.insertAdjacentHTML('beforebegin', '<br/>')
        } else {
          const span = document.createElement('span')
          span.textContent = ch
          span.style.opacity = '0'
          span.style.animation = 'fadeUp .3s ease forwards'
          cursor.insertAdjacentElement('beforebegin', span)
          setTimeout(() => (span.style.opacity = '1'), 10)
        }
        charIndex++
        const delay = ch === '\n' ? 80 : ch === ' ' ? 60 : 38 + Math.random() * 30
        setTimeout(typeChar, delay)
      } else {
        setTimeout(() => { cursor.style.display = 'none' }, 1200)
      }
    }
    setTimeout(typeChar, 600)

    /* â”€â”€ SCROLL REVEALS â”€â”€ */
    // GSAP ScrollTrigger reveals
    gsap.utils.toArray<Element>('.reveal').forEach((el) => {
      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none none' } })
    })
    gsap.utils.toArray<Element>('.glass-card,.step-card,.testi-card').forEach((el, i) => {
      gsap.fromTo(el,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: (i % 3) * 0.1,
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } })
    })


    /* â”€â”€ PARALLAX ON SCROLL â”€â”€ */
    let ticking = false
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const sy = window.scrollY
          const glows = document.querySelectorAll<HTMLElement>('.deep-bg-glow,.phones-bg-glow,.app-glow,.testi-glow')
          glows.forEach((g, i) => {
            g.style.transform = `translateY(${sy * (i % 2 === 0 ? 0.08 : -0.06)}px)`
          })
          ticking = false
        })
        ticking = true
      }
    })
  })()
  }, [])

  return (
    <div className="lp-root">
      <style dangerouslySetInnerHTML={{ __html: `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --o1:#255CB4;--o2:#1a4a9a;--o3:#4a7fd4;--o4:#6a9be4;
  --o-soft:rgba(37,92,180,0.08);--o-mid:rgba(37,92,180,0.18);
  --page:#09090E;--page2:#0E0E18;--page3:#121220;
  --ink:#FFFFFF;--ink2:rgba(255,255,255,0.75);--ink3:rgba(255,255,255,0.42);
  --border:rgba(255,255,255,0.08);--border-o:rgba(37,92,180,0.22);
  --font-display:'Google Sans Flex','Google Sans Display','Google Sans','sans-serif';
  --font-body:'Google Sans Text','Google Sans','sans-serif';
}
html{scroll-behavior:smooth}
body{font-family:'Google Sans Flex','Google Sans','sans-serif';background:var(--page);color:var(--ink);overflow-x:hidden;line-height:1.6}

/* â”€â”€ NAV â”€â”€ */
nav{
  position:sticky;top:0;z-index:200;
  display:grid;grid-template-columns:auto 1fr auto;align-items:center;
  padding:0 5%;height:64px;
  background:rgba(9,9,14,0.85);
  backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
  border-bottom:0.5px solid var(--border);
}
.nav-logo{font-family:var(--font-display);font-size:22px;font-weight:900;color:#fff;letter-spacing:-.04em;text-decoration:none;display:flex;align-items:center;gap:7px}
.nav-logo span{color:var(--o1)}
.nav-links{display:flex;gap:28px;justify-content:center}
.nav-links a{font-size:14px;color:var(--ink3);text-decoration:none;font-weight:500;transition:color .15s}
.nav-links a:hover{color:#fff}
.nav-right{display:flex;gap:10px;align-items:center;grid-column:3}
.btn-pill{
  padding:9px 22px;border-radius:100px;font-size:14px;font-weight:600;
  cursor:pointer;text-decoration:none;transition:all .2s;
  display:inline-flex;align-items:center;gap:7px;font-family:var(--font-body);
  border:none;
}
.btn-orange{background:var(--o1);color:#fff}
.btn-orange:hover{background:var(--o2);transform:translateY(-1px)}
.btn-ghost{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.7);border:0.5px solid var(--border)}
.btn-ghost:hover{background:rgba(255,255,255,0.1);color:#fff}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HERO — 2-column dark
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
.hero{
  min-height:100vh;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  padding:100px 5% 60px;
  position:relative;overflow:hidden;
  background:var(--page);
  text-align:center;
}
#particle-canvas{position:absolute;inset:0;z-index:0;pointer-events:none}
.hero-center{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;max-width:800px;width:100%}
.hero-eyebrow{
  display:inline-flex;align-items:center;gap:7px;
  font-size:13px;font-weight:500;color:var(--o3);
  margin-bottom:28px;letter-spacing:.01em;
  background:rgba(37,92,180,0.1);border:0.5px solid var(--border-o);
  padding:5px 14px;border-radius:100px;
}
.hero-dot{width:6px;height:6px;border-radius:50%;background:var(--o1);animation:pulse 2s ease-in-out infinite;flex-shrink:0}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
.hero-h1{
  font-family:var(--font-display);
  font-size:clamp(48px,7vw,88px);
  font-weight:900;line-height:1.0;
  letter-spacing:-.05em;color:#fff;
  margin-bottom:24px;min-height:2.4em;
}
.hero-h1 .accent{color:var(--o1)}
.cursor-blink{
  display:inline-block;width:4px;
  background:var(--o1);border-radius:2px;
  animation:blink .9s step-end infinite;
  vertical-align:-.05em;margin-left:3px;height:.85em;
}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.hero-sub{
  font-size:clamp(15px,1.8vw,18px);color:var(--ink3);
  max-width:520px;margin-bottom:36px;line-height:1.75;
  opacity:0;animation:fadeUp .8s .2s ease forwards;
}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.hero-ctas{
  display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;
  opacity:0;animation:fadeUp .8s .4s ease forwards;
  margin-bottom:36px;
}
.btn-hero-orange{
  display:inline-flex;align-items:center;gap:8px;
  background:var(--o1);color:#fff;
  padding:15px 28px;border-radius:100px;
  font-family:var(--font-display);font-size:15px;font-weight:700;
  letter-spacing:-.02em;cursor:pointer;border:none;text-decoration:none;
  transition:all .2s;box-shadow:0 8px 24px rgba(37,92,180,0.35);
}
.btn-hero-orange:hover{background:var(--o2);transform:translateY(-2px);box-shadow:0 12px 32px rgba(37,92,180,0.45)}
.btn-hero-ghost{
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.7);
  padding:15px 28px;border-radius:100px;
  font-family:var(--font-body);font-size:15px;font-weight:500;
  cursor:pointer;border:0.5px solid var(--border);text-decoration:none;
  transition:all .2s;
}
.btn-hero-ghost:hover{background:rgba(255,255,255,0.1);color:#fff}

/* Hero stats */

/* Hero illustration */


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   STATS BAR (Cryptys-inspired)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
.stats-bar{
  background:var(--page2);
  border-top:0.5px solid var(--border);
  border-bottom:0.5px solid var(--border);
  padding:28px 5%;
  display:flex;align-items:center;justify-content:center;
  gap:0;flex-wrap:wrap;
}
.sb-item{
  display:flex;flex-direction:column;align-items:center;
  padding:0 40px;border-right:0.5px solid var(--border);
}
.sb-item:last-child{border-right:none}
.sb-val{font-family:var(--font-display);font-size:28px;font-weight:900;color:var(--o1);letter-spacing:-.04em}
.sb-label{font-size:12px;color:var(--ink3);margin-top:3px;text-align:center}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FEATURES — glass cards on dark
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
.deep-section{
  background:var(--page);padding:100px 5%;
  position:relative;overflow:hidden;
}
.deep-bg-glow{
  position:absolute;pointer-events:none;border-radius:50%;filter:blur(80px);opacity:.3;
}
.glow-1{width:500px;height:500px;background:#255CB4;top:-100px;left:-100px;opacity:.12}
.glow-2{width:400px;height:400px;background:#4a7fd4;bottom:-100px;right:10%;opacity:.08}
.deep-inner{position:relative;z-index:1}
.deep-label{
  font-size:11px;font-weight:500;color:var(--o3);
  letter-spacing:.12em;text-transform:uppercase;margin-bottom:16px;
}
.deep-h2{
  font-family:var(--font-display);
  font-size:clamp(32px,5vw,60px);font-weight:900;
  color:#fff;letter-spacing:-.05em;line-height:1.05;margin-bottom:16px;
}
.deep-h2 em{color:var(--o3);font-style:normal}
.deep-sub{font-size:17px;color:var(--ink3);max-width:440px;line-height:1.7;margin-bottom:60px}
.float-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.glass-card{
  background:rgba(255,255,255,.03);
  border:0.5px solid var(--border);
  border-radius:24px;padding:28px 26px;
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  transition:transform .4s ease,border-color .3s,background .3s;
  opacity:0;transform:translateY(40px);
}
.glass-card.visible{opacity:1;transform:translateY(0)}
.glass-card:hover{
  transform:translateY(-8px) !important;
  border-color:rgba(37,92,180,.25);
  background:rgba(37,92,180,.04);
}
.gc-icon{
  width:48px;height:48px;border-radius:14px;
  background:rgba(37,92,180,.12);border:0.5px solid rgba(37,92,180,.22);
  display:flex;align-items:center;justify-content:center;
  font-size:22px;color:var(--o3);margin-bottom:18px;
}
.gc-title{font-family:var(--font-display);font-size:18px;font-weight:800;color:#fff;letter-spacing:-.03em;margin-bottom:8px}
.gc-desc{font-size:14px;color:var(--ink3);line-height:1.65}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   EXPERIENCE SECTION — dark 2-col
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
/* Dashboard preview section */
.preview-section{background:var(--page2);padding:80px 5% 100px;position:relative;overflow:hidden}
.preview-glow{position:absolute;pointer-events:none;border-radius:50%;filter:blur(120px);width:700px;height:500px;top:-80px;right:-100px;background:conic-gradient(from 180deg,#255CB4,#4a7fd4,#6a9be4,#255CB4);opacity:.14}
.preview-glow2{position:absolute;pointer-events:none;border-radius:50%;filter:blur(100px);width:400px;height:300px;bottom:-40px;left:5%;background:#255CB4;opacity:.08}
.preview-inner{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center;max-width:1100px;margin:0 auto}
.dash-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:24px;overflow:hidden;box-shadow:0 0 0 1px rgba(37,92,180,.12),0 32px 80px rgba(0,0,0,.6),0 0 120px rgba(37,92,180,.12);animation:dashFloat 6s ease-in-out infinite}
[data-theme=light] .dash-card{background:rgba(255,255,255,0.95);border-color:rgba(0,0,0,0.08);box-shadow:0 0 0 1px rgba(37,92,180,.10),0 24px 60px rgba(0,0,0,.12),0 0 80px rgba(37,92,180,.08)}
@keyframes dashFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.dash-header{background:linear-gradient(135deg,#1a3d8f 0%,#255CB4 50%,#3a72cc 100%);padding:22px 24px 20px;position:relative;overflow:hidden}
.dash-header::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(255,255,255,.12),transparent 60%);pointer-events:none}
.dash-header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.dash-logo{font-size:16px;font-weight:900;color:#fff;letter-spacing:-.04em}
.dash-logo span{color:rgba(255,255,255,.55)}
.dash-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.14);border-radius:20px;padding:3px 10px;font-size:11px;color:rgba(255,255,255,.85);font-weight:500}
.dash-bal-lbl{font-size:11px;color:rgba(255,255,255,.6);letter-spacing:.05em;text-transform:uppercase;margin-bottom:4px}
.dash-bal{font-size:34px;font-weight:900;color:#fff;letter-spacing:-.04em;line-height:1}
.dash-bal-sub{font-size:12px;color:rgba(255,255,255,.55);margin-top:4px}
.dash-section-lbl{font-size:10px;font-weight:700;color:var(--ink4);letter-spacing:.07em;text-transform:uppercase;padding:16px 20px 10px}
.dash-tx{display:flex;align-items:center;gap:12px;padding:11px 20px;transition:background .15s;border-bottom:1px solid var(--border)}
.dash-tx:last-of-type{border-bottom:none}
.dash-tx-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.dash-tx-icon.in{background:rgba(34,197,94,.12);color:#22C55E}
.dash-tx-icon.out{background:rgba(37,92,180,.10);color:var(--o1)}
.dash-tx-name{font-size:13px;font-weight:600;color:var(--ink);flex:1}
.dash-tx-sub{font-size:11px;color:var(--ink4);margin-top:1px}
.dash-tx-amt{font-size:13px;font-weight:700;white-space:nowrap}
.dash-tx-amt.in{color:#22C55E}
.dash-tx-amt.out{color:var(--ink2)}
.dash-footer{padding:14px 20px;display:flex;gap:8px}
.dash-action-btn{flex:1;padding:10px;border-radius:10px;font-size:12px;font-weight:600;border:none;cursor:pointer;font-family:var(--font);display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
.dash-action-btn.primary{background:var(--o1);color:#fff}
.dash-action-btn.ghost{background:rgba(255,255,255,.07);color:var(--ink2);border:1px solid var(--border)}
[data-theme=light] .dash-action-btn.ghost{background:var(--page2);color:var(--ink2)}
@media(max-width:900px){.preview-inner{grid-template-columns:1fr}}
@media(max-width:600px){.preview-section{padding:48px 16px 64px}}

.how-section{
  background:var(--page);padding:100px 5%;
  position:relative;overflow:hidden;
}
.how-section::before{
  content:'';position:absolute;inset:0;z-index:0;opacity:.03;
  background-image:radial-gradient(circle,rgba(37,92,180,.8) 1px,transparent 1px);
  background-size:28px 28px;
}
.how-inner{position:relative;z-index:1}
.how-tag{
  display:inline-flex;align-items:center;gap:6px;
  background:rgba(37,92,180,.1);color:var(--o3);
  font-size:12px;font-weight:500;padding:5px 14px;
  border-radius:20px;margin-bottom:16px;
  border:0.5px solid var(--border-o);
}
.how-h2{font-family:var(--font-display);font-size:clamp(32px,5vw,56px);font-weight:900;color:#fff;letter-spacing:-.05em;line-height:1.05;margin-bottom:14px}
.how-sub{font-size:17px;color:var(--ink3);max-width:420px;line-height:1.7;margin-bottom:60px}
.steps-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px}
.step-card{
  background:rgba(255,255,255,.03);
  border:0.5px solid var(--border);
  border-radius:24px;padding:32px 26px;
  backdrop-filter:blur(8px);
  opacity:0;transform:translateY(36px);
  transition:opacity .6s ease,transform .6s ease,border-color .3s,background .3s;
}
.step-card.visible{opacity:1;transform:translateY(0)}
.step-card:hover{background:rgba(37,92,180,.04);border-color:rgba(37,92,180,.22)}
.step-num{
  font-family:var(--font-display);font-size:11px;font-weight:800;
  color:var(--o3);letter-spacing:.1em;margin-bottom:18px;
  display:flex;align-items:center;gap:8px;
}
.step-num::after{content:'';flex:1;height:0.5px;background:var(--border)}
.step-icon{
  width:48px;height:48px;border-radius:14px;
  background:rgba(37,92,180,.12);border:0.5px solid rgba(37,92,180,.2);
  display:flex;align-items:center;justify-content:center;
  font-size:22px;color:var(--o3);margin-bottom:16px;
}
.step-title{font-family:var(--font-display);font-size:19px;font-weight:800;color:#fff;letter-spacing:-.03em;margin-bottom:8px}
.step-desc{font-size:14px;color:var(--ink3);line-height:1.65}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FEES — dark
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
.fee-section{background:var(--page2);padding:100px 5%}
.fee-center{text-align:center;max-width:600px;margin:0 auto}
.section-tag-orange{
  display:inline-flex;align-items:center;gap:6px;
  background:rgba(37,92,180,.1);color:var(--o3);
  font-size:12px;font-weight:500;padding:5px 14px;
  border-radius:20px;border:0.5px solid var(--border-o);margin-bottom:16px;
}
.section-h2{font-family:var(--font-display);font-size:clamp(28px,4vw,48px);font-weight:900;letter-spacing:-.05em;line-height:1.05;color:#fff;margin-bottom:14px}
.section-sub{font-size:16px;color:var(--ink3);line-height:1.65;margin-bottom:48px}
.fee-table{border:0.5px solid var(--border);border-radius:20px;overflow:hidden;max-width:640px;margin:0 auto}
.fee-head{display:grid;grid-template-columns:2fr 1fr 1fr;padding:14px 24px;background:rgba(255,255,255,.04)}
.fee-head span{font-size:11px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.07em}
.fee-head span:not(:first-child){text-align:center}
.fee-row{display:grid;grid-template-columns:2fr 1fr 1fr;padding:15px 24px;border-bottom:0.5px solid var(--border);align-items:center;transition:background .15s}
.fee-row:last-child{border-bottom:none}
.fee-row:hover{background:rgba(37,92,180,.04)}
.fee-row.hi{background:rgba(37,92,180,.06)}
.fee-method{font-size:14px;color:var(--ink2);display:flex;align-items:center;gap:7px}
.fee-them{font-size:14px;color:var(--ink3);text-align:center;text-decoration:line-through;opacity:.5}
.fee-us{font-size:14px;font-weight:500;color:var(--o3);text-align:center;display:flex;align-items:center;justify-content:center;gap:4px}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TESTIMONIALS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
.testi-section{background:var(--page);padding:100px 5%;position:relative;overflow:hidden}
.testi-glow{position:absolute;pointer-events:none;border-radius:50%;filter:blur(100px);width:500px;height:300px;background:#255CB4;opacity:.08;top:50%;left:50%;transform:translate(-50%,-50%)}
.testi-inner{position:relative;z-index:1}
.testi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-top:48px}
.testi-card{
  background:rgba(255,255,255,.03);border:0.5px solid var(--border);
  border-radius:24px;padding:28px 24px;backdrop-filter:blur(12px);
  opacity:0;transform:translateY(32px);
  transition:opacity .6s ease,transform .6s ease,border-color .3s;
}
.testi-card.visible{opacity:1;transform:translateY(0)}
.testi-card:hover{border-color:rgba(37,92,180,.22)}
.testi-stars{display:flex;gap:3px;margin-bottom:14px}
.tstar{color:var(--o1);font-size:14px}
.testi-text{font-size:14px;color:var(--ink3);line-height:1.75;margin-bottom:20px;font-style:italic}
.testi-author{display:flex;align-items:center;gap:10px}
.tav{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:12px;font-weight:800;flex-shrink:0}
.testi-name{font-size:14px;font-weight:500;color:#fff}
.testi-role{font-size:11px;color:var(--ink3)}
.testi-flag{margin-left:auto;font-size:20px}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   APP DOWNLOAD
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
.app-section{background:var(--page2);padding:100px 5%;position:relative;overflow:hidden}
.app-glow{position:absolute;width:600px;height:600px;border-radius:50%;background:#255CB4;filter:blur(120px);opacity:.07;bottom:-200px;right:-100px;pointer-events:none}
.app-inner{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;max-width:1100px;margin:0 auto}
.app-eyebrow{font-size:11px;font-weight:500;color:var(--o3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px}
.app-h2{font-family:var(--font-display);font-size:clamp(28px,4vw,50px);font-weight:900;color:#fff;letter-spacing:-.05em;line-height:1.05;margin-bottom:14px}
.app-sub{font-size:16px;color:var(--ink3);line-height:1.7;margin-bottom:36px;max-width:380px}
.app-btns{display:flex;gap:12px;flex-wrap:wrap}
.app-btn{
  display:inline-flex;align-items:center;gap:12px;
  background:rgba(255,255,255,.06);border:0.5px solid var(--border);
  border-radius:14px;padding:14px 22px;cursor:pointer;
  text-decoration:none;transition:all .2s;backdrop-filter:blur(8px);
}
.app-btn:hover{background:rgba(37,92,180,.1);border-color:var(--border-o);transform:translateY(-2px)}
.app-btn-icon{font-size:26px;color:var(--o3)}
.app-btn-small{font-size:10px;color:var(--ink3)}
.app-btn-big{font-family:var(--font-display);font-size:16px;font-weight:800;color:#fff;letter-spacing:-.02em}
.app-phone{
  background:#14141E;border-radius:36px;padding:8px;
  border:0.5px solid var(--border);
  box-shadow:0 32px 80px rgba(0,0,0,.5);
  max-width:240px;margin:0 auto;
}
.app-screen{background:#09090E;border-radius:30px;padding:16px 14px;min-height:300px}
.app-s-header{font-family:var(--font-display);font-size:13px;font-weight:900;color:#fff;letter-spacing:-.02em;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center}
.app-s-header span{color:var(--o1)}
.app-s-lbl{font-size:9px;color:var(--ink3);text-transform:uppercase;letter-spacing:.07em;font-weight:500;margin-bottom:8px}
.app-tx{display:flex;flex-direction:column;gap:7px}
.app-tx-item{background:rgba(255,255,255,.04);border-radius:10px;padding:9px 11px;display:flex;align-items:center;gap:9px}
.atav{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:10px;font-weight:800;flex-shrink:0}
.atx-name{font-size:11px;font-weight:500;color:#fff}
.atx-note{font-size:9px;color:var(--ink3)}
.atx-amt{margin-left:auto;font-family:var(--font-display);font-size:12px;font-weight:800;color:var(--o3)}
.app-total{background:rgba(37,92,180,.1);border-radius:10px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;margin-top:8px}
.atotal-lbl{font-size:9px;color:var(--ink3)}
.atotal-val{font-family:var(--font-display);font-size:16px;font-weight:900;color:var(--o3)}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TRUST STRIP
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
.trust-section{background:var(--page);padding:40px 0;text-align:center;border-top:0.5px solid var(--border);border-bottom:0.5px solid var(--border);overflow:hidden;}
.trust-h3{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:12px;font-weight:600;color:var(--ink4);letter-spacing:.08em;text-transform:uppercase;margin-bottom:28px;}
.trust-marquee-wrapper{width:100%;overflow:hidden;position:relative;display:flex;align-items:center;}
.trust-marquee-wrapper::before,.trust-marquee-wrapper::after{content:'';position:absolute;top:0;width:150px;height:100%;z-index:2;pointer-events:none;}
.trust-marquee-wrapper::before{left:0;background:linear-gradient(to right,var(--page) 0%,transparent 100%);}
.trust-marquee-wrapper::after{right:0;background:linear-gradient(to left,var(--page) 0%,transparent 100%);}
.trust-marquee{display:flex;align-items:center;width:max-content;animation:trustScroll 24s linear infinite;}
.trust-marquee:hover{animation-play-state:paused;}
@keyframes trustScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.trust-item{display:flex;align-items:center;gap:10px;padding:0 36px;text-decoration:none;transition:opacity .2s;cursor:pointer;}
.trust-item:hover{opacity:0.8;}
.trust-item-logo{width:32px;height:32px;border-radius:6px;background:rgba(255,255,255,0.05);border:0.5px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;padding:4px;}
.trust-item-name{font-size:16px;font-weight:700;color:var(--ink2);white-space:nowrap;letter-spacing:-.02em;font-family:var(--font-display);}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FINAL CTA
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
.final-section{
  background:var(--page);padding:120px 5%;text-align:center;
  position:relative;overflow:hidden;
}
.final-glow{position:absolute;width:600px;height:400px;border-radius:50%;background:var(--o1);filter:blur(100px);opacity:.12;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
.final-inner{position:relative;z-index:1}
.final-h2{font-family:var(--font-display);font-size:clamp(36px,6vw,72px);font-weight:900;color:#fff;letter-spacing:-.05em;line-height:1.0;margin-bottom:16px}
.final-h2 em{color:var(--o3);font-style:normal}
.final-sub{font-size:18px;color:var(--ink3);margin-bottom:40px}
.final-btns{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
.btn-final-fill{
  display:inline-flex;align-items:center;gap:8px;
  background:var(--o1);color:#fff;
  padding:16px 32px;border-radius:100px;
  font-family:var(--font-display);font-size:16px;font-weight:800;
  letter-spacing:-.02em;cursor:pointer;border:none;text-decoration:none;
  transition:all .2s;box-shadow:0 8px 28px rgba(37,92,180,0.4);
}
.btn-final-fill:hover{background:var(--o2);transform:translateY(-2px);box-shadow:0 14px 36px rgba(37,92,180,0.5)}
.btn-final-ghost{
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(255,255,255,.06);color:var(--ink2);
  padding:16px 32px;border-radius:100px;
  font-family:var(--font-body);font-size:16px;font-weight:500;
  cursor:pointer;border:0.5px solid var(--border);text-decoration:none;
  transition:all .2s;backdrop-filter:blur(8px);
}
.btn-final-ghost:hover{background:rgba(255,255,255,.1);color:#fff}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FOOTER
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
footer{
  background:#05050A;padding:56px 5% 32px;
  border-top:0.5px solid var(--border);
}
.footer-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:48px}
.footer-logo{font-family:var(--font-display);font-size:22px;font-weight:900;color:#fff;letter-spacing:-.04em;margin-bottom:12px}
.footer-logo span{color:var(--o1)}
.footer-desc{font-size:13px;color:var(--ink3);line-height:1.7;max-width:240px}
.footer-col-title{font-size:11px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}
.footer-links{display:flex;flex-direction:column;gap:9px}
.footer-links a{font-size:13px;color:rgba(255,255,255,.35);text-decoration:none;transition:color .15s}
.footer-links a:hover{color:#fff}
.footer-bottom{border-top:0.5px solid var(--border);padding-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.footer-copy{font-size:12px;color:rgba(255,255,255,.2)}
.footer-arc{font-size:12px;color:rgba(255,255,255,.2);display:flex;align-items:center;gap:5px}
.footer-arc span{color:var(--o3)}

/* â”€â”€ SCROLL UTILITY â”€â”€ */
.reveal{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-delay-1{transition-delay:.1s}
.reveal-delay-2{transition-delay:.2s}
.reveal-delay-3{transition-delay:.3s}
.reveal-delay-4{transition-delay:.4s}

/* â”€â”€ RESPONSIVE â”€â”€ */
@media(max-width:900px){
  .hero{min-height:auto;padding-top:60px}
  .phones-inner,.app-inner{grid-template-columns:1fr}
  .footer-top{grid-template-columns:1fr 1fr}
  .phones-right{height:400px}
  .stats-bar{gap:0}
  .sb-item{padding:16px 24px}
  .sb-val{font-size:22px}
}
@media(max-width:600px){
  /* Nav */
  .hero{padding:40px 5%}
  .nav-links{display:none}
  .nav-right{display:none!important}
  .btn-pill{padding:7px 14px!important;font-size:12px!important}
  nav{padding:0 16px!important;grid-template-columns:auto 1fr auto!important}

  /* Hero CTAs — side by side, no wrapping */
  .hero-stats{gap:16px}
  .h-stat-div{display:none}
  .hero-ctas{flex-wrap:nowrap;gap:10px;width:100%}
  .btn-hero-orange,.btn-hero-ghost{
    flex:1;padding:14px 10px!important;font-size:14px!important;
    justify-content:center;white-space:nowrap;min-width:0;
  }
  .btn-hero-orange iconify-icon,.btn-hero-ghost iconify-icon{display:none}

  /* Stats — 2×2 grid instead of vertical stack */
  .stats-bar{display:grid;grid-template-columns:1fr 1fr;flex-direction:unset}
  .sb-item{
    border-right:none;border-bottom:0.5px solid var(--border);
    padding:20px 16px;width:auto;text-align:center;
  }
  .sb-item:nth-child(odd){border-right:0.5px solid var(--border)}
  .sb-item:nth-last-child(-n+2){border-bottom:none}

  /* Trust logos — marquee doesn't need to wrap on mobile */
  .trust-section{padding:36px 0}
  .trust-marquee-wrapper::before,.trust-marquee-wrapper::after{width:60px;}
  .trust-item{padding:0 24px;}
  .trust-item-name{font-size:14px;}

  /* Footer — brand full-width, link cols in 2-col grid */
  .footer-top{grid-template-columns:1fr 1fr}
  .footer-top>div:first-child{
    grid-column:1/-1;
    border-bottom:0.5px solid var(--border);
    padding-bottom:24px;margin-bottom:4px;
  }
  .footer-bottom{flex-direction:column;align-items:flex-start;gap:6px}
}
.lp-hamburger{display:none}
.lp-mobile-cta{display:none}
.lp-theme-toggle-mobile{display:none}
.lp-overlay{display:none}
.lp-drawer{display:none}
/* desktop theme toggle */
.lp-theme-toggle{
  display:flex;align-items:center;justify-content:center;
  width:36px;height:36px;border-radius:10px;
  border:1px solid var(--border);background:transparent;
  color:rgba(255,255,255,0.65);cursor:pointer;font-size:18px;
  transition:background .15s,color .15s,border-color .15s;flex-shrink:0;
}
.lp-theme-toggle:hover{background:rgba(255,255,255,0.08);color:#fff;border-color:rgba(255,255,255,0.18)}
[data-theme="light"] .lp-theme-toggle{color:var(--ink3);border-color:rgba(0,0,0,0.12)}
[data-theme="light"] .lp-theme-toggle:hover{background:rgba(0,0,0,0.06);color:var(--ink)}
@media(max-width:600px){
  .lp-hamburger{
    display:flex;align-items:center;justify-content:center;
    width:38px;height:38px;border-radius:10px;
    border:1px solid var(--border);background:transparent;
    color:#fff;cursor:pointer;font-size:20px;flex-shrink:0;
    grid-column:4;justify-self:end;
  }
  .lp-mobile-cta{
    display:inline-flex!important;align-items:center;justify-content:center;
    padding:7px 14px!important;font-size:12px!important;
    flex-shrink:0;white-space:nowrap;
    grid-column:4;justify-self:end;
  }
  nav{grid-template-columns:auto 1fr auto auto!important;gap:8px}
  .lp-theme-toggle-mobile{
    display:flex;align-items:center;justify-content:center;
    width:36px;height:36px;border-radius:10px;
    border:1px solid var(--border);background:transparent;
    color:rgba(255,255,255,0.65);cursor:pointer;font-size:18px;
    flex-shrink:0;grid-column:3;justify-self:end;
    transition:background .15s,color .15s;
  }
  [data-theme="light"] .lp-theme-toggle-mobile{color:var(--ink3);border-color:rgba(0,0,0,0.12)}
  .lp-overlay{
    display:block;position:fixed;inset:0;
    background:rgba(0,0,0,0.5);z-index:199;
    opacity:0;pointer-events:none;transition:opacity .2s ease;
  }
  .lp-overlay.open{opacity:1;pointer-events:all}
  .lp-drawer{
    display:block;position:fixed;
    top:64px;left:0;right:0;
    background:rgba(9,9,14,0.98);
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
    border-bottom:1px solid var(--border);
    z-index:200;padding:12px 16px 20px;
    transform:translateY(-110%);opacity:0;
    transition:transform 0.25s cubic-bezier(.4,0,.2,1),opacity 0.2s ease;
    pointer-events:none;
  }
  .lp-drawer.open{transform:translateY(0);opacity:1;pointer-events:all}
  .lp-drawer-item{
    display:flex;align-items:center;gap:12px;
    padding:13px 14px;border-radius:14px;
    text-decoration:none;color:rgba(255,255,255,0.6);
    font-size:15px;font-weight:500;
    transition:background .15s,color .15s;margin-bottom:4px;
  }
  .lp-drawer-item:hover{background:rgba(255,255,255,0.06);color:#fff}
  .lp-drawer-icon{
    width:34px;height:34px;border-radius:10px;
    background:rgba(255,255,255,0.06);border:1px solid var(--border);
    display:flex;align-items:center;justify-content:center;
    font-size:16px;color:rgba(255,255,255,0.5);flex-shrink:0;
  }
  .lp-drawer-divider{height:1px;background:var(--border);margin:8px 0 12px}
  .lp-drawer-cta{
    display:flex;align-items:center;gap:12px;
    padding:13px 14px;border-radius:14px;
    font-size:15px;font-weight:600;cursor:pointer;
    border:none;font-family:var(--font-body);width:100%;
    text-align:left;transition:background .15s;margin-bottom:4px;
  }
  .lp-drawer-primary{background:var(--o1);color:#fff}
  .lp-drawer-primary:hover{background:var(--o2)}
  .lp-drawer-primary .lp-drawer-icon{background:rgba(255,255,255,0.2);border-color:transparent;color:#fff}
  .lp-drawer-ghost{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border:none}
  .lp-drawer-ghost:hover{background:rgba(255,255,255,0.1);color:#fff}
  .lp-drawer-logout{
    display:flex;align-items:center;gap:12px;
    padding:13px 14px;border-radius:14px;
    color:#E57373;font-size:15px;font-weight:500;cursor:pointer;
    background:transparent;border:none;font-family:var(--font-body);
    width:100%;text-align:left;transition:background .15s;margin-top:4px;
  }
  .lp-drawer-logout:hover{background:rgba(229,115,115,0.08)}
  .lp-drawer-logout .lp-drawer-icon{color:#E57373;border-color:rgba(229,115,115,.3);background:rgba(229,115,115,.08)}
}

/* ── LIGHT THEME overrides for landing page ── */
[data-theme="light"]{
  --o1:#255CB4;--o2:#1a4a9a;--o3:#1e4fa0;--o4:#2a5fba;
  --ink:#0A0A14;--ink2:#2C2C3A;--ink3:#5A5A72;--ink4:#9898B0;
  --page:#F2F4FA;--page2:#E8ECF5;--white:#FFFFFF;
  --border:rgba(0,0,0,0.08);--border-o:rgba(37,92,180,0.22);
  --o-soft:rgba(37,92,180,0.06);--o-mid:rgba(37,92,180,0.12);
}
[data-theme="light"] nav{background:rgba(242,244,250,0.92);border-bottom-color:rgba(0,0,0,0.08)}
[data-theme="light"] .nav-logo{color:var(--ink)}
[data-theme="light"] .nav-links a{color:var(--ink3)}
[data-theme="light"] .btn-ghost{background:rgba(0,0,0,0.05);color:var(--ink2);border-color:rgba(0,0,0,0.12)}
[data-theme="light"] .btn-ghost:hover{background:rgba(0,0,0,0.08);color:var(--ink)}
[data-theme="light"] .hero{background:var(--page)}
[data-theme="light"] .hero-h1{color:var(--ink)}
[data-theme="light"] .hero-sub{color:var(--ink3)}
[data-theme="light"] .btn-hero-ghost{background:rgba(0,0,0,0.06);color:var(--ink2);border-color:rgba(0,0,0,0.12)}
[data-theme="light"] .stats-bar{background:var(--page2);border-color:rgba(0,0,0,0.08)}
[data-theme="light"] .sb-label{color:var(--ink3)}
[data-theme="light"] .deep-section{background:var(--page)}
[data-theme="light"] .glass-card{background:rgba(255,255,255,0.8);border-color:rgba(0,0,0,0.08)}
[data-theme="light"] .glass-card:hover{background:#fff;border-color:rgba(37,92,180,0.2)}
[data-theme="light"] .gc-title{color:var(--ink)}
[data-theme="light"] .gc-desc{color:var(--ink3)}
[data-theme="light"] .deep-h2{color:var(--ink)}
[data-theme="light"] .deep-sub{color:var(--ink3)}
[data-theme="light"] .how-section{background:var(--page2)}
[data-theme="light"] .step-card{background:rgba(255,255,255,0.7);border-color:rgba(0,0,0,0.08)}
[data-theme="light"] .step-card:hover{background:#fff;border-color:rgba(37,92,180,0.2)}
[data-theme="light"] .step-title{color:var(--ink)}
[data-theme="light"] .step-desc{color:var(--ink3)}
[data-theme="light"] .how-h2{color:var(--ink)}
[data-theme="light"] .how-sub{color:var(--ink3)}
[data-theme="light"] .trust-section{background:var(--page)}
[data-theme="light"] .trust-pill{background:rgba(255,255,255,0.8);border-color:rgba(0,0,0,0.08)}
[data-theme="light"] .trust-pill:hover{background:#fff}
[data-theme="light"] .trust-pill-name{color:var(--ink)}
[data-theme="light"] .final-section{background:var(--page2)}
[data-theme="light"] .final-h2{color:var(--ink)}
[data-theme="light"] .final-sub{color:var(--ink3)}
[data-theme="light"] footer{background:var(--page);border-top-color:rgba(0,0,0,0.08)}
[data-theme="light"] .footer-logo{color:var(--ink)}
[data-theme="light"] .footer-desc{color:var(--ink3)}
[data-theme="light"] .footer-links a{color:var(--ink3)}
[data-theme="light"] .footer-links a:hover{color:var(--ink)}
[data-theme="light"] .footer-copy,[data-theme="light"] .footer-arc{color:var(--ink4)}
[data-theme="light"] .lp-drawer{background:rgba(242,244,250,0.98);border-bottom-color:rgba(0,0,0,0.08)}
[data-theme="light"] .lp-drawer-item{color:var(--ink3)}
[data-theme="light"] .lp-drawer-item:hover{background:rgba(0,0,0,0.04);color:var(--ink)}
[data-theme="light"] .lp-drawer-divider{background:rgba(0,0,0,0.08)}
[data-theme="light"] .lp-overlay{background:rgba(0,0,0,0.3)}
[data-theme="light"] .lp-drawer-ghost{background:rgba(0,0,0,0.05);color:var(--ink2)}
[data-theme="light"] .lp-drawer-ghost:hover{background:rgba(0,0,0,0.08);color:var(--ink)}
[data-theme="light"] .lp-drawer-icon{background:rgba(0,0,0,0.05);border-color:rgba(0,0,0,0.08);color:var(--ink3)}
[data-theme="light"] .lp-drawer-primary .lp-drawer-icon{background:rgba(255,255,255,0.2);color:#fff}

/* ── outer wrapper ── */
.lp-root{background:var(--page);color:var(--ink)}

/* ── hero ── */
[data-theme="light"] .hero-eyebrow{background:rgba(37,92,180,0.07);border-color:rgba(37,92,180,0.16);color:var(--o3)}

/* ── features section ── */
[data-theme="light"] .deep-label{color:var(--o3)}
[data-theme="light"] .deep-bg-glow{opacity:0.05}
[data-theme="light"] .gc-icon{background:rgba(37,92,180,0.07);border-color:rgba(37,92,180,0.14)}

/* ── dashboard preview section ── */
[data-theme="light"] .preview-glow{opacity:0.06}
[data-theme="light"] .preview-glow2{opacity:0.04}

/* ── how it works ── */
[data-theme="light"] .how-section::before{opacity:0.012}
[data-theme="light"] .how-tag{color:var(--o3)}
[data-theme="light"] .step-num{color:var(--o3)}
[data-theme="light"] .step-icon{background:rgba(37,92,180,0.07);border-color:rgba(37,92,180,0.14)}

/* ── fees ── */
[data-theme="light"] .section-tag-orange{color:var(--o3)}
[data-theme="light"] .section-h2{color:var(--ink)}
[data-theme="light"] .section-sub{color:var(--ink3)}
[data-theme="light"] .fee-table{border-color:rgba(0,0,0,0.08)}
[data-theme="light"] .fee-head{background:rgba(0,0,0,0.03)}
[data-theme="light"] .fee-head span{color:var(--ink3)}
[data-theme="light"] .fee-row{border-bottom-color:rgba(0,0,0,0.06)}
[data-theme="light"] .fee-row.hi{background:rgba(37,92,180,0.06)}
[data-theme="light"] .fee-method{color:var(--ink2)}
[data-theme="light"] .fee-them{color:var(--ink3)}

/* ── testimonials ── */
[data-theme="light"] .testi-section{background:var(--page2)}
[data-theme="light"] .testi-card{background:rgba(255,255,255,0.9);border-color:rgba(0,0,0,0.08)}
[data-theme="light"] .testi-card:hover{border-color:rgba(37,92,180,0.2)}
[data-theme="light"] .testi-text{color:var(--ink3)}
[data-theme="light"] .testi-name{color:var(--ink)}
[data-theme="light"] .testi-role{color:var(--ink3)}
[data-theme="light"] .testi-glow{opacity:0.04}

/* ── app section ── */
[data-theme="light"] .app-eyebrow{color:var(--o3)}
[data-theme="light"] .app-h2{color:var(--ink)}
[data-theme="light"] .app-sub{color:var(--ink3)}
[data-theme="light"] .app-btn{background:rgba(255,255,255,0.9);border-color:rgba(0,0,0,0.1)}
[data-theme="light"] .app-btn:hover{background:#fff;border-color:rgba(37,92,180,0.22)}
[data-theme="light"] .app-btn-small{color:var(--ink3)}
[data-theme="light"] .app-btn-big{color:var(--ink)}
[data-theme="light"] .app-glow{opacity:0.04}

/* ── final CTA ── */
[data-theme="light"] .final-glow{opacity:0.07}
[data-theme="light"] .btn-final-ghost{background:rgba(0,0,0,0.05);color:var(--ink2);border-color:rgba(0,0,0,0.12)}
[data-theme="light"] .btn-final-ghost:hover{background:rgba(0,0,0,0.08);color:var(--ink)}

/* ── trust strip ── */
[data-theme="light"] .trust-h3{color:var(--ink3)}

/* ── footer ── */
[data-theme="light"] .footer-col-title{color:var(--ink3)}
[data-theme="light"] .footer-bottom{border-top-color:rgba(0,0,0,0.08)}
[data-theme="light"] .footer-arc span{color:var(--o3)}
` }} />

      {/* NAV overlay (mobile) */}
      <div className={`lp-overlay${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)} />

      {/* NAV */}
      <nav>
        <a href="#" className="nav-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/zapay-icon.svg" alt="" aria-hidden="true" width={26} height={26} style={{ display: 'block', flexShrink: 0 }} />
          <span>za<span style={{ color: 'var(--o1)' }}>pay</span></span>
        </a>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#fees">Fees</a>
          <a href="#app">App</a>
        </div>
        <div className="nav-right">
          {/* Theme toggle — desktop */}
          <button onClick={toggleTheme} className="lp-theme-toggle" aria-label="Toggle theme">
            <Icon icon={theme === 'dark' ? 'ph:sun-bold' : 'ph:moon-bold'} />
          </button>
          {authenticated ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => router.push('/dashboard')} className="btn-pill btn-orange" style={{ cursor: 'pointer' }}>Dashboard</button>
              <button onClick={logout} className="btn-pill btn-ghost" style={{ cursor: 'pointer' }}>Log out</button>
            </span>
          ) : (
            <span id="tour-landing-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={login} className="btn-pill btn-ghost" style={{ cursor: 'pointer' }}>Sign in</button>
              <button onClick={() => router.push('/create')} className="btn-pill btn-orange" style={{ cursor: 'pointer' }}>Create link</button>
            </span>
          )}
        </div>
        {/* Theme toggle — mobile (always visible, column 3) */}
        <button onClick={toggleTheme} className="lp-theme-toggle-mobile" aria-label="Toggle theme">
          <Icon icon={theme === 'dark' ? 'ph:sun-bold' : 'ph:moon-bold'} />
        </button>
        {/* Mobile right corner: hamburger for auth users, Create link CTA for guests (column 4) */}
        {authenticated ? (
          <button
            className="lp-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <Icon icon={menuOpen ? 'ph:x-bold' : 'ph:list-bold'} />
          </button>
        ) : (
          <button
            onClick={() => router.push('/create')}
            className="btn-pill btn-orange lp-mobile-cta"
            style={{ cursor: 'pointer' }}
          >
            Create link
          </button>
        )}
      </nav>

      {/* Mobile slide-down drawer — authenticated users only */}
      {authenticated && (
        <div className={`lp-drawer${menuOpen ? ' open' : ''}`}>
          {[
            { label: 'How it works', href: '#how', icon: 'ph:info-bold' },
            { label: 'Fees', href: '#fees', icon: 'ph:percent-bold' },
            { label: 'App', href: '#app', icon: 'ph:device-mobile-bold' },
          ].map(item => (
            <a key={item.label} href={item.href} className="lp-drawer-item" onClick={() => setMenuOpen(false)}>
              <span className="lp-drawer-icon"><Icon icon={item.icon} /></span>
              {item.label}
            </a>
          ))}
          <div className="lp-drawer-divider" />
          <button className="lp-drawer-cta lp-drawer-primary" onClick={() => { router.push('/dashboard'); setMenuOpen(false) }}>
            <span className="lp-drawer-icon"><Icon icon="ph:squares-four-bold" /></span>
            Dashboard
          </button>
          <button
            className="lp-drawer-cta lp-drawer-ghost"
            onClick={() => { toggleTheme(); setMenuOpen(false) }}
            style={{ marginBottom: 0 }}
          >
            <span className="lp-drawer-icon">
              <Icon icon={theme === 'dark' ? 'ph:sun-bold' : 'ph:moon-bold'} />
            </span>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button className="lp-drawer-logout" onClick={() => { logout(); setMenuOpen(false) }}>
            <span className="lp-drawer-icon"><Icon icon="ph:sign-out-bold" /></span>
            Log out
          </button>
        </div>
      )}

      {/* â•â• HERO â•â• */}
      <section className="hero">
        <canvas id="particle-canvas"></canvas>

        <div className="hero-center">
          <div className="hero-eyebrow">
            <div className="hero-dot"></div>
            Built on Arc &nbsp;·&nbsp; Powered by USDC
          </div>
          <h1 className="hero-h1" id="hero-headline"><span className="cursor-blink" id="cursor"></span></h1>
          <p className="hero-sub">No wallet needed. No crypto knowledge required. Send or receive money globally — anyone, anywhere, in seconds.</p>
          <div className="hero-ctas">
            {authenticated ? (
              <motion.button onClick={() => router.push('/dashboard')} className="btn-hero-orange" style={{ cursor: 'pointer' }} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <iconify-icon icon="ph:squares-four-bold"></iconify-icon>
                Go to Dashboard
              </motion.button>
            ) : (
              <>
                <motion.button onClick={() => router.push('/send')} className="btn-hero-orange" style={{ cursor: 'pointer' }} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                  <iconify-icon icon="ph:paper-plane-right-bold"></iconify-icon>
                  Send money
                </motion.button>
                <motion.button onClick={() => router.push('/create')} className="btn-hero-ghost" style={{ cursor: 'pointer' }} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                  <iconify-icon icon="ph:link-bold"></iconify-icon>
                  Create link
                </motion.button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* â•â• STATS BAR â•â• */}
      <div className="stats-bar">
        <div className="sb-item">
          <div className="sb-val">$0.00</div>
          <div className="sb-label">Gas fee, always</div>
        </div>
        <div className="sb-item">
          <div className="sb-val">&lt;1s</div>
          <div className="sb-label">Settlement speed</div>
        </div>
        <div className="sb-item">
          <div className="sb-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {liveStats.links > 0 ? liveStats.links.toLocaleString() : '150+'}
            {liveStats.links > 0 && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--o3)', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }}></span>}
          </div>
          <div className="sb-label">Links created</div>
        </div>
        <div className="sb-item">
          <div className="sb-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {liveStats.txs > 0 ? liveStats.txs.toLocaleString() : '0'}
            {liveStats.txs > 0 && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--o3)', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }}></span>}
          </div>
          <div className="sb-label">Payments sent</div>
        </div>
      </div>

      {/* â•â• FEATURES â•â• */}
      <section className="deep-section">
        <div className="deep-bg-glow glow-1"></div>
        <div className="deep-bg-glow glow-2"></div>
        <div className="deep-inner">
          <div className="reveal">
            <div className="deep-label">Why ZaPay</div>
            <h2 className="deep-h2">Money should move as fast<br/>as a <em>message</em></h2>
            <p className="deep-sub">We built the payments layer the world was missing — instant, borderless, and so simple your parents can use it.</p>
          </div>
          <div className="float-grid">
            {[
              { icon: 'ph:envelope-simple-bold', title: 'Sign in in seconds', desc: "Log in with your email address and you're in. No seed phrases, no wallet setup, no crypto knowledge needed.", delay: '.05s' },
              { icon: 'ph:lightning-bold', title: 'Sub-second settlement', desc: 'Arc settles payments in under one second. No "pending" for 3 business days. The moment they pay, you have it — confirmed on-chain.', delay: '.15s' },
              { icon: 'ph:currency-circle-dollar-bold', title: 'Send and receive USDC', desc: 'Send or receive USDC instantly across borders. No middlemen, no conversion delays, no bank holding your money for days.', delay: '.25s' },
              { icon: 'ph:cube-bold', title: 'Built on Arc', desc: 'Every payment settles on Arc — a fast, low-cost blockchain built for real-world transactions. Transparent, verifiable, and always on.', delay: '.35s' },
              { icon: 'ph:lock-key-bold', title: 'Your funds, protected', desc: 'Your balance lives in your ZaPay dashboard, always accessible. When you send to someone new, funds are held securely in escrow for 7 days — giving them time to claim before you can recover them.', delay: '.45s' },
              { icon: 'ph:link-bold', title: 'Two ways to get paid', desc: 'Create a fixed link for a specific amount and note, or a reusable open link for your bio. Share either on WhatsApp, Telegram, or anywhere — one click and they pay.', delay: '.55s' },
            ].map(card => (
              <div key={card.title} className="glass-card" style={{ transitionDelay: card.delay }}>
                <div className="gc-icon"><iconify-icon icon={card.icon}></iconify-icon></div>
                <div className="gc-title">{card.title}</div>
                <div className="gc-desc">{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="preview-section">
        <div className="preview-glow" />
        <div className="preview-glow2" />
        <div className="preview-inner">

          {/* Left text */}
          <div className="phones-left reveal">
            <div className="deep-label">Your dashboard</div>
            <h2 className="deep-h2" style={{ fontSize: 'clamp(28px,4vw,52px)' }}>Every payment,<br/>right<br/><em>in front of you.</em></h2>
            <p className="deep-sub" style={{ marginBottom: '32px' }}>See your balance, track incoming and outgoing payments, and act in one tap — all from a single clean dashboard that updates in real time.</p>
            <motion.button
              onClick={authenticated ? () => router.push('/dashboard') : () => router.push('/create')}
              className="btn-final-fill"
              style={{ fontSize: '14px', padding: '13px 26px', cursor: 'pointer', border: 'none' }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <iconify-icon icon="ph:arrow-right-bold"></iconify-icon>
              {authenticated ? 'Open my dashboard' : "Get started — it's free"}
            </motion.button>
          </div>

          {/* Right — glowing dashboard card */}
          <div className="reveal reveal-delay-2">
            <div className="dash-card">
              <div className="dash-header">
                <div className="dash-header-row">
                  <div className="dash-logo" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/zapay-icon.svg" alt="" aria-hidden="true" width={16} height={16} style={{ display: 'block', flexShrink: 0, filter: 'brightness(0) invert(1)' }} />
                    <span>za<span style={{ color: 'rgba(255,255,255,.55)' }}>pay</span></span>
                  </div>
                  <div className="dash-badge">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                    Arc Testnet
                  </div>
                </div>
                <div className="dash-bal-lbl">Total balance</div>
                <div className="dash-bal">$1,247.50</div>
                <div className="dash-bal-sub">USDC · Arc Network</div>
              </div>
              <div className="dash-section-lbl">Recent activity</div>
              {([
                { dir: 'in',  icon: 'ph:arrow-down-left-bold', name: 'Sarah M.',  note: 'Freelance invoice · April',  amt: '+$340.00', time: '2m ago' },
                { dir: 'out', icon: 'ph:arrow-up-right-bold',  name: 'Alex K.',   note: 'Shared dinner · Saturday',   amt: '-$45.00',  time: '1h ago' },
                { dir: 'in',  icon: 'ph:arrow-down-left-bold', name: 'Maria L.',  note: 'Design retainer · March',    amt: '+$120.00', time: '3h ago' },
                { dir: 'out', icon: 'ph:arrow-up-right-bold',  name: 'Tom W.',    note: 'Split utilities',            amt: '-$89.50',  time: 'Yesterday' },
              ] as const).map(tx => (
                <div key={tx.name} className="dash-tx">
                  <div className={'dash-tx-icon ' + tx.dir}>
                    <Icon icon={tx.icon} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="dash-tx-name">{tx.name}</div>
                    <div className="dash-tx-sub">{tx.note}</div>
                  </div>
                  <div>
                    <div className={'dash-tx-amt ' + tx.dir}>{tx.amt}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)', textAlign: 'right', marginTop: 2 }}>{tx.time}</div>
                  </div>
                </div>
              ))}
              <div className="dash-footer">
                <button className="dash-action-btn primary">
                  <Icon icon="ph:paper-plane-right-bold" style={{ fontSize: 14 }} /> Send
                </button>
                <button className="dash-action-btn ghost">
                  <Icon icon="ph:link-bold" style={{ fontSize: 14 }} /> Create link
                </button>
                <button className="dash-action-btn ghost">
                  <Icon icon="ph:arrow-down-bold" style={{ fontSize: 14 }} /> Receive
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>
{/* â•â• HOW IT WORKS â•â• */}
      <section id="how" className="how-section">
        <div className="how-inner">
          <div className="reveal">
            <div className="how-tag"><iconify-icon icon="ph:steps-bold"></iconify-icon>How it works</div>
            <h2 className="how-h2">Three steps.<br/>Anyone can do it.</h2>
            <p className="how-sub">If you can send a WhatsApp message, you can use ZaPay.</p>
          </div>
          <div className="steps-grid">
            {[
              { num: 'STEP 01', icon: 'ph:link-bold', title: 'Create your link', desc: 'Enter an amount, add a note, choose how to receive — crypto wallet or bank account. Your link is ready in 30 seconds.', delay: '.05s' },
              { num: 'STEP 02', icon: 'ph:share-network-bold', title: 'Share it anywhere', desc: 'Send via WhatsApp, Telegram, X, or paste in your bio. Anyone with the link can pay — no app, no account needed.', delay: '.15s' },
              { num: 'STEP 03', icon: 'ph:lightning-bold', title: 'Get paid instantly', desc: 'Settlement in under a second on Arc. Receive USDC in your wallet or local currency straight to your bank or mobile money.', delay: '.25s' },
              { num: 'BONUS', icon: 'ph:repeat-bold', title: 'Reuse forever', desc: 'Your ZaPay never expires unless you set it to. One link in your bio, unlimited payments, zero maintenance.', delay: '.35s' },
            ].map(step => (
              <div key={step.title} className="step-card" style={{ transitionDelay: step.delay }}>
                <div className="step-num">{step.num}</div>
                <div className="step-icon"><iconify-icon icon={step.icon}></iconify-icon></div>
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â• FEES â•â• */}
      <section id="fees" className="fee-section">
        <div className="fee-center reveal">
          <div className="section-tag-orange"><iconify-icon icon="ph:percent-bold"></iconify-icon>Transparent fees</div>
          <h2 className="section-h2">Up to 7× cheaper<br/>than the old way</h2>
          <p className="section-sub">Zero fees for crypto-to-crypto. Small third-party fees for fiat — always shown upfront. No surprises ever.</p>
          <div className="fee-table">
            <div className="fee-head">
              <span>Payment type</span><span>Western Union</span><span>ZaPay</span>
            </div>
            <div className="fee-row hi">
              <span className="fee-method"><iconify-icon icon="ph:wallet-bold"></iconify-icon>Crypto to crypto</span>
              <span className="fee-them">5—8%</span>
              <span className="fee-us"><iconify-icon icon="ph:check-circle-bold"></iconify-icon>$0.00</span>
            </div>
            <div className="fee-row">
              <span className="fee-method"><iconify-icon icon="ph:credit-card-bold"></iconify-icon>Card to crypto wallet</span>
              <span className="fee-them">5—8%</span>
              <span className="fee-us">~1.5%</span>
            </div>
            <div className="fee-row">
              <span className="fee-method"><iconify-icon icon="ph:bank-bold"></iconify-icon>Bank to bank (global)</span>
              <span className="fee-them">5—8%</span>
              <span className="fee-us">~1—2%</span>
            </div>
            <div className="fee-row">
              <span className="fee-method"><iconify-icon icon="ph:device-mobile-bold"></iconify-icon>Mobile money (Africa)</span>
              <span className="fee-them">5—8%</span>
              <span className="fee-us">~0.5—1%</span>
            </div>
          </div>
        </div>
      </section>

      {/* â•â• TESTIMONIALS â•â• */}
      <section className="testi-section">
        <div className="testi-glow"></div>
        <div className="testi-inner">
          <div className="reveal" style={{ textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
            <div className="deep-label">What people say</div>
            <h2 className="deep-h2">Real people.<br/>Real payments.</h2>
          </div>
          <div className="testi-grid">
            <div className="testi-card" style={{ transitionDelay: '.05s' }}>
              <div className="testi-stars">
                {[1,2,3,4,5].map(s => <iconify-icon key={s} icon="ph:star-fill" className="tstar"></iconify-icon>)}
              </div>
              <p className="testi-text">"Sent my client a ZaPay on WhatsApp. They paid from the UK in under 2 minutes. No wallet questions, no fees eating my money. This is what payments should feel like."</p>
              <div className="testi-author">
                <div className="tav" style={{ background: 'rgba(37,92,180,0.15)', color: 'var(--o3)' }}>AO</div>
                <div><div className="testi-name">Adeola O.</div><div className="testi-role">Designer, Lagos</div></div>
                <div className="testi-flag"><Icon icon="flag:ng" style={{ fontSize: 22 }} /></div>
              </div>
            </div>
            <div className="testi-card" style={{ transitionDelay: '.15s' }}>
              <div className="testi-stars">
                {[1,2,3,4,5].map(s => <iconify-icon key={s} icon="ph:star-fill" className="tstar"></iconify-icon>)}
              </div>
              <p className="testi-text">"I used to dread paying freelancers abroad. ZaPay just works. I click, I pay, they receive in their local currency. Under a minute start to finish."</p>
              <div className="testi-author">
                <div className="tav" style={{ background: 'rgba(57,73,171,.2)', color: '#8090FF' }}>JM</div>
                <div><div className="testi-name">James M.</div><div className="testi-role">Founder, London</div></div>
                <div className="testi-flag"><Icon icon="flag:gb" style={{ fontSize: 22 }} /></div>
              </div>
            </div>
            <div className="testi-card" style={{ transitionDelay: '.25s' }}>
              <div className="testi-stars">
                {[1,2,3,4,5].map(s => <iconify-icon key={s} icon="ph:star-fill" className="tstar"></iconify-icon>)}
              </div>
              <p className="testi-text">"I don't know anything about crypto. My daughter told me to use ZaPay. I paid from my GTBank app and she got it instantly. I was shocked how easy it was."</p>
              <div className="testi-author">
                <div className="tav" style={{ background: 'rgba(194,24,91,.15)', color: '#FF80AB' }}>FC</div>
                <div><div className="testi-name">Funke C.</div><div className="testi-role">Business owner, Abuja</div></div>
                <div className="testi-flag"><Icon icon="flag:ng" style={{ fontSize: 22 }} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â•â• APP â•â• */}
      <section id="app" className="app-section">
        <div className="app-glow"></div>
        <div className="app-inner">
          <div className="reveal">
            <div className="app-eyebrow">Available on iOS & Android</div>
            <h2 className="app-h2">Your payments.<br/>In your pocket.</h2>
            <p className="app-sub">Track all your ZaPays, get notified the moment money lands, and manage payouts — all from one clean app.</p>
            <div className="app-btns">
              <a href="#" className="app-btn">
                <iconify-icon icon="ph:apple-logo-bold" className="app-btn-icon"></iconify-icon>
                <div><div className="app-btn-small">Download on the</div><div className="app-btn-big">App Store</div></div>
              </a>
              <a href="#" className="app-btn">
                <iconify-icon icon="ph:google-play-logo-bold" className="app-btn-icon"></iconify-icon>
                <div><div className="app-btn-small">Get it on</div><div className="app-btn-big">Google Play</div></div>
              </a>
            </div>
          </div>
          <div className="reveal reveal-delay-2">
            <div className="app-phone">
              <div className="app-screen">
                 <div className="app-s-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/zapay-icon.svg" alt="" aria-hidden="true" width={14} height={14} style={{ display: 'block', flexShrink: 0 }} />
                    <span>za<span style={{ color: 'var(--o1)' }}>pay</span></span>
                  </div>
                  <iconify-icon icon="ph:bell-bold" style={{ fontSize: '13px', color: 'rgba(255,255,255,.25)' }}></iconify-icon>
                 </div>
                <div className="app-s-lbl">Payments this month</div>
                <div className="app-tx">
                  {[
                    { initials: 'AK', color: 'rgba(37,92,180,.2)', textColor: 'var(--o3)', name: 'Alex K.', note: 'Freelance invoice', amt: '+$500' },
                    { initials: 'SR', color: 'rgba(255,180,0,.15)', textColor: '#FFB400', name: 'Sam R.', note: 'Consulting fee', amt: '+$150' },
                    { initials: 'JO', color: 'rgba(100,130,255,.15)', textColor: '#8090FF', name: 'Jordan O.', note: 'Monthly retainer', amt: '+$800' },
                  ].map(tx => (
                    <div key={tx.name} className="app-tx-item">
                      <div className="atav" style={{ background: tx.color, color: tx.textColor }}>{tx.initials}</div>
                      <div><div className="atx-name">{tx.name}</div><div className="atx-note">{tx.note}</div></div>
                      <div className="atx-amt">{tx.amt}</div>
                    </div>
                  ))}
                </div>
                <div className="app-total">
                  <span className="atotal-lbl">Total received</span>
                  <span className="atotal-val">$1,450</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â•â• TRUST â•â• */}
      <section className="trust-section reveal">
        <div className="trust-h3">Built on trusted infrastructure</div>
        <div className="trust-marquee-wrapper">
          <div className="trust-marquee">
            {[
              { name: 'Arc Network',  logoUrl: 'https://cdn.prod.website-files.com/685311a976e7c248b5dfde95/699e21e934a48439675361dc_arc-icon.svg',         fallbackDomain: 'arc.network',   icon: 'ph:lightning-fill',             bg: '#255CB4', fg: '#fff', href: 'https://arc.network' },
              { name: 'Circle',       logoUrl: 'https://cdn.prod.website-files.com/67116d0daddc92483c812e88/67116d0daddc92483c812f72_Circle%20Logo.avif',  fallbackDomain: 'circle.com',    icon: 'ph:currency-circle-dollar-fill',bg: '#00D395', fg: '#fff', href: 'https://circle.com' },
              { name: 'Privy',        logoUrl: 'https://cdn.prod.website-files.com/68af181813eec5493447a1ae/68fd1312a4091121d979e970_privy-icon.png',       fallbackDomain: 'privy.io',      icon: 'ph:shield-check-fill',          bg: '#7B3FE4', fg: '#fff', href: 'https://privy.io' },
              { name: 'Pimlico',      logoUrl: 'https://cdn.prod.website-files.com/68af181813eec5493447a1ae/68fd13ab4bb4bb22a0b54c12_pimlico-icon.svg',     fallbackDomain: 'pimlico.io',    icon: 'ph:gas-pump-fill',              bg: '#3B82F6', fg: '#fff', href: 'https://pimlico.io' },
              { name: 'Ramp Network', logoUrl: 'https://cdn.prod.website-files.com/68af181813eec5493447a1ae/68fbea83f9fa8fe4a0a81be6_RAMP_logo_Digital__icon.svg', fallbackDomain: 'ramp.network', icon: 'ph:arrows-left-right-bold',  bg: '#6C47FF', fg: '#fff', href: 'https://ramp.network' },
              { name: 'Yellow Card',  logoUrl: 'https://logo.clearbit.com/yellowcard.io',                                                                    fallbackDomain: 'yellowcard.io', icon: 'ph:credit-card-fill',           bg: '#F5C518', fg: '#1a1a1a', href: 'https://yellowcard.io' },
            ].concat([
              { name: 'Arc Network',  logoUrl: 'https://cdn.prod.website-files.com/685311a976e7c248b5dfde95/699e21e934a48439675361dc_arc-icon.svg',         fallbackDomain: 'arc.network',   icon: 'ph:lightning-fill',             bg: '#255CB4', fg: '#fff', href: 'https://arc.network' },
              { name: 'Circle',       logoUrl: 'https://cdn.prod.website-files.com/67116d0daddc92483c812e88/67116d0daddc92483c812f72_Circle%20Logo.avif',  fallbackDomain: 'circle.com',    icon: 'ph:currency-circle-dollar-fill',bg: '#00D395', fg: '#fff', href: 'https://circle.com' },
              { name: 'Privy',        logoUrl: 'https://cdn.prod.website-files.com/68af181813eec5493447a1ae/68fd1312a4091121d979e970_privy-icon.png',       fallbackDomain: 'privy.io',      icon: 'ph:shield-check-fill',          bg: '#7B3FE4', fg: '#fff', href: 'https://privy.io' },
              { name: 'Pimlico',      logoUrl: 'https://cdn.prod.website-files.com/68af181813eec5493447a1ae/68fd13ab4bb4bb22a0b54c12_pimlico-icon.svg',     fallbackDomain: 'pimlico.io',    icon: 'ph:gas-pump-fill',              bg: '#3B82F6', fg: '#fff', href: 'https://pimlico.io' },
              { name: 'Ramp Network', logoUrl: 'https://cdn.prod.website-files.com/68af181813eec5493447a1ae/68fbea83f9fa8fe4a0a81be6_RAMP_logo_Digital__icon.svg', fallbackDomain: 'ramp.network', icon: 'ph:arrows-left-right-bold',  bg: '#6C47FF', fg: '#fff', href: 'https://ramp.network' },
              { name: 'Yellow Card',  logoUrl: 'https://logo.clearbit.com/yellowcard.io',                                                                    fallbackDomain: 'yellowcard.io', icon: 'ph:credit-card-fill',           bg: '#F5C518', fg: '#1a1a1a', href: 'https://yellowcard.io' },
            ]).map((p, i) => (
              <a key={`${p.name}-${i}`} className="trust-item" href={p.href} target="_blank" rel="noopener noreferrer">
                <div className="trust-item-logo" style={(p.name === 'Arc Network' || p.name === 'Circle') ? { background: p.bg } : {}}>
                  <TrustLogo logoUrl={p.logoUrl} fallbackDomain={p.fallbackDomain} name={p.name} icon={p.icon} bg={p.bg} fg={p.fg} />
                </div>
                <span className="trust-item-name">{p.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* â•â• FINAL CTA â•â• */}
      <section className="final-section">
        <div className="final-glow"></div>
        <div className="final-inner reveal">
          <h2 className="final-h2">Ready to get paid<br/>the <em>right way</em>?</h2>
          <p className="final-sub">Create your first ZaPay in 30 seconds. Free forever for crypto-to-crypto.</p>
          <div className="final-btns">
            <motion.button onClick={authenticated ? () => router.push('/dashboard') : () => router.push('/create')} className="btn-final-fill" style={{ cursor: 'pointer', border: 'none' }} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
              <iconify-icon icon="ph:link-bold"></iconify-icon>
              Create a ZaPay link — Free
            </motion.button>
            <a href="#how" className="btn-final-ghost"><iconify-icon icon="ph:question-bold"></iconify-icon>Learn more</a>
          </div>
        </div>
      </section>

      {/* â•â• FOOTER â•â• */}
      <footer>
        <div className="footer-top">
          <div>
            <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/zapay-icon.svg" alt="" aria-hidden="true" width={22} height={22} style={{ display: 'block', flexShrink: 0 }} />
            <span>za<span style={{ color: 'var(--o1)' }}>pay</span></span>
          </div>
            <p className="footer-desc">Send and receive money globally with just a link. Powered by Arc, settled in under a second.</p>
          </div>
          <div>
            <div className="footer-col-title">Product</div>
            <div className="footer-links">
              <a href="#">How it works</a><a href="#">Features</a><a href="#">Fees</a><a href="#">Get the app</a>
            </div>
          </div>
          <div>
            <div className="footer-col-title">Company</div>
            <div className="footer-links">
              <a href="#">About</a><a href="#">Blog</a><a href="#">Careers</a><a href="mailto:team@zapay.xyz">Contact</a>
            </div>
          </div>
          <div>
            <div className="footer-col-title">Legal</div>
            <div className="footer-links">
              <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Security</a><a href="#">Cookies</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2026 ZaPay. All rights reserved.</div>
          <div className="footer-arc">Powered by <span>Arc Network</span> & Circle USDC</div>
        </div>
      </footer>
      <OnboardingTour />
    </div>
  )
}

