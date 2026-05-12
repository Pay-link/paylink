import { Nav } from '@/components/layout/Nav'

export default function CreatePage() {
  return (
    <>
      <Nav />
      <script dangerouslySetInnerHTML={{
        __html: `window.location.href = '/create.html'`
      }} />
    </>
  )
}
