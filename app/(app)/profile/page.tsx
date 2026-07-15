'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { clearToken } from '@/lib/auth'
import AccessibilitySettings from '@/components/AccessibilitySettings'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch user profile from providers/me as the best available source
  useEffect(() => {
    Promise.all([
      apiFetch<any>('/api/v1/providers/me/active').catch(() => null),
      apiFetch<any>('/api/v1/setup/profile').catch(() => null),
    ])
      .then(([active, setupProfile]) => {
        setProfile({
          activeProvider: active?.provider || 'Not configured',
          activeModel: active?.model || '—',
          setup: setupProfile,
          email: active?.email || setupProfile?.email || '—',
          name: setupProfile?.full_name || active?.full_name || 'User',
        })
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load profile')
        setLoading(false)
      })
  }, [])

  const handleSignOut = () => {
    clearToken()
    router.push('/')
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl py-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-[#e2e2e5] rounded-lg" />
          <div className="h-4 w-72 bg-[#e2e2e5] rounded-lg" />
          <div className="h-32 bg-[#e2e2e5] rounded-xl" />
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl py-8 md:py-12">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">Settings</p>
        <h1 className="mt-2 text-[32px] font-semibold tracking-tight text-[#1d1d1f]">Profile</h1>
        <p className="mt-2 text-[14px] text-[#707070]">Manage your account and preferences.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Account info card */}
      <div className="rounded-xl border border-[#d2d2d7] bg-white p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-[#0071e3] flex items-center justify-center text-white text-xl font-semibold">
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f]">{profile?.name || 'User'}</h2>
              <p className="text-sm text-[#707070]">{profile?.email || '—'}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-full border border-[#d2d2d7] px-4 py-2 text-[12px] font-medium text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Active provider card */}
      <div className="rounded-xl border border-[#d2d2d7] bg-white p-6 mb-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-4">Active Provider</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-medium text-[#1d1d1f]">{profile?.activeProvider || 'Not configured'}</p>
            <p className="text-[13px] text-[#707070] mt-0.5">Model: {profile?.activeModel || '—'}</p>
          </div>
          <a
            href="/providers"
            className="rounded-full border border-[#0066cc] px-4 py-1.5 text-[12px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-all"
          >
            Change
          </a>
        </div>
      </div>

      {/* Profile summary */}
      {profile?.setup && (
        <div className="rounded-xl border border-[#d2d2d7] bg-white p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">Profile Summary</h3>
            <a
              href="/setup"
              className="text-[12px] font-medium text-[#0066cc] hover:underline"
            >
              Edit
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[11px] text-[#858585] uppercase tracking-wider">Location</p>
              <p className="text-[#1d1d1f]">{profile.setup.location || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#858585] uppercase tracking-wider">Phone</p>
              <p className="text-[#1d1d1f]">{profile.setup.phone || '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-[#858585] uppercase tracking-wider">Current Role</p>
              <p className="text-[#1d1d1f]">
                {profile.setup.experience?.[0]?.title || '—'}
                {profile.setup.experience?.[0]?.company ? ` at ${profile.setup.experience[0].company}` : ''}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-[#858585] uppercase tracking-wider">Skills</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(profile.setup.skills?.software_tools || [])
                  .concat(profile.setup.skills?.programming_ml?.map((s: any) => s.language || s) || [])
                  .slice(0, 8)
                  .map((skill: string) => (
                    <span
                      key={skill}
                      className="rounded-full border border-[#e2e2e5] bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] text-[#474747]"
                    >
                      {skill}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="rounded-xl border border-[#d2d2d7] bg-white p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Job Pipeline', href: '/providers' },
            { label: 'Providers', href: '/providers' },
            { label: 'Profile Setup', href: '/setup' },
            { label: 'Rankings', href: '/rank' },
            { label: 'LLM Status', href: '/providers' },
          ].map(link => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-lg border border-[#e2e2e5] px-3 py-2.5 text-[13px] font-medium text-[#474747] hover:border-[#0071e3]/30 hover:text-[#0071e3] transition-all"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Accessibility Settings ──────────────────────────────── */}
      <div className="mb-6">
        <AccessibilitySettings />
      </div>
    </section>
  )
}
