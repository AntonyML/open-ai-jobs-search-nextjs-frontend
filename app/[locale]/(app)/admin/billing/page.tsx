import { Receipt } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export default function AdminBillingPage() {
  const t = useTranslations('adminPlaceholder')
  const side = useTranslations('appSidebar')

  return (
    <AdminPlaceholder
      icon={Receipt}
      title={side('adminBilling')}
      subtitle={t('billingSubtitle')}
      comingTitle={t('billingComingTitle')}
      comingDesc={t('billingComingDesc')}
    />
  )
}
