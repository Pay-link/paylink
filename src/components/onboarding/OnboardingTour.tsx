'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'

interface OnboardingStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon: string;
}

const LANDING_STEPS: OnboardingStep[] = [
  {
    target: 'body',
    title: 'Welcome to ZaPay',
    description: 'Send and receive payments globally in seconds, with zero platform fees. ZaPay bridges the gap between traditional banking and instant digital dollar settlement, so you can manage global transfers without needing any prior blockchain or cryptocurrency experience.',
    position: 'center',
    icon: 'ph:hand-waving-bold'
  },
  {
    target: '#tour-landing-actions',
    title: 'Access and Get Started',
    description: 'To begin, choose an action: click Create Link to generate a customized payment link for a client or friend, or click Sign In to access your dashboard if you already have an account.',
    position: 'bottom',
    icon: 'ph:user-circle-bold'
  }
]

const DASHBOARD_STEPS: OnboardingStep[] = [
  {
    target: '#tour-dash-createlink, #tour-dash-createlink-mobile',
    title: 'Create a Payment Link',
    description: 'Click here to generate a reusable payment link. You can share this link via chat, email, or social media. Anyone who clicks it can pay you instantly using their card, bank account, or crypto wallet.',
    position: 'right',
    icon: 'ph:link-bold'
  },
  {
    target: '#tour-dash-send, #tour-dash-send-mobile',
    title: 'Send Money Worldwide',
    description: 'Click here to transfer funds directly to any recipient. Simply enter their ZaPay link or wallet address to initiate an instant, secure transfer.',
    position: 'right',
    icon: 'ph:paper-plane-right-bold'
  },
  {
    target: '#tour-dash-faucet, #tour-dash-faucet-mobile',
    title: 'Claim Free Test Funds',
    description: 'As we are currently operating on a secure test network, use this Faucet to claim free test USDC. This allows you to experience the full features of sending and receiving payments without using real funds.',
    position: 'right',
    icon: 'ph:drop-bold'
  },
  {
    target: '#tour-dash-links',
    title: 'Manage Active Links',
    description: 'Track and control all your active payment links. Copy, share, or edit links, view transaction stats, and see how much you have received from each link.',
    position: 'right',
    icon: 'ph:link-simple-bold'
  },
  {
    target: '#tour-dash-history, #tour-dash-history-mobile',
    title: 'Your Payment Ledger',
    description: 'View a complete, real-time ledger of your incoming and outgoing transfers. Click any entry to inspect its status, timestamps, and block explorer receipt details.',
    position: 'right',
    icon: 'ph:clock-countdown-bold'
  }
]

