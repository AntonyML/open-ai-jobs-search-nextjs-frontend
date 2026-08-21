'use client'
import { FormEvent, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch, ApiError } from '@/lib/api'
import { setToken } from '@/lib/auth'
import Logo from '@/components/Logo'

export type LoginStatus = 'idle' | 'submitting' | 'waiting_for_backend' | 'delayed'

export default function Login() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<LoginStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isPending = status === 'submitting' || status === 'waiting_for_backend'

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage('')
    setStatus('submitting')

    const slowTimer = setTimeout(() => {
      setStatus('waiting_for_backend')
    }, 2000)

    const MAX_RETRIES = 3
    const RETRY_DELAYS = [2500, 3500]
    let attempt = 0

    try {
      while (attempt < MAX_RETRIES) {
        try {
          const data = await apiFetch<{ access_token: string }>(
            '/api/v1/auth/login',
            {
              method: 'POST',
              body: JSON.stringify({ email, password }),
            },
            { timeoutMs: 8000 }
          )

          clearTimeout(slowTimer)
          setToken(data.access_token)
          router.push('/dashboard')
          return
        } catch (err) {
          const apiErr = err instanceof ApiError ? err : new ApiError(String(err), 0)

          // If unauthorized (invalid credentials), do not retry
          if (apiErr.kind === 'unauthorized' || apiErr.status === 401) {
            clearTimeout(slowTimer)
            setStatus('idle')
            setErrorMessage(t('invalidCredentials'))
            return
          }

          // Client validation errors (400, 422)
          if (apiErr.status >= 400 && apiErr.status < 500) {
            clearTimeout(slowTimer)
            setStatus('idle')
            setErrorMessage(apiErr.message)
            return
          }

          // Network or server 5xx (waking/offline): retry silently with calming UX
          attempt += 1
          if (attempt < MAX_RETRIES) {
            setStatus('waiting_for_backend')
            const delay = RETRY_DELAYS[attempt - 1] ?? 3000
            await new Promise((r) => setTimeout(r, delay))
          }
        }
      }

      // If exhausted:
      clearTimeout(slowTimer)
      setStatus('delayed')
      setErrorMessage(t('serviceDelayed'))
    } finally {
      clearTimeout(slowTimer)
    }
  }

  return (
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
            {t('brandTitle')}
          </h2>
          <p className="mt-4 text-[17px] text-[#a0a0a0] font-light leading-relaxed">
            {t('brandSubtitle')}
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

          <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">{t('loginTitle')}</h1>
          <p className="mt-2 text-[14px] text-[#707070]">{t('loginSubtitleAlt')}</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="block text-[12px] font-medium text-[#474747] mb-1.5">{t('email')}</label>
              <input
                required
                autoComplete="username"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[14px] text-[#1d1d1f] placeholder:text-[#858585] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#474747] mb-1.5">{t('password')}</label>
              <div className="relative">
                <input
                  required
                  autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('enterPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {errorMessage && (
              <div className={`rounded-xl px-4 py-3 text-[13px] leading-relaxed shadow-sm transition-all duration-300 animate-in fade-in-0 slide-in-from-top-1 ${
                status === 'delayed'
                  ? 'border border-amber-200/80 bg-amber-50/90 text-amber-900'
                  : 'border border-rose-200 bg-rose-50 text-rose-700'
              }`}>
                {errorMessage}
              </div>
            )}

            {status === 'waiting_for_backend' && (
              <div className="flex items-center gap-3 rounded-xl border border-blue-200/70 bg-blue-50/90 p-3.5 text-[13px] text-[#0066cc] shadow-sm transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-1">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0071e3] opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#0071e3]"></span>
                </span>
                <span className="font-medium leading-relaxed">
                  {t('waitingForBackend')}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-full bg-[#0071e3] px-5 py-3 text-[14px] font-medium text-white hover:bg-[#0068d2] disabled:opacity-75 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isPending && (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              <span>
                {status === 'waiting_for_backend'
                  ? t('loggingIn')
                  : status === 'submitting'
                    ? t('loggingIn')
                    : status === 'delayed'
                      ? t('retryButton')
                      : t('loginButton')}
              </span>
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[#858585]">
            {t('noAccount')}{' '}
            <Link className="text-[#0066cc] hover:underline font-medium" href="/register">
              {t('createOne')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
