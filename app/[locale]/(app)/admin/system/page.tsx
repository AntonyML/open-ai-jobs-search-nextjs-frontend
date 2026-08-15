import { Wrench } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export default function AdminSystemPage() {
  const t = useTranslations('adminPlaceholder')
  const side = useTranslations('appSidebar')

  return (
    <AdminPlaceholder
      icon={Wrench}
      title={side('adminSystem')}
      subtitle={t('systemSubtitle')}
      comingTitle={t('systemComingTitle')}
      comingDesc={t('systemComingDesc')}
    />
  )
}