export function OnboardingTour() {
  const router = useRouter()
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isMobile, setIsMobile] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const steps = pathname === '/dashboard' ? DASHBOARD_STEPS : LANDING_STEPS
  const activeStep = steps[currentStepIndex]

  // Detect visibility of elements in DOM
  const getVisibleElement = (selector: string): HTMLElement | null => {
    if (selector === 'body') return document.body
    const elements = document.querySelectorAll(selector)
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement
      const style = window.getComputedStyle(el)
      if (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        el.offsetWidth > 0 &&
        el.offsetHeight > 0
      ) {
        return el
      }
    }
    return document.querySelector(selector)
  }

  // Monitor Window size, theme and onboarding states
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Resize handler
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (active && activeStep) {
        const el = getVisibleElement(activeStep.target)
        if (el) setRect(el.getBoundingClientRect())
      }
    }

    // Theme observer
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme')
      setTheme(currentTheme === 'light' ? 'light' : 'dark')
    })

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    
    // Initial runs
    const currentTheme = document.documentElement.getAttribute('data-theme')
    setTheme(currentTheme === 'light' ? 'light' : 'dark')
    setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
    }
  }, [active, activeStep])

  // Trigger tour based on local storage & route pathname
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkTourState = () => {
      const isCompleted = localStorage.getItem('zp-tour-completed') === 'true'
      if (isCompleted) {
        setActive(false)
        return
      }

      if (pathname === '/') {
        // Start landing tour automatically if not completed
        setActive(true)
        setCurrentStepIndex(0)
      } else if (pathname === '/dashboard') {
        const pendingDashboard = localStorage.getItem('zp-tour-pending-dashboard') === 'true'
        if (pendingDashboard) {
          setActive(true)
          setCurrentStepIndex(0)
        }
      }
    }

    // Delay slightly to allow DOM mount
    const t = setTimeout(checkTourState, 600)
    return () => clearTimeout(t)
  }, [pathname])

  // Track coordinates of the current target element
  useEffect(() => {
    if (!active || !activeStep) {
      setRect(null)
      return
    }

    const updateRect = () => {
      const el = getVisibleElement(activeStep.target)
      if (el) {
        // Smoothly scroll to target on dashboard if it is not body or landing actions
        if (pathname === '/dashboard' && activeStep.target !== 'body') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        setTimeout(() => {
          const bounding = el.getBoundingClientRect()
          setRect(bounding)
        }, 100)
      } else {
        setRect(null)
      }
    }

    updateRect()
    window.addEventListener('scroll', updateRect)
    return () => window.removeEventListener('scroll', updateRect)
  }, [active, currentStepIndex, pathname, activeStep])

  if (!active || !activeStep) return null

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      // Finished
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setActive(false)
    if (typeof window !== 'undefined') {
      if (pathname === '/') {
        // Save pending dashboard state
        localStorage.setItem('zp-tour-pending-dashboard', 'true')
      } else {
        // Full complete
        localStorage.setItem('zp-tour-completed', 'true')
        localStorage.removeItem('zp-tour-pending-dashboard')
      }
    }
  }

  // Spotlight Cutout CSS Calculation
  const cutoutPadding = 6
  const cutoutLeft = rect ? rect.left - cutoutPadding : 0
  const cutoutTop = rect ? rect.top - cutoutPadding : 0
  const cutoutWidth = rect ? rect.width + cutoutPadding * 2 : 0
  const cutoutHeight = rect ? rect.height + cutoutPadding * 2 : 0

  // Determine Popover Position relative to Target Bounding Rect
  const getPopoverStyle = (): React.CSSProperties => {
    if (!rect || activeStep.position === 'center' || activeStep.target === 'body') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isMobile ? 'calc(100% - 32px)' : '420px',
        zIndex: 100000,
      }
    }

    const gap = 14
    let top = 0
    let left = 0
    let transform = ''

    if (isMobile) {
      // On mobile collapse to bottom drawer or screen center card for maximum viewing room
      return {
        position: 'fixed',
        bottom: '20px',
        left: '16px',
        right: '16px',
        width: 'calc(100% - 32px)',
        zIndex: 100000,
      }
    }

    // Desktop Absolute Floating Bubble Math
    switch (activeStep.position) {
      case 'bottom':
        top = rect.bottom + gap
        left = rect.left + rect.width / 2
        transform = 'translateX(-50%)'
        break
      case 'top':
        top = rect.top - gap
        left = rect.left + rect.width / 2
        transform = 'translate(-50%, -100%)'
        break
      case 'left':
        top = rect.top + rect.height / 2
        left = rect.left - gap
        transform = 'translate(-100%, -50%)'
        break
      case 'right':
      default:
        top = rect.top + rect.height / 2
        left = rect.right + gap
        transform = 'translateY(-50%)'
        break
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      transform,
      width: '360px',
      zIndex: 100000,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    }
  }

  // Design Theme Palette matching
  // Dark Theme -> Light popup
  // Light Theme -> Dark popup
  const bubbleBg = theme === 'dark' ? '#FFFFFF' : '#0F111A';
  const bubbleTextColor = theme === 'dark' ? '#0A0A14' : '#FFFFFF';
  const bubbleSubColor = theme === 'dark' ? '#5A5A72' : '#9898B0';
  const bubbleBorder = theme === 'dark' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';
  const bubbleShadow = theme === 'dark' 
    ? '0 12px 36px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)' 
    : '0 12px 36px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)';

  return (
    <>
      {/* Dimming Mask Backdrop Overlay with Cutout */}
      <svg
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          pointerEvents: 'auto',
        }}
      >
        <defs>
          <mask id="onboarding-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && activeStep.target !== 'body' && (
              <rect
                x={cutoutLeft}
                y={cutoutTop}
                width={cutoutWidth}
                height={cutoutHeight}
                rx={10}
                ry={10}
                fill="black"
                style={{
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            )}
          </mask>
        </defs>
        {/* Semi-transparent dark background */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(5, 5, 10, 0.65)"
          mask="url(#onboarding-spotlight-mask)"
          style={{ backdropFilter: 'blur(1.5px)' }}
        />
      </svg>

      {/* Elegant Walkthrough Popover Modal Bubble */}
      <div
        ref={popoverRef}
        style={{
          background: bubbleBg,
          color: bubbleTextColor,
          borderRadius: '16px',
          border: `1px solid ${bubbleBorder}`,
          boxShadow: bubbleShadow,
          padding: '20px 24px',
          fontFamily: 'var(--font)',
          ...getPopoverStyle(),
        }}
      >
        {/* Onboarding Header with Clean Iconify Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: theme === 'dark' ? 'rgba(37,92,180,0.08)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${bubbleBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--g1)',
              flexShrink: 0,
            }}
          >
            <Icon icon={activeStep.icon} style={{ fontSize: 18, color: theme === 'dark' ? '#255CB4' : '#6a9be4' }} />
          </div>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-.02em' }}>
            {activeStep.title}
          </h4>
          <button
            onClick={handleSkip}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: bubbleSubColor,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Skip Tour"
          >
            <Icon icon="ph:x-bold" style={{ fontSize: 16 }} />
          </button>
        </div>

        {/* Description Body text */}
        <p style={{ margin: '0 0 20px', fontSize: 13, lineHeight: '1.6', color: bubbleSubColor }}>
          {activeStep.description}
        </p>

        {/* Footer controls: Back, Progress Dots, Next */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Back button */}
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            style={{
              background: 'transparent',
              border: 'none',
              color: currentStepIndex === 0 ? 'transparent' : bubbleSubColor,
              cursor: currentStepIndex === 0 ? 'default' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              padding: '6px 12px',
              fontFamily: 'var(--font)',
              transition: 'opacity 0.2s',
            }}
          >
            Back
          </button>

          {/* Stepper Dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {steps.map((_, idx) => (
              <span
                key={idx}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: idx === currentStepIndex 
                    ? (theme === 'dark' ? '#255CB4' : '#6a9be4') 
                    : (theme === 'dark' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)'),
                  transition: 'background 0.25s',
                }}
              />
            ))}
          </div>

          {/* Next / Finish Button */}
          <button
            onClick={handleNext}
            style={{
              background: theme === 'dark' ? '#255CB4' : '#FFFFFF',
              color: theme === 'dark' ? '#FFFFFF' : '#0A0A14',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              boxShadow: theme === 'dark' ? 'none' : '0 2px 6px rgba(0,0,0,0.15)',
              transition: 'opacity 0.2s',
            }}
          >
            {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </>
  )
}
