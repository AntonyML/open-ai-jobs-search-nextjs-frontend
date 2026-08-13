'use client'

import { useEffect, useState } from 'react'
import { useRouter as useNextRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { clearCompletedSteps, clearToken, isLoggedIn } from '@/lib/auth'
import { useBilling } from '@/hooks/useBilling'
import { apiFetch } from '@/lib/api'
import { showError, showSuccess } from '@/lib/toasts'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  UserRound,
  Server,
  Bell,
  Globe,
  Accessibility,
  Shield,
  CheckCircle2,
  ChevronRight,
  Settings2,
  Eye,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import AccessibilitySettings from '@/components/AccessibilitySettings'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import UpgradeModal from '@/components/UpgradeModal'
import styles from './settings.module.css'

// ── Main Settings Page ────────────────────────────────────────────

export default function Settings() {
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const locale = useLocale()
  const { isPremium } = useBilling()
  const router = useNextRouter()
  const [activeTab, setActiveTab] = useState('notifications')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifBrowser, setNotifBrowser] = useState(false)
  const [notifSound, setNotifSound] = useState(true)
  const [notifMarketing, setNotifMarketing] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwUpdating, setPwUpdating] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
  }, [router])

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

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      await apiFetch('/api/v1/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirmText }),
      })
      showSuccess(t('common.saved'))
      clearToken()
      clearCompletedSteps()
      router.push('/login')
    } catch {
      showError(t('common.error'))
    }
    setDeleting(false)
    setShowDeleteConfirm(false)
    setDeletePassword('')
    setDeleteConfirmText('')
  }

  const confirmWord = locale === 'es' ? 'CONFIRMAR' : 'CONFIRM'
  const canDelete = deletePassword.length > 0 && deleteConfirmText === confirmWord && !deleting

  const tabs = [
    { key: 'appearance', label: t('tabs.appearance'), icon: Accessibility },
    { key: 'notifications', label: t('tabs.notifications'), icon: Bell },
    { key: 'language', label: t('tabs.language'), icon: Globe },
    { key: 'providers', label: t('tabs.providers'), icon: Server },
    { key: 'security', label: t('tabs.security'), icon: Shield },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-4 animate-fade-in-up">
        <span className={styles.headerIcon}>
          <Settings2 size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className={styles.pageTitle}>
            {t('title')}
          </h1>
          <p className={styles.pageSubtitle}>{t('subtitle')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <TabsList className={styles.tabsBar}>
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className={`${styles.tab} text-sm gap-1.5`}
              >
                <tab.icon className="size-4 shrink-0" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── Appearance (Accessibility) ─────────────────────── */}
        <TabsContent value="appearance">
          <div className={`${styles.card} animate-fade-in-up`}>
            <div className={styles.cardHead}>
              <span className={styles.headerIcon}>
                <Eye size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className={styles.cardTitle}>{t('tabs.appearance')}</h2>
                <p className={styles.cardDesc}>{t('appearanceDesc')}</p>
              </div>
            </div>
            <div className={styles.cardBody}>
              <AccessibilitySettings variant="inline" />
            </div>
          </div>
        </TabsContent>

        {/* ── Notifications ─────────────────────────────── */}
        <TabsContent value="notifications">
          <div className={`${styles.card} animate-fade-in-up`}>
            <div className={styles.cardHead}>
              <span className={styles.headerIcon}>
                <Bell size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className={styles.cardTitle}>{t('tabs.notifications')}</h2>
                <p className={styles.cardDesc}>{t('notifications.desc')}</p>
              </div>
            </div>
            <div className={styles.cardBody}>
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
          </div>
        </TabsContent>

        {/* ── Language ──────────────────────────────────── */}
        <TabsContent value="language">
          <div className={`${styles.card} animate-fade-in-up`}>
            <div className={styles.cardHead}>
              <span className={styles.headerIcon}>
                <Globe size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className={styles.cardTitle}>{t('tabs.language')}</h2>
                <p className={styles.cardDesc}>{t('language.interfaceDesc')}</p>
              </div>
            </div>
            <div className={styles.cardBody}>
              <p className="text-[14px] font-medium text-[#1d1d1f] mb-3">{t('language.interfaceLanguage')}</p>
              <LanguageSwitcher />
            </div>
          </div>
        </TabsContent>

        {/* ── Providers ─────────────────────────────────── */}
        <TabsContent value="providers">
          <div className={`${styles.card} animate-fade-in-up`}>
            <div className={styles.cardHead}>
              <span className={styles.headerIcon}>
                <Server size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className={styles.cardTitle}>{t('tabs.providers')}</h2>
                <p className={styles.cardDesc}>{t('providers.goToProviders')}</p>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#d2d2d7]/60 bg-white/70 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1d1d1f]">{t('providers.activeProvider')}</p>
                  <p className="text-xs text-[#858585] mt-0.5">{t('providers.notConfigured')}</p>
                </div>
                <Link
                  href="/admin/providers"
                  className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-[#0071e3] hover:text-[#0077ed] transition-colors"
                >
                  {t('providers.goToProviders')}
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Security ──────────────────────────────────── */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* ── Plan & Billing ─────────────────── */}
            <div className={`${styles.card} animate-fade-in-up`}>
              <div className={styles.cardHead}>
                <span className={styles.headerIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className={styles.cardTitle}>{t('security.plan')}</h2>
                  <p className={styles.cardDesc}>{t('security.planDesc')}</p>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={isPremium ? styles.chipOk : styles.chipNeutral}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {isPremium ? 'Premium' : 'Free'}
                  </span>
                  {!isPremium && (
                    <button
                      onClick={() => setShowUpgrade(true)}
                      className={styles.btnPrimary}
                    >
                      {t('security.upgrade')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Change password ── */}
            <div className={`${styles.card} animate-fade-in-up`}>
              <div className={styles.cardHead}>
                <span className={styles.headerIcon}>
                  <Shield size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className={styles.cardTitle}>{t('security.changePassword')}</h2>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className="space-y-4">
                  <div>
                    <label className={styles.fieldLabel}>{t('security.currentPassword')}</label>
                    <input type="password" autoComplete="current-password" value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                      className={styles.field} />
                  </div>
                  <div>
                    <label className={styles.fieldLabel}>{t('security.newPassword')}</label>
                    <input type="password" autoComplete="new-password" value={passwordForm.newPw} onChange={e => setPasswordForm(p => ({ ...p, newPw: e.target.value }))}
                      className={styles.field} />
                  </div>
                  <div>
                    <label className={styles.fieldLabel}>{t('security.confirmPassword')}</label>
                    <input type="password" autoComplete="new-password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                      className={styles.field} />
                  </div>
                  {pwError && <p className={styles.errorStrip}>{pwError}</p>}
                  {pwSuccess && (
                    <p className={`${styles.successStrip} flex items-center gap-1.5`}>
                      <CheckCircle2 className="size-3.5 shrink-0" /> {t('security.passwordUpdated')}
                    </p>
                  )}
                  <button onClick={updatePassword} disabled={pwUpdating || !passwordForm.current || !passwordForm.newPw}
                    className={styles.btnPrimary}>
                    {pwUpdating && <span className={styles.spinner} />}
                    {pwUpdating ? tc('loading') : t('security.updatePassword')}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Two-factor ── */}
            <div className={`${styles.card} animate-fade-in-up`}>
              <div className={styles.cardHead}>
                <span className={styles.headerIcon}>
                  <Shield size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className={styles.cardTitle}>{t('security.twoFactor')}</h2>
                  <p className={styles.cardDesc}>{t('security.twoFactorDesc')}</p>
                </div>
              </div>
              <div className={styles.cardBody}>
                <button disabled className={styles.btnSecondary}>{t('security.enable2FA')}</button>
                <p className="mt-2 text-[11px] text-[#b0b0b0]">Coming soon</p>
              </div>
            </div>

            {/* ── Sessions ── */}
            <div className={`${styles.card} animate-fade-in-up`}>
              <div className={styles.cardHead}>
                <span className={styles.headerIcon}>
                  <UserRound size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className={styles.cardTitle}>{t('security.sessions')}</h2>
                  <p className={styles.cardDesc}>{t('security.sessionsDesc')}</p>
                </div>
              </div>
              <div className={styles.cardBody}>
                <button disabled className={styles.btnSecondary}>{t('security.revokeAll')}</button>
                <p className="mt-2 text-[11px] text-[#b0b0b0]">Coming soon</p>
              </div>
            </div>

            {/* ── Danger Zone: Delete Account ─────────────────── */}
            <div className={`${styles.card} animate-fade-in-up border-rose-200`}>
              <div className={styles.cardHead}>
                <span className={styles.headerIcon} style={{ background: 'linear-gradient(135deg,#ff6482 0%,#ff375f 55%,#d70015 100%)' }}>
                  <Shield size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className={`${styles.cardTitle} text-rose-600`}>{t('security.deleteAccount')}</h2>
                  <p className={styles.cardDesc}>{t('security.deleteAccountDesc')}</p>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className="space-y-4">
                  <div className={styles.errorStrip}>
                    {t('security.deleteAccountWarning')}
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className={styles.btnDanger}
                  >
                    {t('security.deleteAccountButton')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Delete Account Confirmation Modal ─────────────── */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteConfirm(false)} />
              <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-rose-100 flex items-center justify-center">
                      <svg className="size-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold text-[#1d1d1f]">{t('security.deleteAccount')}</h3>
                      <p className="text-[12px] text-[#707070]">{t('security.deleteAccountDesc')}</p>
                    </div>
                  </div>

                  <div className={styles.errorStrip}>
                    {t('security.deleteAccountWarning')}
                  </div>

                  <div>
                    <label className={styles.fieldLabel}>{t('security.currentPassword')}</label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={deletePassword}
                      onChange={e => setDeletePassword(e.target.value)}
                      className={styles.field}
                    />
                  </div>

                  <div>
                    <label className={styles.fieldLabel}>{t('security.deleteAccountConfirm')}</label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder={confirmWord}
                      className={styles.field}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteConfirmText('') }}
                      disabled={deleting}
                      className={`${styles.btnSecondary} flex-1`}
                    >
                      {tc('cancel')}
                    </button>
                    <button
                      onClick={deleteAccount}
                      disabled={!canDelete}
                      className={`${styles.btnDanger} flex-1`}
                    >
                      {deleting ? t('security.deleting') : t('security.deleteAccountButton')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
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
