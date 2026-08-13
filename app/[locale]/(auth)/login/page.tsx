'use client'
import { FormEvent, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { setToken } from '@/lib/auth'
import { showError } from '@/lib/toasts'
import Logo from '@/components/Logo'

export default function Login() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<{ access_token: string }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(data.access_token)
      router.push('/dashboard')      } catch (x) {
      const msg = x instanceof Error ? x.message : 'Unable to sign in'
      setError(msg)
      showError(msg)
    } finally {
      setLoading(false)
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

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-full bg-[#0071e3] px-5 py-3 text-[14px] font-medium text-white hover:bg-[#0068d2] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {loading ? t('loggingIn') : t('loginButton')}
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
