import './globals.css'
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>ZaPay — Send money to anyone with just a link</title>
        <meta name="description" content="Send or receive USDC instantly across borders. No middlemen, no delays. Powered by Arc." />
        <meta name="theme-color" content="#09090E" />
        <meta property="og:title" content="ZaPay — Send money to anyone with just a link" />
        <meta property="og:description" content="Send or receive USDC instantly across borders. No middlemen, no delays. Powered by Arc." />
        <meta property="og:site_name" content="ZaPay" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Google+Sans+Display:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script
          src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"
          async
        />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('zp-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();` }} />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
