import { Nav } from '@/components/layout/Nav'

export default function SendPage() {
  return (
    <>
      <Nav />
      {/* The send page HTML is rendered here */}
      {/* In production this will be a full React component */}
      {/* For now redirect to the designed HTML page */}
      <script dangerouslySetInnerHTML={{
        __html: `window.location.href = '/send.html'`
      }} />
    </>
  )
}
