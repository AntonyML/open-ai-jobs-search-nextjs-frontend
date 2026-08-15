import { Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export default function AdminUsersPage() {
  const t = useTranslations('adminPlaceholder')
  const side = useTranslations('appSidebar')

  return (
    <AdminPlaceholder
      icon={Users}
      title={side('adminUsers')}
      subtitle={t('usersSubtitle')}
      comingTitle={t('usersComingTitle')}
      comingDesc={t('usersComingDesc')}
    />
  )
}
