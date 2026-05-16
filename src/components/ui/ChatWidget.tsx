'use client'

import { useState, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  'How do I get test USDC?',
  'How do I create a payment link?',
  'Is my wallet safe?',
  'How do I send money?',
]

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || loading) return
    setInput('')
    setShowQuick(false)

    const next: Message[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })

      if (!res.ok || !res.body) throw new Error('Request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let reply = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: reply }
          return updated
        })
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again or email support@zapay.xyz for help.",
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  return (
    <>
      <style>{`
        .chat-widget-panel {
          position: fixed; bottom: 88px; right: 20px; z-index: 1000;
          width: 356px; max-height: 560px;
          background: var(--white, #18181f); border: 1px solid var(--border, rgba(255,255,255,.1));
          border-radius: 20px; box-shadow: 0 24px 60px rgba(0,0,0,.6);
          display: flex; flex-direction: column; overflow: hidden;
          transform-origin: bottom right;
          animation: chatOpen .2s ease;
        }
        @keyframes chatOpen { from { opacity:0; transform: scale(.92) translateY(8px) } to { opacity:1; transform: scale(1) translateY(0) } }
        .chat-bubble-btn {
          position: fixed; bottom: 20px; right: 20px; z-index: 1000;
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--g1, #255CB4); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(37,92,180,.4);
          transition: transform .2s, box-shadow .2s;
          color: #fff; font-size: 24px;
        }
        .chat-bubble-btn:hover { transform: scale(1.08); box-shadow: 0 12px 32px rgba(37,92,180,.5); }
        .chat-msg-user {
          align-self: flex-end; background: var(--g1, #255CB4); color: #fff;
          border-radius: 16px 16px 4px 16px; padding: 10px 14px;
          max-width: 80%; font-size: 13px; line-height: 1.5; word-break: break-word;
        }
        .chat-msg-ai {
          align-self: flex-start; background: var(--page, #09090E); color: var(--ink, #fff);
          border: 1px solid var(--border, rgba(255,255,255,.1));
          border-radius: 16px 16px 16px 4px; padding: 10px 14px;
          max-width: 85%; font-size: 13px; line-height: 1.6; word-break: break-word;
        }
        .chat-quick-btn {
          background: var(--page, #09090E); border: 1px solid var(--border, rgba(255,255,255,.1));
          color: var(--ink3, rgba(255,255,255,.5)); border-radius: 100px;
          padding: 6px 12px; font-size: 12px; cursor: pointer; white-space: nowrap;
          font-family: var(--font, sans-serif); transition: all .15s;
        }
        .chat-quick-btn:hover { border-color: var(--g1, #255CB4); color: var(--g1, #255CB4); }
        .chat-input {
          flex: 1; background: transparent; border: none; outline: none;
          font-family: var(--font, sans-serif); font-size: 13px;
          color: var(--ink, #fff); placeholder-color: var(--ink4);
        }
        @media (max-width: 480px) {
          .chat-widget-panel { width: calc(100vw - 24px); right: 12px; bottom: 80px; }
          .chat-bubble-btn { bottom: 80px; right: 12px; }
        }
      `}</style>

      {/* Floating bubble */}
      <button className="chat-bubble-btn" onClick={() => setOpen(o => !o)} aria-label="Open support chat">
        <Icon icon={open ? 'ph:x-bold' : 'ph:chat-teardrop-dots-bold'} />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-widget-panel">
          {/* Header */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--g1, #255CB4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20 }}>
              <Icon icon="ph:robot-bold" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>ZaPay Support</div>
              <div style={{ fontSize: 11, color: 'var(--g1, #255CB4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--g3, #4ADE80)', display: 'inline-block' }} />
                AI agent · online
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 18 }}>
              <Icon icon="ph:x-bold" />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Welcome */}
            {messages.length === 0 && (
              <div className="chat-msg-ai">
                Hey! I'm the ZaPay support agent. Ask me anything about sending money, creating links, your wallet, or getting test USDC. I'm here to help!
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}>
                {m.content || <span style={{ opacity: 0.4 }}>▍</span>}
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="chat-msg-ai" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink3)', display: 'inline-block', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            )}

            {/* Quick prompts */}
            {showQuick && messages.length === 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {QUICK_PROMPTS.map(q => (
                  <button key={q} className="chat-quick-btn" onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--page)', border: '1.5px solid var(--border)', borderRadius: 100, padding: '8px 8px 8px 16px' }}>
              <input
                ref={inputRef}
                className="chat-input"
                placeholder="Ask a question…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                style={{ width: 32, height: 32, borderRadius: '50%', background: input.trim() ? 'var(--g1)' : 'var(--border)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, transition: 'background .15s' }}
              >
                <Icon icon="ph:paper-plane-right-bold" />
              </button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink4)', textAlign: 'center', marginTop: 6 }}>
              Powered by AI · Can't help? <a href="mailto:support@zapay.xyz" style={{ color: 'var(--g1)', textDecoration: 'none' }}>Email support</a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
