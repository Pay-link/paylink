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
  const didMountRef = useRef(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [linksRes, txsRes] = await Promise.all([
          supabase.from('payment_links').select('id', { count: 'exact', head: true }),
          supabase.from('transactions').select('id', { count: 'exact', head: true }),
        ])
        setLiveStats({
          links: linksRes.count ?? 0,
          txs: txsRes.count ?? 0,
        })
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
      const count = Math.min(Math.floor(W * H / 8000), 140)
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
      requestAnimationFrame(drawParticles)
    }
    drawParticles()

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
    <div style={{ background: '#09090E', color: '#fff' }}>
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
.nav-logo{font-family:var(--font-display);font-size:22px;font-weight:900;color:#fff;letter-spacing:-.04em;text-decoration:none}
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
/* Phone mockup shared styles */
.fp-nav{display:flex;justify-content:space-between;align-items:center;padding:2px 14px 10px}
.fp-logo{font-family:var(--font-display);font-size:14px;font-weight:900;color:#fff;letter-spacing:-.04em}
.fp-logo span{color:var(--o1)}
.fp-body{padding:0 12px 18px}
.fp-card{background:var(--o1);border-radius:18px;padding:16px 14px;margin-bottom:10px;position:relative;overflow:hidden}
.fp-card::after{content:'';position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(rgba(255,255,255,.08),transparent);border-radius:18px 18px 0 0;pointer-events:none}
.fp-card-lbl{font-size:8px;color:rgba(255,255,255,.65);margin-bottom:6px;text-transform:uppercase;letter-spacing:.1em;font-weight:600}
.fp-amount{font-family:var(--font-display);font-size:30px;font-weight:900;color:#fff;letter-spacing:-.04em;margin-bottom:4px}
.fp-note{font-size:9px;color:rgba(255,255,255,.65)}
.fp-tog-row{display:flex;gap:5px;margin-bottom:9px}
.fp-tog{flex:1;padding:8px 4px;border-radius:10px;text-align:center;font-size:9px;font-weight:600;border:0.5px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04);color:rgba(255,255,255,.3)}
.fp-tog.on{background:rgba(37,92,180,.18);border-color:rgba(37,92,180,.4);color:var(--o3)}
.fp-note-row{background:rgba(255,255,255,.05);border:0.5px solid rgba(255,255,255,.07);border-radius:10px;padding:9px 11px;margin-bottom:9px;display:flex;align-items:center;gap:6px;font-size:9px;color:rgba(255,255,255,.35)}
.fp-btn{width:100%;background:linear-gradient(135deg,var(--o3),var(--o1));color:#fff;border:none;border-radius:10px;padding:11px;font-family:var(--font-display);font-size:11px;font-weight:800;cursor:pointer;letter-spacing:-.01em}
.fp2-body{padding:14px 12px 18px;display:flex;flex-direction:column;align-items:center;text-align:center}
.fp2-avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--o3),var(--o1));display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:14px;font-weight:800;color:#fff;margin:10px auto 8px;box-shadow:0 4px 16px rgba(37,92,180,.4)}
.fp2-name{font-family:var(--font-display);font-size:13px;font-weight:700;color:#fff;margin-bottom:2px}
.fp2-note{font-size:9px;color:rgba(255,255,255,.45);margin-bottom:14px}
.fp2-amount{font-family:var(--font-display);font-size:32px;font-weight:900;color:#fff;letter-spacing:-.04em;margin-bottom:16px}
.fp2-btn{width:100%;background:linear-gradient(135deg,var(--o3),var(--o1));color:#fff;border:none;border-radius:10px;padding:11px;font-family:var(--font-display);font-size:11px;font-weight:800;cursor:pointer;margin-bottom:8px;box-shadow:0 4px 16px rgba(37,92,180,.35)}
.fp2-sub{font-size:8px;color:rgba(255,255,255,.25);letter-spacing:.05em}
/* Float tags */
.float-tag{position:absolute;background:rgba(12,18,38,0.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:0.5px solid rgba(37,92,180,.35);border-radius:12px;padding:8px 14px;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 8px 24px rgba(0,0,0,.55),0 0 20px rgba(37,92,180,.14);z-index:10;animation:tagFloat 4s ease-in-out infinite}
.ftag-val{font-family:var(--font-display);font-size:16px;font-weight:900;color:#fff;letter-spacing:-.03em;line-height:1}
.ftag-lbl{font-size:9px;color:rgba(255,255,255,.4);font-weight:500;letter-spacing:.03em}
.ft1{bottom:80px;left:-20px;animation-delay:.8s}
.ft2{top:80px;right:-24px}
@keyframes tagFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
/* Volume buttons (left side) via pseudo-element on fp-shell */

/* ── Phone frame (SVG asset) ── */
/* SVG 722×1282 — screen rect at x=119.246 y=71.675 w=484.683 h=1020.64 */
.pf-main,.pf-secondary{position:absolute;display:block}
.pf-main{width:250px;left:50%;transform:translateX(-50%);top:0;z-index:2;animation:pfFloat 5s ease-in-out infinite}
.pf-secondary{width:180px;right:-10px;top:120px;z-index:1;animation:pfFloat2 6s 0.5s ease-in-out infinite}
@keyframes pfFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-14px)}}
@keyframes pfFloat2{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.pf-img{width:100%;display:block;pointer-events:none;user-select:none}
.pf-screen{
  position:absolute;
  left:16.52%;top:5.59%;
  width:67.13%;height:79.61%;
  overflow:hidden;
  border-radius:10.12%;
  background:#09090E;
  display:flex;flex-direction:column;
}
.pf-status{display:flex;justify-content:space-between;padding:8px 12px 4px;font-size:8px;color:rgba(255,255,255,.35);font-weight:600;margin-top:6%}
.phones-section{
  background:var(--page2);padding:80px 5% 100px;
  position:relative;overflow:hidden;
}
.phones-bg-glow{position:absolute;pointer-events:none;border-radius:50%;filter:blur(100px)}
.pb-glow1{width:600px;height:400px;background:#255CB4;opacity:.07;top:0;left:50%;transform:translateX(-50%)}
.phones-inner{
  position:relative;z-index:1;
  display:grid;grid-template-columns:1fr 1fr;
  gap:64px;align-items:center;max-width:1100px;margin:0 auto;
}
.phones-right{
  display:flex;justify-content:center;align-items:center;
  position:relative;height:520px;
  perspective:1200px;transform-style:preserve-3d;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HOW IT WORKS — dark with orange
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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
.trust-section{background:var(--page2);padding:56px 5%;text-align:center;border-top:0.5px solid var(--border)}
.trust-h3{font-family:var(--font-display);font-size:12px;font-weight:700;color:var(--ink3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:24px}
.trust-pills{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}
.trust-pill{
  display:flex;align-items:center;gap:12px;
  background:rgba(255,255,255,.05);border:0.5px solid var(--border);
  border-radius:14px;padding:12px 16px;min-width:190px;
  transition:all .2s;cursor:pointer;text-decoration:none;
}
.trust-pill:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);transform:translateY(-2px);}
.trust-pill-logo{width:36px;height:36px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;padding:4px;}
.trust-pill-name{font-size:13px;font-weight:600;color:var(--ink);flex:1;text-align:left;white-space:nowrap}

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
  .hero{padding:40px 5%}
  .nav-links{display:none}
  .btn-pill{padding:7px 14px!important;font-size:12px!important}
  nav{padding:0 16px!important;grid-template-columns:auto 1fr auto!important}
  .hero-stats{gap:16px}
  .h-stat-div{display:none}
  .footer-top{grid-template-columns:1fr}
  .stats-bar{flex-direction:column;gap:0}
  .sb-item{border-right:none;border-bottom:0.5px solid var(--border);width:100%;padding:16px 0}
  .sb-item:last-child{border-bottom:none}
  .hero-ctas{flex-wrap:nowrap;gap:8px}
  .btn-hero-orange,.btn-hero-ghost{flex:1;padding:13px 16px!important;font-size:14px!important;justify-content:center}
}
` }} />

      {/* NAV */}
      <nav>
        <a href="#" className="nav-logo">za<span>pay</span></a>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#fees">Fees</a>
          <a href="#app">App</a>
        </div>
        <div className="nav-right">
          {authenticated ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => router.push('/dashboard')} className="btn-pill btn-orange" style={{ cursor: 'pointer' }}>Dashboard</button>
              <button onClick={logout} className="btn-pill btn-ghost" style={{ cursor: 'pointer' }}>Log out</button>
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={login} className="btn-pill btn-ghost" style={{ cursor: 'pointer' }}>Sign in</button>
              <button onClick={() => router.push('/create')} className="btn-pill btn-orange" style={{ cursor: 'pointer' }}>Create link</button>
            </span>
          )}
        </div>
      </nav>

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

      {/* â•â• EXPERIENCE (phones) â•â• */}
      <section className="phones-section">
        <div className="phones-bg-glow pb-glow1"></div>
        <div className="phones-inner">
          <div className="phones-left reveal">
            <div className="deep-label">The experience</div>
            <h2 className="deep-h2" style={{ fontSize: 'clamp(28px,4vw,52px)' }}>Two screens.<br/>That's the<br/><em>whole app.</em></h2>
            <p className="deep-sub" style={{ marginBottom: '32px' }}>One for creating your link. One for paying. Designed so obsessively that our beta users called it "the cleanest payments app they'd ever used."</p>
            <motion.button onClick={authenticated ? () => router.push('/dashboard') : () => router.push('/create')} className="btn-final-fill" style={{ fontSize: '14px', padding: '13px 26px', cursor: 'pointer', border: 'none' }} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
              <iconify-icon icon="ph:link-bold"></iconify-icon>
              Create a ZaPay link — Free
            </motion.button>
          </div>
          <div className="phones-right reveal reveal-delay-2">
            {/* Main phone — creator view */}
            <div className="pf-main">
              <img src="/phone-frame.svg" alt="" className="pf-img" draggable={false} />
              <div className="pf-screen">
                <div className="pf-status"><span>9:41</span><span style={{display:'flex',gap:3,alignItems:'center'}}><Icon icon="ph:wifi-high-bold" width={9}/><Icon icon="ph:battery-charging-bold" width={9}/></span></div>
                <div className="fp-nav">
                  <div className="fp-logo">za<span>pay</span></div>
                  <Icon icon="ph:user-circle-bold" style={{ fontSize: '16px', color: 'rgba(255,255,255,.25)' }} />
                </div>
                <div className="fp-body">
                  <div className="fp-card">
                    <div className="fp-card-lbl">Amount to receive</div>
                    <div className="fp-amount">$250.00</div>
                    <div className="fp-note">Logo design — April invoice</div>
                  </div>
                  <div className="fp-tog-row">
                    <div className="fp-tog on"><Icon icon="ph:wallet-bold" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }} />Crypto</div>
                    <div className="fp-tog"><Icon icon="ph:bank-bold" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }} />Bank</div>
                  </div>
                  <div className="fp-note-row"><Icon icon="ph:pencil-bold" style={{ fontSize: '10px' }} />Add a note for sender...</div>
                  <button className="fp-btn">Generate link →</button>
                </div>
              </div>
            </div>
            {/* Secondary phone — payer view */}
            <div className="pf-secondary">
              <img src="/phone-frame.svg" alt="" className="pf-img" draggable={false} />
              <div className="pf-screen">
                <div className="pf-status"><span>9:41</span><span style={{display:'flex',gap:3,alignItems:'center'}}><Icon icon="ph:wifi-high-bold" width={9}/><Icon icon="ph:battery-charging-bold" width={9}/></span></div>
                <div className="fp-nav"><div className="fp-logo">za<span>pay</span></div><span></span></div>
                <div className="fp2-body">
                  <div className="fp2-avatar">AK</div>
                  <div className="fp2-name">Alex K.</div>
                  <div className="fp2-note">Freelance invoice — April</div>
                  <div className="fp2-amount">$120</div>
                  <button className="fp2-btn">Pay now →</button>
                  <div className="fp2-sub">Secured · Powered by Arc</div>
                </div>
              </div>
            </div>
            <div className="float-tag ft1">
              <div className="ftag-val">$0.00</div>
              <div className="ftag-lbl">Gas fee</div>
            </div>
            <div className="float-tag ft2">
              <div className="ftag-val">0.3s</div>
              <div className="ftag-lbl">Settled</div>
            </div>
          </div>
        </div>
      </section>{/* â•â• HOW IT WORKS â•â• */}
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
          <h2 className="section-h2">Up to 7Ã— cheaper<br/>than the old way</h2>
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
                <div className="testi-flag">ðŸ‡³ðŸ‡¬</div>
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
                <div className="testi-flag">ðŸ‡¬ðŸ‡§</div>
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
                <div className="testi-flag">ðŸ‡³ðŸ‡¬</div>
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
                <div className="app-s-header">za<span>pay</span><iconify-icon icon="ph:bell-bold" style={{ fontSize: '13px', color: 'rgba(255,255,255,.25)' }}></iconify-icon></div>
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
        <div className="trust-pills">
          {([
            { name: 'Arc Network',  logoUrl: 'https://cdn.prod.website-files.com/685311a976e7c248b5dfde95/699e21e934a48439675361dc_arc-icon.svg',         fallbackDomain: 'arc.network',   icon: 'ph:lightning-fill',             bg: '#255CB4', fg: '#fff', href: 'https://arc.network' },
            { name: 'Circle',       logoUrl: 'https://cdn.prod.website-files.com/67116d0daddc92483c812e88/67116d0daddc92483c812f72_Circle%20Logo.avif',  fallbackDomain: 'circle.com',    icon: 'ph:currency-circle-dollar-fill',bg: '#00D395', fg: '#fff', href: 'https://circle.com' },
            { name: 'Privy',        logoUrl: 'https://cdn.prod.website-files.com/68af181813eec5493447a1ae/68fd1312a4091121d979e970_privy-icon.png',       fallbackDomain: 'privy.io',      icon: 'ph:shield-check-fill',          bg: '#7B3FE4', fg: '#fff', href: 'https://privy.io' },
            { name: 'Pimlico',      logoUrl: 'https://cdn.prod.website-files.com/68af181813eec5493447a1ae/68fd13ab4bb4bb22a0b54c12_pimlico-icon.svg',     fallbackDomain: 'pimlico.io',    icon: 'ph:gas-pump-fill',              bg: '#3B82F6', fg: '#fff', href: 'https://pimlico.io' },
            { name: 'Ramp Network', logoUrl: 'https://cdn.prod.website-files.com/68af181813eec5493447a1ae/68fbea83f9fa8fe4a0a81be6_RAMP_logo_Digital__icon.svg', fallbackDomain: 'ramp.network', icon: 'ph:arrows-left-right-bold',  bg: '#6C47FF', fg: '#fff', href: 'https://ramp.network' },
            { name: 'Yellow Card',  logoUrl: 'https://logo.clearbit.com/yellowcard.io',                                                                    fallbackDomain: 'yellowcard.io', icon: 'ph:credit-card-fill',           bg: '#F5C518', fg: '#1a1a1a', href: 'https://yellowcard.io' },
          ] as const).map(p => (
            <a key={p.name} className="trust-pill" href={p.href} target="_blank" rel="noopener noreferrer">
              <div className="trust-pill-logo">
                <TrustLogo logoUrl={p.logoUrl} fallbackDomain={p.fallbackDomain} name={p.name} icon={p.icon} bg={p.bg} fg={p.fg} />
              </div>
              <span className="trust-pill-name">{p.name}</span>
              <Icon icon="ph:arrow-up-right-bold" style={{ fontSize: 14, color: 'var(--ink4)', flexShrink: 0 }} />
            </a>
          ))}
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
            <div className="footer-logo">za<span>pay</span></div>
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
              <a href="#">About</a><a href="#">Blog</a><a href="#">Careers</a><a href="#">Contact</a>
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
    </div>
  )
}

