'use client'

import { useEffect, useState } from 'react'
import { useRouter as useNextRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { isLoggedIn } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  User,
  Server,
  Bell,
  Globe,
  Palette,
  Shield,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import AccessibilitySettings from '@/components/AccessibilitySettings'
import LanguageSwitcher from '@/components/LanguageSwitcher'

// ── Main Settings Page ────────────────────────────────────────────

export default function Settings() {
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const router = useNextRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState<{ full_name?: string; email?: string; location?: string; profile_statement?: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifBrowser, setNotifBrowser] = useState(false)
  const [notifSound, setNotifSound] = useState(true)
  const [notifMarketing, setNotifMarketing] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwUpdating, setPwUpdating] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    apiFetch<{ full_name?: string; email?: string; location?: string; profile_statement?: string }>('/api/v1/setup/profile')
      .then(p => { if (p) setProfile(p) })
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [router])

  const saveProfile = async () => {
    setSaving(true)
    try {
      await apiFetch('/api/v1/setup/profile', {
        method: 'POST',
        body: JSON.stringify(profile),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* ignore */ }
    setSaving(false)
  }

  const updatePassword = async () => {
    setPwError('')
    setPwSuccess(false)
    if (passwordForm.newPw !== passwordForm.confirm) {
      setPwError(t('security.passwordsDontMatch'))
      return
    }
    setPwUpdating(true)
    try {
      await apiFetch('/api/v1/auth/password', {
        method: 'POST',
        body: JSON.stringify({ current_password: passwordForm.current, new_password: passwordForm.newPw }),
      })
      setPwSuccess(true)
      setPasswordForm({ current: '', newPw: '', confirm: '' })
      setTimeout(() => setPwSuccess(false), 3000)
    } catch { setPwError('Failed to update password') }
    setPwUpdating(false)
  }

  const tabs = [
    { key: 'profile', label: t('tabs.profile'), icon: User },
    { key: 'providers', label: t('tabs.providers'), icon: Server },
    { key: 'notifications', label: t('tabs.notifications'), icon: Bell },
    { key: 'language', label: t('tabs.language'), icon: Globe },
    { key: 'appearance', label: t('tabs.appearance'), icon: Palette },
    { key: 'security', label: t('tabs.security'), icon: Shield },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-[#707070]">{t('subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <TabsList className="bg-[#f5f5f7] w-max min-w-full">
            {tabs.map(tab => (
              <TabsTrigger key={tab.key} value={tab.key} className="text-sm gap-1.5">
                <tab.icon className="size-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── Profile ───────────────────────────────────── */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.profile')}</CardTitle>
              <CardDescription>{t('profile.saveChanges')}</CardDescription>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-10 rounded-lg bg-[#e2e2e5]" />
                  <div className="h-10 rounded-lg bg-[#e2e2e5]" />
                  <div className="h-10 rounded-lg bg-[#e2e2e5]" />
                </div>
              ) : profile ? (
                <div className="space-y-4">
                  {[
                    { key: 'full_name', label: t('profile.fullName'), type: 'text' },
                    { key: 'email', label: t('profile.email'), type: 'email' },
                    { key: 'location', label: t('profile.location'), type: 'text' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-[12px] font-medium text-[#707070] mb-1">{field.label}</label>
                      <input
                        type={field.type}
                        value={(profile as any)[field.key] || ''}
                        onChange={e => setProfile(p => ({ ...p!, [field.key]: e.target.value }))}
                        className="w-full rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-[14px] text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[12px] font-medium text-[#707070] mb-1">{t('profile.profileStatement')}</label>
                    <textarea
                      value={profile.profile_statement || ''}
                      onChange={e => setProfile(p => ({ ...p!, profile_statement: e.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-[14px] text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="rounded-full bg-[#0071e3] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#0077ed] disabled:opacity-50 transition-all"
                    >
                      {saving ? tc('loading') : t('profile.saveChanges')}
                    </button>
                    {saved && (
                      <span className="flex items-center gap-1 text-[12px] text-emerald-600">
                        <CheckCircle2 className="size-3.5" />
                        {t('profile.saved')}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#858585]">{t('profile.notLoaded')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Providers ─────────────────────────────────── */}
        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.providers')}</CardTitle>
              <CardDescription>{t('providers.goToProviders')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-[#d2d2d7]/60 bg-white p-4">
                  <div>
                    <p className="text-sm font-medium text-[#1d1d1f]">{t('providers.activeProvider')}</p>
                    <p className="text-xs text-[#858585]">{t('providers.notConfigured')}</p>
                  </div>
                  <Link
                    href="/pipeline/providers"
                    className="flex items-center gap-1 text-[12px] font-medium text-[#0071e3] hover:text-[#0077ed] transition-colors"
                  >
                    {t('providers.goToProviders')}
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
                <p className="text-[12px] text-[#858585]">
                  {t('subtitle')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications ─────────────────────────────── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.notifications')}</CardTitle>
              <CardDescription>Control how and when you receive updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <Toggle
                  label={t('notifications.emailNotifications')}
                  description={t('notifications.emailDesc')}
                  enabled={notifEmail}
                  onChange={setNotifEmail}
                />
                <Toggle
                  label={t('notifications.browserNotifications')}
                  description={t('notifications.browserDesc')}
                  enabled={notifBrowser}
                  onChange={setNotifBrowser}
                />
                <Toggle
                  label={t('notifications.soundEffects')}
                  description={t('notifications.soundEffectDesc')}
                  enabled={notifSound}
                  onChange={setNotifSound}
                />
                <Toggle
                  label={t('notifications.marketingEmails')}
                  description={t('notifications.marketingDesc')}
                  enabled={notifMarketing}
                  onChange={setNotifMarketing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Language ──────────────────────────────────── */}
        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.language')}</CardTitle>
              <CardDescription>{t('language.interfaceDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-[14px] font-medium text-[#1d1d1f] mb-2">{t('language.interfaceLanguage')}</p>
                <LanguageSwitcher />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Appearance ────────────────────────────────── */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.appearance')}</CardTitle>
              <CardDescription>Customize the look and feel of Open Ai Jobs Search</CardDescription>
            </CardHeader>
            <CardContent>
              <AccessibilitySettings variant="inline" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security ──────────────────────────────────── */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('security.changePassword')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#707070] mb-1">{t('security.currentPassword')}</label>
                    <input type="password" value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                      className="w-full rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#707070] mb-1">{t('security.newPassword')}</label>
                    <input type="password" value={passwordForm.newPw} onChange={e => setPasswordForm(p => ({ ...p, newPw: e.target.value }))}
                      className="w-full rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#707070] mb-1">{t('security.confirmPassword')}</label>
                    <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                      className="w-full rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all" />
                  </div>
                  {pwError && <p className="text-[12px] text-rose-500">{pwError}</p>}
                  {pwSuccess && (
                    <p className="flex items-center gap-1 text-[12px] text-emerald-600">
                      <CheckCircle2 className="size-3.5" /> {t('security.passwordUpdated')}
                    </p>
                  )}
                  <button onClick={updatePassword} disabled={pwUpdating || !passwordForm.current || !passwordForm.newPw}
                    className="rounded-full bg-[#0071e3] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#0077ed] disabled:opacity-50 transition-all">
                    {pwUpdating ? tc('loading') : t('security.updatePassword')}
                  </button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('security.twoFactor')}</CardTitle>
                <CardDescription>{t('security.twoFactorDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <button disabled className="rounded-full border border-[#d2d2d7] bg-white px-5 py-2 text-[13px] font-medium text-[#707070] opacity-50 cursor-not-allowed">{t('security.enable2FA')}</button>
                <p className="mt-2 text-[11px] text-[#b0b0b0]">Coming soon</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('security.sessions')}</CardTitle>
                <CardDescription>{t('security.sessionsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <button disabled className="rounded-full border border-[#d2d2d7] bg-white px-5 py-2 text-[13px] font-medium text-[#707070] opacity-50 cursor-not-allowed">{t('security.revokeAll')}</button>
                <p className="mt-2 text-[11px] text-[#b0b0b0]">Coming soon</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Toggle sub-component (kept local since specific to notifications) ──

function Toggle({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string
  description?: string
  enabled: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 border-b border-[#e2e2e5] last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[#1d1d1f]">{label}</p>
        {description && <p className="text-[12px] text-[#858585] mt-0.5">{description}</p>}
      </div>
      <Switch checked={enabled} onCheckedChange={onChange} size="default" className="shrink-0" />
    </div>
  )
}
