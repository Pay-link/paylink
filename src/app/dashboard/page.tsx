import { Nav } from '@/components/layout/Nav'

export default function DashboardPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{
        __html: `window.location.href = '/dashboard.html'`
      }} />
    </>
  )
}
