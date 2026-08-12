'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { clearCompletedSteps, clearToken } from '@/lib/auth'
import { showError, showSuccess } from '@/lib/toasts'
import { ProfileEditor } from '@/components/profile/ProfileEditor'

export default function ProfilePage() {
  const t = useTranslations('profile')
  const tc = useTranslations('common')
  const ts = useTranslations('settings')
  const locale = useLocale()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [noProvider, setNoProvider] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [active, me] = await Promise.all([
          apiFetch<any>('/api/v1/providers/active').catch(() => null),
          apiFetch<any>('/api/v1/auth/me').catch(() => null),
        ])
        if (cancelled) return

        // The system always resolves a provider (falls back to .env); the banner
        // only appears when the admin has not stored a global API key yet.
        if (!active?.has_key) {
          setNoProvider(true)
        }

        let setupProfile: any = null
        if (me?.has_profile) {
          const r = await apiFetch<any>('/api/v1/setup/profile').catch(() => null)
          if (cancelled) return
          setupProfile = r
        }
        if (cancelled) return

        setProfile({
          setup: setupProfile,
          email: setupProfile?.email || me?.email || null,
          name: setupProfile?.full_name || me?.full_name || null,
        })
        setLoading(false)
      } catch {
        if (!cancelled) {
          setError(t('loadError'))
          showError(t('loadError'))
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [router, t])

  const handleSignOut = () => {
    clearToken()
    router.push('/')
  }

  // Keep the hero card + progress in sync after the master editor saves.
  const refreshSetup = async () => {
    const r = await apiFetch<any>('/api/v1/setup/profile').catch(() => null)
    if (!r) return
    setProfile((prev: any) => ({
      ...prev,
      setup: r,
      name: r.full_name || prev?.name || null,
      email: r.email || prev?.email || null,
    }))
  }

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      await apiFetch('/api/v1/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirmText }),
      })
      showSuccess(t('deleteSuccess'))
      clearToken()
      clearCompletedSteps()
      router.push('/login')
    } catch {
      showError(tc('error'))
    }
    setDeleting(false)
    setShowDeleteConfirm(false)
    setDeletePassword('')
    setDeleteConfirmText('')
  }

  const confirmWord = locale === 'es' ? 'CONFIRMAR' : 'CONFIRM'
  const canDelete = deletePassword.length > 0 && deleteConfirmText === confirmWord && !deleting

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl py-8 md:py-12">
        <div className="space-y-6 animate-pulse">
          <div className="skeleton h-7 w-24" />
          <div className="skeleton h-10 w-56" />
          <div className="card space-y-4">
            <div className="flex items-center gap-4">
              <div className="skeleton size-14 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton h-5 w-40" />
                <div className="skeleton h-4 w-56" />
              </div>
            </div>
          </div>
          <div className="skeleton h-20 w-full rounded-xl" />
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
      </section>
    )
  }

  const setup = profile?.setup
  const hasSetup = !!setup

  return (
    <section className="mx-auto max-w-3xl py-8 md:py-12">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="mb-10 animate-fade-in-up">
        <p className="eyebrow">{t('settingsLabel')}</p>
        <h1 className="mt-3 text-[40px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.1]">
          {t('title')}
        </h1>
        <p className="subtitle mt-2">
          {t('subtitle')}
        </p>
      </div>

      {error && (
        <div className="mb-6 animate-fade-in-up rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {noProvider && (
        <div className="mb-6 animate-fade-in-up rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <span className="font-medium">{t('noProviderAdminTitle')}</span>{' '}
          {t('noProviderAdminDesc')}
        </div>
      )}

      {/* ── Profile Hero Card ──────────────────────────────────── */}
      <div className="card mb-5 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="size-14 rounded-full bg-[#0071e3] flex items-center justify-center text-white text-xl font-semibold select-none shadow-sm">
                {(profile?.name || profile?.email || '?').charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {editingName ? (
                  <>
                    <input
                      className="field flex-1 min-w-0 py-1.5 px-3 text-sm"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          setSavingName(true)
                          try {
                            await apiFetch('/api/v1/setup/profile', {
                              method: 'PATCH',
                              body: JSON.stringify({ full_name: nameInput.trim() }),
                            })
                            setProfile((prev: any) => ({ ...prev, name: nameInput.trim() }))
                            setEditingName(false)
                            showSuccess(t('nameUpdated'))
                          } catch {
                            showError(t('nameUpdateFailed'))
                          }
                          setSavingName(false)
                        }
                        if (e.key === 'Escape') {
                          setEditingName(false)
                          setNameInput(profile?.name || '')
                        }
                      }}
                      autoFocus
                      disabled={savingName}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        setSavingName(true)
                        try {
                          await apiFetch('/api/v1/setup/profile', {
                            method: 'PATCH',
                            body: JSON.stringify({ full_name: nameInput.trim() }),
                          })
                          setProfile((prev: any) => ({ ...prev, name: nameInput.trim() }))
                          setEditingName(false)
                          showSuccess(t('nameUpdated'))
                        } catch {
                          showError(t('nameUpdateFailed'))
                        }
                        setSavingName(false)
                      }}
                      disabled={savingName}
                      className="rounded-lg bg-[#0071e3] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0077ed] transition-colors disabled:opacity-50"
                    >
                      {savingName ? '...' : t('saveName')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingName(false)
                        setNameInput(profile?.name || '')
                      }}
                      className="rounded-lg border border-[#d2d2d7] px-3 py-1.5 text-xs font-medium text-[#707070] hover:bg-[#f5f5f7] transition-colors"
                    >
                      {t('cancelNameEdit')}
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-[#1d1d1f] truncate">
                      {profile?.name || profile?.email?.split('@')[0] || t('user')}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(profile?.name || '')
                        setEditingName(true)
                      }}
                      className="rounded-lg border border-[#d2d2d7] px-2.5 py-1 text-[11px] font-medium text-[#0071e3] hover:bg-[#f5f5f7] transition-colors"
                    >
                      {t('editName')}
                    </button>
                  </>
                )}
              </div>
              {profile?.email ? (
                <p className="text-sm text-[#707070] flex items-center gap-1.5 mt-0.5">
                  <svg className="size-3.5 text-[#b0b0b0] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  <span className="truncate">{profile.email}</span>
                </p>
              ) : null}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-full border border-[#d2d2d7] px-4 py-2 text-[12px] font-medium text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all shrink-0 ml-4"
          >
            {t('signOut')}
          </button>
        </div>
        {!hasSetup && (
          <div className="mt-4 pt-4 border-t border-[#e2e2e5] flex items-center gap-2">
            <svg className="size-4 text-[#b0b0b0] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-[13px] text-[#858585]">{t('setupPrompt')}</p>
          </div>
        )}
      </div>

      {/* ── Provider & Setup Quick Status ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
        {/* Profile snapshot — pure profile visualization */}
        <ProfileSnapshot setup={setup} hasSetup={hasSetup} t={t} />

        {/* Profile setup progress */}
        <ProfileProgress hasSetup={hasSetup} setup={setup} t={t} />
      </div>

      {/* ── Professional Profile (master data) ──────────────────── */}
      <div className="card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-6">
          <p className="eyebrow !text-[#0071e3]">{t('profileDetails')}</p>
        </div>
        <ProfileEditor onSaved={refreshSetup} />
      </div>

      {/* ── Danger Zone: Delete Account ──────────────────────────── */}
      <div className="mt-7 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="card border-rose-200">
          <p className="eyebrow !text-rose-500 mb-3">{ts('security.deleteAccount')}</p>
          <p className="text-[13px] text-[#707070] mb-4">{ts('security.deleteAccountDesc')}</p>
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 mb-4">
            <p className="text-[13px] text-rose-700 leading-relaxed">{ts('security.deleteAccountWarning')}</p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-full bg-rose-500 px-5 py-2 text-[13px] font-medium text-white hover:bg-rose-600 transition-all"
          >
            {ts('security.deleteAccountButton')}
          </button>
        </div>
      </div>

      {/* ── Delete Account Confirmation Modal ───────────────────── */}
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
                  <h3 className="text-[16px] font-bold text-[#1d1d1f]">{ts('security.deleteAccount')}</h3>
                  <p className="text-[12px] text-[#707070]">{ts('security.deleteAccountDesc')}</p>
                </div>
              </div>

              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                <p className="text-[12px] text-rose-700 leading-relaxed">{ts('security.deleteAccountWarning')}</p>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#707070] mb-1">{ts('security.currentPassword')}</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-[14px] text-[#1d1d1f] outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#707070] mb-1">{ts('security.deleteAccountConfirm')}</label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder={confirmWord}
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-[14px] text-[#1d1d1f] outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20 transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteConfirmText('') }}
                  disabled={deleting}
                  className="flex-1 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-medium text-[#474747] hover:bg-[#f5f5f7] disabled:opacity-50 transition-all"
                >
                  {tc('cancel')}
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={!canDelete}
                  className="flex-1 rounded-full bg-rose-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {deleting ? ts('security.deleting') : ts('security.deleteAccountButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/* ── Profile Snapshot (pure profile visualization) ── */

function ProfileSnapshot({ setup, hasSetup, t }: { setup: any; hasSetup: boolean; t: (key: string) => string }) {
  const sections = [
    {
      key: 'experience',
      label: t('experience'),
      count: setup?.experience?.length ?? 0,
      color: '#0071e3',
    },
    {
      key: 'education',
      label: t('education'),
      count: setup?.education?.length ?? 0,
      color: '#30d158',
    },
    {
      key: 'projects',
      label: t('projects'),
      count: setup?.projects?.length ?? 0,
      color: '#ff9f0a',
    },
    {
      key: 'skills',
      label: t('skills'),
      count: [
        ...(setup?.skills?.software_tools ?? []),
        ...(setup?.skills?.programming_ml ?? []),
        ...(setup?.skills?.domain_expertise ?? []),
      ].length,
      color: '#bf5af2',
    },
    {
      key: 'jobTarget',
      label: t('jobTarget'),
      count: setup?.job_target?.target_titles?.length ?? 0,
      color: '#ff375f',
    },
  ]
  const max = Math.max(1, ...sections.map((s) => s.count))
  const total = sections.reduce((acc, s) => acc + s.count, 0)

  return (
    <div className="card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="eyebrow !text-[#0071e3]">{t('snapshotTitle')}</p>
        {hasSetup && (
          <span className="inline-flex items-baseline gap-0.5 rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#474747]">
            <span className="text-[13px] font-bold text-[#1d1d1f]">{total}</span>
            {t('snapshotTotal')}
          </span>
        )}
      </div>

      {!hasSetup ? (
        <p className="text-[13px] text-[#707070]">{t('snapshotEmpty')}</p>
      ) : (
        <div className="space-y-3">
          {sections.map((s) => {
            const pct = Math.round((s.count / max) * 100)
            return (
              <div key={s.key} className="min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-[#707070]">{s.label}</span>
                  <span className="text-[12px] font-semibold tabular-nums text-[#1d1d1f]">{s.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#e2e2e5] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(s.count > 0 ? 4 : 0, pct)}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Profile Progress ──────────────────────────────── */

/* ── Funnel Stage ─────────────────────────────────── */

function ProfileProgress({ hasSetup, setup, t }: { hasSetup: boolean; setup: any; t: (key: string) => string }) {
  const sections = [
    { key: 'experience', done: (setup?.experience?.length ?? 0) > 0 },
    { key: 'education', done: (setup?.education?.length ?? 0) > 0 },
    { key: 'skills', done: (setup?.skills?.software_tools?.length ?? 0) > 0 || (setup?.skills?.programming_ml?.length ?? 0) > 0 },
  ]
  const completed = sections.filter((s) => s.done).length
  const total = sections.length
  const pct = hasSetup ? Math.round((completed / total) * 100) : 0
  const radius = 27
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div
      className="card animate-fade-in-up flex flex-col items-center justify-center text-center p-6"
      style={{ animationDelay: '0.15s' }}
    >
      <p className="eyebrow !text-[#0071e3]">{t('setupTitle')}</p>
      <p className="mt-0.5 text-[11px] text-[#858585]">
        {hasSetup ? `${completed}/${total} ${t('snapshotTotal')}` : t('snapshotEmptyShort')}
      </p>

      {/* Circular progress — large centered ring */}
      <div className="relative mt-5 size-28 shrink-0">
        <svg className="size-28 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="#e2e2e5" strokeWidth="7" />
          <circle
            cx="32" cy="32" r={radius}
            fill="none"
            stroke={pct === 100 ? '#30d158' : '#0071e3'}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[26px] font-bold tabular-nums tracking-tight text-[#1d1d1f]">
          {hasSetup ? `${pct}%` : '—'}
        </span>
      </div>

      {/* Checklist — centered, stacked, responsive */}
      <div className="mt-5 w-full max-w-[220px] space-y-2.5">
        {sections.map((s) => (
          <div
            key={s.key}
            className="flex items-center justify-center gap-2 text-[13px] text-[#707070]"
          >
            {s.done ? (
              <svg className="size-4 shrink-0 text-[#30d158]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="size-4 shrink-0 text-[#b0b0b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            )}
            <span className="capitalize">{t(s.key)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
