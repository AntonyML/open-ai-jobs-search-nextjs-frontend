'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { clearToken } from '@/lib/auth'
import { showError } from '@/lib/toasts'
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
        const hasProvider = active?.provider && active.provider !== 'Not configured'
        const hasProfile = setupProfile !== null

        // Redirect new users to pipeline setup on first visit
        if (!hasProvider && !hasProfile) {
          router.replace('/pipeline/providers')
          return
        }

        setProfile({
          activeProvider: active?.provider || null,
          activeModel: active?.model || null,
          setup: setupProfile,
          email: active?.email || setupProfile?.email || null,
          name: setupProfile?.full_name || active?.full_name || null,
        })
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load profile')
        showError('Could not load profile')
        setLoading(false)
      })
  }, [router])

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
        {profile?.name ? (
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-[#0071e3] flex items-center justify-center text-white text-xl font-semibold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1d1d1f]">{profile.name}</h2>
                {profile.email && <p className="text-sm text-[#707070]">{profile.email}</p>}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-[#d2d2d7] px-4 py-2 text-[12px] font-medium text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-[#e2e2e5] flex items-center justify-center text-[#b0b0b0]">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1d1d1f]">Aún no has configurado tu perfil</p>
                <p className="text-[12px] text-[#858585] mt-0.5">Agrega tu experiencia, educación y habilidades para empezar</p>
              </div>
            </div>
            <Link
              href="/pipeline/setup"
              className="rounded-full bg-[#0071e3] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#0077ed] transition-all shrink-0"
            >
              Configurar perfil
            </Link>
          </div>
        )}
      </div>

      {/* Active provider card */}
      <div className="rounded-xl border border-[#d2d2d7] bg-white p-6 mb-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-4">Active Provider</h3>
        {profile?.activeProvider ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-medium text-[#1d1d1f]">{profile.activeProvider}</p>
              {profile.activeModel && <p className="text-[13px] text-[#707070] mt-0.5">Model: {profile.activeModel}</p>}
            </div>
            <Link
              href="/pipeline/providers"
              className="rounded-full border border-[#0066cc] px-4 py-1.5 text-[12px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-all"
            >
              Change
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#707070]">No has conectado ningún proveedor IA</p>
              <p className="text-[12px] text-[#b0b0b0] mt-0.5">Conecta una API key para usar los servicios de IA</p>
            </div>
            <Link
              href="/pipeline/providers"
              className="rounded-full bg-[#0071e3] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#0077ed] transition-all"
            >
              Conectar proveedor
            </Link>
          </div>
        )}
      </div>

      {/* Profile summary */}
      {profile?.setup && (
        <div className="rounded-xl border border-[#d2d2d7] bg-white p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">Profile Summary</h3>
            <Link
              href="/setup"
              className="text-[12px] font-medium text-[#0066cc] hover:underline"
            >
              Edit
            </Link>
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
              <p className="text-[11px] text-[#858585] uppercase tracking-wider mb-2">Experience</p>
              {profile.setup.experience?.length ? (
                <div className="space-y-2">
                  {profile.setup.experience.map((exp: any, i: number) => (
                    <div key={i} className="rounded-lg border border-[#e2e2e5] bg-[#fafafa] p-3">
                      <p className="text-sm font-medium text-[#1d1d1f]">
                        {exp.title || '—'}
                        {exp.company ? <span className="text-[#707070]"> at {exp.company}</span> : ''}
                      </p>
                      {(exp.start_date || exp.end_date) && (
                        <p className="text-[11px] text-[#b0b0b0] mt-0.5">
                          {exp.start_date || '?'} — {exp.end_date || 'Present'}
                        </p>
                      )}
                      {exp.location && (
                        <p className="text-[11px] text-[#b0b0b0]">{exp.location}</p>
                      )}
                      {exp.bullets?.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {exp.bullets.slice(0, 3).map((b: string, j: number) => (
                            <li key={j} className="text-[11px] text-[#707070] list-disc list-inside leading-tight">{b}</li>
                          ))}
                          {exp.bullets.length > 3 && (
                            <li className="text-[11px] text-[#b0b0b0] list-inside">+{exp.bullets.length - 3} more</li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#1d1d1f]">—</p>
              )}
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-[#858585] uppercase tracking-wider mb-2">Education</p>
              {profile.setup.education?.length ? (
                <div className="space-y-2">
                  {profile.setup.education.map((edu: any, i: number) => (
                    <div key={i} className="rounded-lg border border-[#e2e2e5] bg-[#fafafa] p-3">
                      <p className="text-sm font-medium text-[#1d1d1f]">
                        {edu.degree || '—'}
                        {edu.institution ? <span className="text-[#707070]"> @ {edu.institution}</span> : ''}
                      </p>
                      {edu.period && (
                        <p className="text-[11px] text-[#b0b0b0] mt-0.5">{edu.period}</p>
                      )}
                      {edu.key_topics && (
                        <p className="text-[11px] text-[#858585] mt-0.5 line-clamp-1">{edu.key_topics}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#1d1d1f]">—</p>
              )}
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-[#858585] uppercase tracking-wider mb-2">Projects</p>
              {profile.setup.projects?.length ? (
                <div className="space-y-2">
                  {profile.setup.projects.map((proj: any, i: number) => (
                    <div key={i} className="rounded-lg border border-[#e2e2e5] bg-[#fafafa] p-3">
                      <p className="text-sm font-medium text-[#1d1d1f]">{proj.name || '—'}</p>
                      {proj.description && (
                        <p className="text-[11px] text-[#707070] mt-0.5 leading-snug line-clamp-2">{proj.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#1d1d1f]">—</p>
              )}
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
