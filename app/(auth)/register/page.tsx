'use client'
import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const set = (k: string, v: string) => setForm({ ...form, [k]: v })

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      showSuccess('Account created! Sign in to continue.')
      router.push('/login')
    } catch (x) {
      const msg = x instanceof Error ? x.message : 'Registration failed'; setError(msg); showError(msg)
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
            <span className="text-sm font-medium">Back to home</span>
          </Link>

          <div className="h-12 w-12 rounded-xl bg-[#0071e3] flex items-center justify-center mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          <h2 className="text-[32px] font-semibold text-white tracking-tight leading-tight">
            Start your journey in seconds
          </h2>
          <p className="mt-4 text-[17px] text-[#a0a0a0] font-light leading-relaxed">
            No credit card required. Connect your preferred AI provider and start ranking jobs immediately.
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
              <span className="text-sm">Back</span>
            </Link>
          </div>

          <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">Create your account</h1>
          <p className="mt-2 text-[14px] text-[#707070]">Start your AI-powered job search.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="block text-[12px] font-medium text-[#474747] mb-1.5">Full name</label>
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
              <label className="block text-[12px] font-medium text-[#474747] mb-1.5">Email</label>
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[14px] text-[#1d1d1f] placeholder:text-[#858585] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#474747] mb-1.5">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 pr-12 text-[14px] text-[#1d1d1f] placeholder:text-[#858585] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-[#858585] hover:text-[#474747] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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

            <p className="text-[11px] text-[#858585] leading-relaxed">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-[#0066cc] hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-[#0066cc] hover:underline">Privacy Policy</a>.
            </p>

            <button
              disabled={loading}
              className="w-full rounded-full bg-[#0071e3] px-5 py-3 text-[14px] font-medium text-white hover:bg-[#0068d2] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[#858585]">
            Already registered?{' '}
            <Link className="text-[#0066cc] hover:underline font-medium" href="/login">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
