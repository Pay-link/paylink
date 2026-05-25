import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { rateLimit, getIp, rateLimitResponse } from '@/lib/rateLimit'
import { sanitizeText, isValidEmail } from '@/lib/sanitize'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  // Rate limit: 3 feedback submissions per minute per IP to prevent spam/abuse
  if (!rateLimit(`feedback:${getIp(req)}`, 3, 60_000)) return rateLimitResponse()

  try {
    const body = await req.json()
    const { userId, email, category, message } = body

    // Enforce basic validation
    if (!email || !isValidEmail(email)) {
      return Response.json({ error: 'Please provide a valid email address.' }, { status: 400 })
    }
    if (!category || typeof category !== 'string' || category.length > 100) {
      return Response.json({ error: 'Invalid category selection.' }, { status: 400 })
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ error: 'Please enter your message.' }, { status: 400 })
    }
    if (message.length > 1000) {
      return Response.json({ error: 'Feedback message exceeds the character limit.' }, { status: 400 })
    }

    const sanitizedEmail = email.toLowerCase().trim()
    const sanitizedCategory = sanitizeText(category, 100)
    const sanitizedMessage = sanitizeText(message, 1000)

    // 1. Save to Supabase database (feedback table)
    let dbSuccess = false
    try {
      const { error: dbError } = await supabase
        .from('feedback')
        .insert({
          user_id: userId || null,
          email: sanitizedEmail,
          category: sanitizedCategory,
          message: sanitizedMessage,
          created_at: new Date().toISOString(),
        })

      if (dbError) {
        // If the table 'feedback' doesn't exist yet, we catch it but do not fail,
        // so the user still gets their email sent successfully!
        console.warn('Supabase feedback table logging failed (perhaps schema table needs to be run):', dbError.message)
      } else {
        dbSuccess = true
        console.log('Feedback securely saved to Supabase database.')
      }
    } catch (err: any) {
      console.warn('Database logging caught error:', err.message || err)
    }

    // 2. Dispatch real email via Resend API if configured
    const resendApiKey = process.env.RESEND_API_KEY
    const supportEmail = 'support@zapay.xyz'
    let emailSent = false
    let emailError: string | null = null

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New ZaPay Feedback</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f6f9fc;
              color: #1a1f36;
              padding: 40px 20px;
              margin: 0;
            }
            .container {
              max-width: 600px;
              background-color: #ffffff;
              border: 1px solid #e3e8ee;
              border-radius: 16px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
              overflow: hidden;
              margin: 0 auto;
            }
            .header {
              background: linear-gradient(135deg, #1e6b32 0%, #154c24 100%);
              padding: 32px 40px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              font-size: 24px;
              font-weight: 700;
              margin: 0;
              letter-spacing: -0.03em;
            }
            .content {
              padding: 40px;
            }
            .meta-box {
              background-color: #f8fafc;
              border: 1.5px solid #edf2f7;
              border-radius: 12px;
              padding: 20px 24px;
              margin-bottom: 30px;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #edf2f7;
            }
            .meta-row:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }
            .meta-label {
              font-size: 13px;
              font-weight: 600;
              color: #718096;
            }
            .meta-value {
              font-size: 13px;
              font-weight: 500;
              color: #1a1f36;
            }
            .message-box {
              background-color: #ffffff;
              border-left: 4px solid #1e6b32;
              padding: 8px 0 8px 20px;
              margin: 20px 0;
            }
            .message-text {
              font-size: 15px;
              line-height: 1.6;
              color: #2d3748;
              white-space: pre-wrap;
            }
            .footer {
              background-color: #f8fafc;
              padding: 24px;
              text-align: center;
              border-top: 1px solid #edf2f7;
              font-size: 12px;
              color: #a0aec0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New ZaPay Feedback</h1>
            </div>
            <div class="content">
              <div class="meta-box">
                <div class="meta-row">
                  <span class="meta-label">User Email</span>
                  <span class="meta-value">${sanitizedEmail}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Category</span>
                  <span class="meta-value" style="color: #1e6b32; font-weight: 700;">${sanitizedCategory}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">User ID (Privy)</span>
                  <span class="meta-value" style="font-family: monospace; font-size: 11px;">${userId || 'Guest User'}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Timestamp</span>
                  <span class="meta-value">${new Date().toLocaleString()}</span>
                </div>
              </div>
              
              <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #718096; margin-bottom: 12px;">Submitted Message</h3>
              <div class="message-box">
                <div class="message-text">${sanitizedMessage}</div>
              </div>
            </div>
            <div class="footer">
              This email was generated automatically by the ZaPay Feedback System.
            </div>
          </div>
        </body>
      </html>
    `

    if (resendApiKey && resendApiKey.startsWith('re_')) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'ZaPay Feedback <onboarding@resend.dev>',
            to: supportEmail,
            subject: `[ZaPay Feedback] New ${sanitizedCategory} from ${sanitizedEmail}`,
            html: htmlContent,
          }),
        })

        const resData = await response.json()

        if (response.ok) {
          emailSent = true
          console.log(`[REAL EMAIL DISPATCHED] Successfully sent feedback email via Resend (ID: ${resData.id}).`)
        } else {
          emailError = resData.message || 'Resend API returned error status'
          console.error('[Resend Error]', emailError)
        }
      } catch (err: any) {
        emailError = err.message || String(err)
        console.error('Failed to dispatch email via Resend API:', err)
      }
    } else {
      console.warn('RESEND_API_KEY is not configured or invalid in env. Falling back to local logging.')
    }

    // 3. Graceful Fallback Log (Always printed if Resend is skipped or failed)
    if (!emailSent) {
      console.log('\n=================== MOCK EMAIL DISPATCHED ===================')
      console.log(`To: ${supportEmail}`)
      console.log(`From: feedback@zapay.xyz`)
      console.log(`Subject: [ZaPay Feedback] New ${sanitizedCategory} from ${sanitizedEmail}`)
      console.log(`User ID: ${userId || 'Guest User'}`)
      console.log('-------------------- Message Content --------------------')
      console.log(sanitizedMessage)
      console.log('=============================================================\n')
    }

    return Response.json({
      success: true,
      dbLogged: dbSuccess,
      emailSent,
      emailError,
    })
  } catch (err: any) {
    console.error('Feedback API error:', err)
    return Response.json({ error: 'Failed to process feedback submission.' }, { status: 500 })
  }
}
