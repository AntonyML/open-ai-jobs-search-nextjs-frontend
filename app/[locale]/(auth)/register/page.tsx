'use client'
import { FormEvent, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import TermsModal from '@/components/TermsModal'
import Logo from '@/components/Logo'

export default function Register() {
  const t = useTranslations('auth')
  const tReconnect = useTranslations('reconnect')
  const router = useRouter()
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isWaking, setIsWaking] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const set = (k: string, v: string) => setForm({ ...form, [k]: v })

  async function submit(e: FormEvent) {
    e.preventDefault()
    // If terms not yet accepted, open modal first
    if (!termsAccepted) {
      setShowTerms(true)
      return
    }
    await doRegister()
  }

  async function doRegister() {
    setLoading(true)
    setError('')
    setIsWaking(false)
    const wakingTimer = setTimeout(() => setIsWaking(true), 2500)
    try {
      await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      showSuccess(t('registerSuccess'))
      router.push('/login')
    } catch (x) {
      const msg = x instanceof Error ? x.message : t('registerError'); setError(msg); showError(msg)
    } finally {
      clearTimeout(wakingTimer)
      setIsWaking(false)
      setLoading(false)
    }
  }

  function handleTermsAccept() {
    setTermsAccepted(true)
    setShowTerms(false)
    // Proceed with registration after accepting
    doRegister()
  }

  function handleTermsDecline() {
    setShowTerms(false)
  }

  return (
    <>
      {/* ── Terms Modal ────────────────────────────────────────────── */}
      {showTerms && (
        <TermsModal
          onAccept={handleTermsAccept}
          onDecline={handleTermsDecline}
        />
      )}

      <main className="flex min-h-screen bg-[#f5f5f7]">
        {/* Left: Brand panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1d1d1f] to-[#333333] items-center justify-center p-12">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              <span className="text-sm font-medium">{t('backToHome')}</span>
            </Link>

            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white ring-1 ring-white/15">
              <Logo size={30} />
            </div>

            <h2 className="text-[32px] font-semibold text-white tracking-tight leading-tight">
              {t('brandRegisterTitle')}
            </h2>
            <p className="mt-4 text-[17px] text-[#a0a0a0] font-light leading-relaxed">
              {t('brandRegisterSubtitle')}
            </p>
          </div>
        </div>

        {/* Right: Form panel */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-8">
              <Link href="/" className="inline-flex items-center gap-2 text-[#707070] hover:text-[#1d1d1f] transition-colors mb-6">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                <span className="text-sm">{t('back')}</span>
              </Link>
            </div>

            <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">{t('registerTitle')}</h1>
            <p className="mt-2 text-[14px] text-[#707070]">{t('registerSubtitleAlt')}</p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label className="block text-[12px] font-medium text-[#474747] mb-1.5">{t('name')}</label>
                <input
                  required
                  type="text"
                  placeholder="Jane Doe"
                  value={form.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[14px] text-[#1d1d1f] placeholder:text-[#858585] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#474747] mb-1.5">{t('email')}</label>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[14px] text-[#1d1d1f] placeholder:text-[#858585] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                />
                <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>{t('emailCorrelationNotice')}</span>
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#474747] mb-1.5">{t('password')}</label>
                <div className="relative">
                  <input
                    required
                    autoComplete="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('enterPassword')}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 pr-12 text-[14px] text-[#1d1d1f] placeholder:text-[#858585] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-[#858585] hover:text-[#474747] transition-colors"
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              )}

              {/* Terms notice */}
              <div className="rounded-xl border border-[#e2e2e5] bg-[#fafafa] px-4 py-3 text-[12px] text-[#707070] leading-relaxed">
                <span className="font-semibold text-[#474747]">Al crear tu cuenta</span>, deberás leer y aceptar nuestros{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-[#0066cc] hover:underline font-medium"
                >
                  Términos de Servicio
                </button>
                {' '}y{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-[#0066cc] hover:underline font-medium"
                >
                  Política de Privacidad
                </button>
                {' '}(Ley 8968 Costa Rica).
                {termsAccepted && (
                  <span className="flex items-center gap-1.5 mt-2 text-[#34c759] font-medium">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Términos aceptados
                  </span>
                )}
              </div>

              {loading && isWaking && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/80 px-3.5 py-2.5 text-[12px] text-[#0066cc] animate-in fade-in-0 duration-300">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0071e3] animate-pulse" />
                  <span>{tReconnect('authWaking')}</span>
                </div>
              )}

              <button
                disabled={loading}
                className="w-full rounded-full bg-[#0071e3] px-5 py-3 text-[14px] font-medium text-white hover:bg-[#0068d2] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {loading ? t('registering') : termsAccepted ? t('registerButton') : 'Leer y aceptar términos →'}
              </button>
            </form>

            <p className="mt-6 text-center text-[13px] text-[#858585]">
              {t('hasAccount')}{' '}
              <Link className="text-[#0066cc] hover:underline font-medium" href="/login">
                {t('signInLink')}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
