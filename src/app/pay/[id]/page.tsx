import { Nav } from '@/components/layout/Nav'
import { PaymentClient } from './PaymentClient'

interface PayPageProps {
  params: { id: string }
}

async function getLink(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/links/${slug}`,
      { cache: 'no-store' }
    )
    const json = await res.json()
    if (!res.ok) return { link: null, error: json.error }
    return { link: json.data, error: null }
  } catch {
    return { link: null, error: 'Failed to load payment link' }
  }
}

export default async function PayPage({ params }: PayPageProps) {
  const { link, error } = await getLink(params.id)

  return (
    <>
      <Nav variant="minimal" />
      <PaymentClient link={link} error={error} slug={params.id} />
    </>
  )
}
