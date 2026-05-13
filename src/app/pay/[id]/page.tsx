import { Nav } from '@/components/layout/Nav'
import { PaymentClient } from './PaymentClient'
import { createServerClient } from '@/lib/supabase'

interface PayPageProps {
  params: { id: string }
}

async function getLink(slug: string) {
  try {
    const supabase = createServerClient()
    const { data: link, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !link) return { link: null, error: 'Link not found' }

    if (link.expiry && new Date(link.expiry) < new Date()) {
      await supabase.from('payment_links').update({ status: 'expired' }).eq('id', link.id)
      return { link: null, error: 'This link has expired' }
    }

    if (link.status === 'paid') return { link: null, error: 'This link has already been paid' }
    if (link.status === 'cancelled') return { link: null, error: 'This link has been cancelled' }

    return { link, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load payment link'
    return { link: null, error: message }
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
