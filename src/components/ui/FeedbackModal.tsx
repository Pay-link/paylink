'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Icon } from '@iconify/react'

export function FeedbackModal() {
  const { user, authenticated } = usePrivy()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('General Feedback')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Listen to the custom event to open the modal
  useEffect(() => {
    const handleOpen = () => {
      setOpen(true)
      setSuccess(false)
      setError('')
      setMessage('')
      // Pre-fill email from Privy if available
      if (authenticated && user?.email?.address) {
        setEmail(user.email.address)
      } else {
        setEmail('')
      }
    }
    window.addEventListener('open-feedback', handleOpen)
    return () => window.removeEventListener('open-feedback', handleOpen)
  }, [authenticated, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !message.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
          email: email.trim(),
          category,
          message: message.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to submit feedback. Please try again.')
      }
    } catch {
      setError('An error occurred. Please check your internet connection.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(9, 9, 14, 0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
      animation: 'fadeIn 0.25s ease-out forwards',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        position: 'relative',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--g-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--g1)',
              fontSize: 20,
            }}>
              <Icon icon="ph:chat-teardrop-text-bold" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>Send Feedback</h2>
              <p style={{ fontSize: 12, color: 'var(--ink3)', margin: '2px 0 0' }}>We'd love to hear from you</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink3)',
              padding: 4,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--page)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <Icon icon="ph:x-bold" style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Content */}
        {!success ? (
          <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px' }}>
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: 'rgba(229,57,53,0.08)',
                border: '1.5px solid rgba(229,57,53,0.2)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 18,
              }}>
                <Icon icon="ph:warning-circle-bold" style={{ fontSize: 18, color: '#E53935', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: '#E53935', lineHeight: 1.4 }}>{error}</div>
              </div>
            )}

            {/* Email Field */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)', marginBottom: 8, display: 'block' }}>Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 12,
                  background: 'var(--page)',
                  border: '1.5px solid var(--border)',
                  padding: '0 16px',
                  fontFamily: 'var(--font)',
                  fontSize: 14,
                  color: 'var(--ink)',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--g1)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Category Dropdown */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)', marginBottom: 8, display: 'block' }}>Category</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 12,
                    background: 'var(--page)',
                    border: '1.5px solid var(--border)',
                    padding: '0 40px 0 16px',
                    fontFamily: 'var(--font)',
                    fontSize: 14,
                    color: 'var(--ink)',
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="General Feedback">General Feedback</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Other">Other</option>
                </select>
                <Icon
                  icon="ph:caret-down-bold"
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 14,
                    color: 'var(--ink3)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>

            {/* Message Textarea */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink2)', margin: 0 }}>Your Message</label>
                <span style={{ fontSize: 11, color: 'var(--ink4)' }}>{message.length}/500</span>
              </div>
              <textarea
                required
                maxLength={500}
                placeholder="Tell us what's on your mind..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: '100%',
                  height: 120,
                  borderRadius: 12,
                  background: 'var(--page)',
                  border: '1.5px solid var(--border)',
                  padding: '12px 16px',
                  fontFamily: 'var(--font)',
                  fontSize: 14,
                  color: 'var(--ink)',
                  outline: 'none',
                  resize: 'none',
                  transition: 'all 0.2s',
                  lineHeight: 1.5,
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--g1)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: 'var(--g1)',
                color: '#fff',
                border: 'none',
                borderRadius: 100,
                padding: '15px',
                fontFamily: 'var(--font)',
                fontSize: 15,
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(37,92,180,0.2)',
                transition: 'all 0.2s',
              }}
            >
              <Icon icon={submitting ? 'ph:spinner-bold' : 'ph:paper-plane-right-bold'} style={submitting ? { animation: 'spin 1s linear infinite' } : {}} />
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        ) : (
          /* Success Screen */
          <div style={{ padding: '40px 28px', textAlign: 'center' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--g-soft)',
              border: '2px solid var(--border-g)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              color: 'var(--g1)',
              margin: '0 auto 20px',
              animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            }}>
              <Icon icon="ph:check-bold" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Thank You!</h3>
            <p style={{ fontSize: 14, color: 'var(--ink3)', lineHeight: 1.5, margin: '0 0 24px' }}>
              Your feedback has been successfully sent to <strong>support@zapay.xyz</strong>. We appreciate you helping us improve ZaPay!
            </p>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: '100%',
                background: 'var(--page)',
                color: 'var(--ink2)',
                border: '1.5px solid var(--border)',
                borderRadius: 100,
                padding: '13px',
                fontFamily: 'var(--font)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--page)'}
            >
              Close
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.7); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
