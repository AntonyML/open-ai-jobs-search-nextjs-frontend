import { User } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const t = await getTranslations('adminPlaceholder')
  const side = await getTranslations('appSidebar')

  return (
    <AdminPlaceholder
      icon={User}
      title={side('adminUsers')}
      subtitle={t('detailSubtitle', { id: id.slice(0, 8) })}
      comingTitle={t('detailComingTitle')}
      comingDesc={t('detailComingDesc')}
    />
  )
}
