'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { clearToken } from '@/lib/auth'
import { showError } from '@/lib/toasts'
import { cn } from '@/lib/utils'
import AccessibilitySettings from '@/components/AccessibilitySettings'

const PROFILE_TABS = ['Experience', 'Education', 'Projects', 'Skills'] as const
type ProfileTab = (typeof PROFILE_TABS)[number]

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [usageData, setUsageData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<ProfileTab>('Experience')

  useEffect(() => {
    Promise.all([
      apiFetch<any>('/api/v1/providers/me/active').catch(() => null),
      apiFetch<any>('/api/v1/setup/profile').catch(() => null),
      apiFetch<any>('/api/v1/dashboard/stats').catch(() => null),
      apiFetch<any>('/api/v1/users/usage').catch(() => null),
    ])
      .then(([active, setupProfile, dashboardStats, userUsage]) => {
        const hasProvider = active?.provider && active.provider !== 'Not configured'
        const hasProfile = setupProfile !== null

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
        setStats(dashboardStats)
        setUsageData(userUsage)
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
  const hasProvider = !!profile?.activeProvider

  return (
    <section className="mx-auto max-w-3xl py-8 md:py-12">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="mb-10 animate-fade-in-up">
        <p className="eyebrow">Settings</p>
        <h1 className="mt-3 text-[40px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.1]">
          Profile
        </h1>
        <p className="subtitle mt-2">
          Manage your account, connected provider, and personal details.
        </p>
      </div>

      {error && (
        <div className="mb-6 animate-fade-in-up rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* ── Profile Hero Card ──────────────────────────────────── */}
      <div className="card mb-5 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        {profile?.name ? (
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="size-14 rounded-full bg-[#0071e3] flex items-center justify-center text-white text-xl font-semibold select-none shadow-sm">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                {hasProvider && (
                  <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-[#30d158] border-2 border-white" role="status" aria-label="Provider connected" title="Provider connected" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1d1d1f]">{profile.name}</h2>
                {profile.email && (
                  <p className="text-sm text-[#707070] flex items-center gap-1.5 mt-0.5">
                    <svg className="size-3.5 text-[#b0b0b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    {profile.email}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-[#d2d2d7] px-4 py-2 text-[12px] font-medium text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all shrink-0"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-full bg-[#e2e2e5] flex items-center justify-center text-[#b0b0b0] shrink-0">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[#1d1d1f]">Aún no has configurado tu perfil</p>
              <p className="text-[12px] text-[#858585] mt-0.5">Agrega tu experiencia, educación y habilidades para empezar</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Provider & Setup Quick Status ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
        {/* Provider card */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow !text-[#0071e3]">Active Provider</p>
            <Link
              href="/pipeline/providers"
              className="btn-ghost text-[11px]"
            >
              {hasProvider ? 'Change' : 'Connect'}
            </Link>
          </div>
          {hasProvider ? (
            <div>
              <p className="text-[15px] font-medium text-[#1d1d1f]">{profile.activeProvider}</p>
              {profile.activeModel && (
                <p className="text-[13px] text-[#707070] mt-0.5">Model: {profile.activeModel}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[13px] text-[#707070]">No AI provider connected</p>
              <p className="text-[11px] text-[#b0b0b0] mt-0.5">Connect an API key to use AI services</p>
            </div>
          )}
        </div>

        {/* Profile status card */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow !text-[#0071e3]">Profile</p>
            <Link
              href={hasSetup ? '/setup' : '/pipeline/setup'}
              className="btn-ghost text-[11px]"
            >
              {hasSetup ? 'Edit' : 'Setup'}
            </Link>
          </div>
          {hasSetup ? (
            <div className="flex items-center gap-2">
              <svg className="size-4 text-[#30d158]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <p className="text-[13px] text-[#1d1d1f]">
                {setup.experience?.length || 0} experiences · {setup.education?.length || 0} educations · {setup.skills?.software_tools?.length || 0} skills
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[13px] text-[#707070]">Not configured yet</p>
              <p className="text-[11px] text-[#b0b0b0] mt-0.5">Add experience, education &amp; skills</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Profile Details ────────────────────────────────────── */}
      {hasSetup && (
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Section header */}
          <div className="flex items-center justify-between mb-6">
            <p className="eyebrow !text-[#0071e3]">Profile Details</p>
          </div>

          {/* Apple-style tab pills */}
          <div className="tab-group mb-6" role="tablist" aria-label="Profile detail sections">
            {PROFILE_TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`panel-${tab.toLowerCase()}`}
                onClick={() => setActiveTab(tab)}
                className={cn('tab-pill', activeTab === tab && 'active')}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content with transition */}
          <div className="transition-opacity duration-300">
            {activeTab === 'Experience' && (
              <TabContent key="experience" id="panel-experience" role="tabpanel" aria-labelledby="experiences-tab">
                {setup.experience?.length ? (
                  <div className="space-y-3">
                    {setup.experience.map((exp: any, i: number) => (
                      <div key={i} className="rounded-lg border border-[#e2e2e5] bg-[#fafafa] p-4 hover:bg-white hover:border-[#d2d2d7] transition-all">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-[#1d1d1f]">
                              {exp.title || '—'}
                              {exp.company && <span className="text-[#707070] font-normal"> at {exp.company}</span>}
                            </p>
                            {(exp.start_date || exp.end_date) && (
                              <p className="text-[11px] text-[#b0b0b0] mt-1">
                                {exp.start_date || '?'} — {exp.end_date || 'Present'}
                              </p>
                            )}
                          </div>
                          {exp.location && (
                            <span className="text-[11px] text-[#858585] shrink-0 ml-2">{exp.location}</span>
                          )}
                        </div>
                        {exp.bullets?.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {exp.bullets.slice(0, 3).map((b: string, j: number) => (
                              <li key={j} className="text-[12px] text-[#707070] leading-relaxed pl-3 relative before:absolute before:left-0 before:top-[7px] before:size-1 before:rounded-full before:bg-[#b0b0b0]">
                                {b}
                              </li>
                            ))}
                            {exp.bullets.length > 3 && (
                              <li className="text-[11px] text-[#b0b0b0] pl-3">+{exp.bullets.length - 3} more bullet points</li>
                            )}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptySection message="No experience added yet." />
                )}
              </TabContent>
            )}

            {activeTab === 'Education' && (
              <TabContent key="education" id="panel-education" role="tabpanel" aria-labelledby="education-tab">
                {setup.education?.length ? (
                  <div className="space-y-3">
                    {setup.education.map((edu: any, i: number) => (
                      <div key={i} className="rounded-lg border border-[#e2e2e5] bg-[#fafafa] p-4 hover:bg-white hover:border-[#d2d2d7] transition-all">
                        <p className="text-sm font-medium text-[#1d1d1f]">
                          {edu.degree || '—'}
                          {edu.institution && <span className="text-[#707070] font-normal"> @ {edu.institution}</span>}
                        </p>
                        {edu.period && (
                          <p className="text-[11px] text-[#b0b0b0] mt-1">{edu.period}</p>
                        )}
                        {edu.key_topics && (
                          <p className="text-[12px] text-[#858585] mt-1.5">{edu.key_topics}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptySection message="No education added yet." />
                )}
              </TabContent>
            )}

            {activeTab === 'Projects' && (
              <TabContent key="projects" id="panel-projects" role="tabpanel" aria-labelledby="projects-tab">
                {setup.projects?.length ? (
                  <div className="space-y-3">
                    {setup.projects.map((proj: any, i: number) => (
                      <div key={i} className="rounded-lg border border-[#e2e2e5] bg-[#fafafa] p-4 hover:bg-white hover:border-[#d2d2d7] transition-all">
                        <p className="text-sm font-medium text-[#1d1d1f]">{proj.name || '—'}</p>
                        {proj.description && (
                          <p className="text-[12px] text-[#707070] mt-1.5 leading-relaxed">{proj.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptySection message="No projects added yet." />
                )}
              </TabContent>
            )}

            {activeTab === 'Skills' && (
              <TabContent key="skills" id="panel-skills" role="tabpanel" aria-labelledby="skills-tab">
                {setup.skills?.software_tools?.length || setup.skills?.programming_ml?.length ? (
                  <div className="space-y-4">
                    {setup.skills?.software_tools?.length > 0 && (
                      <div>
                        <p className="text-[11px] text-[#858585] uppercase tracking-wider mb-2.5 font-semibold">Software &amp; Tools</p>
                        <div className="flex flex-wrap gap-2">
                          {setup.skills.software_tools.map((skill: string) => (
                            <span
                              key={skill}
                              className="tag-filled bg-[#f5f5f7] text-[#474747] border border-[#e2e2e5]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {setup.skills?.programming_ml?.length > 0 && (
                      <div>
                        <p className="text-[11px] text-[#858585] uppercase tracking-wider mb-2.5 font-semibold">Programming &amp; ML</p>
                        <div className="flex flex-wrap gap-2">
                          {setup.skills.programming_ml.map((s: any) => (
                            <span
                              key={s.language || s}
                              className="tag-filled bg-[#f5f5f7] text-[#474747] border border-[#e2e2e5]"
                            >
                              {s.language || s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptySection message="No skills added yet." />
                )}
              </TabContent>
            )}
          </div>
        </div>
      )}

      {/* ── Activity & Usage ──────────────────────────────────── */}
      <div className="mt-7 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <div className="card">
          <p className="eyebrow !text-[#0071e3] mb-5">Activity &amp; Usage</p>

          {/* Usage meters */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <UsageMeter
              label="Applications"
              used={usageData?.usage?.applications ?? 0}
              max={usageData?.limits?.max_apply_count ?? 5}
              icon={
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              }
              color="#0071e3"
            />
            <UsageMeter
              label="Interview Preps"
              used={usageData?.usage?.interview_preps ?? 0}
              max={usageData?.limits?.max_prepare_count ?? 5}
              icon={
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              }
              color="#30d158"
            />
            <UsageMeter
              label="Rankings"
              used={usageData?.usage?.rank_iterations ?? 0}
              max={usageData?.limits?.max_rank_iterations ?? 3}
              icon={
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              }
              color="#ff9f0a"
            />
            <UsageMeter
              label="Outcomes Tracked"
              used={usageData?.usage?.outcomes ?? 0}
              max={usageData?.limits?.max_track_count ?? 5}
              icon={
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
              color="#bf5af2"
            />
          </div>

          {/* Separator */}
          <hr className="border-t border-[#e2e2e5] mb-5" />

          {/* Pipeline funnel summary */}
          {stats ? (
            <div>
              <p className="text-[11px] text-[#858585] uppercase tracking-wider font-semibold mb-3">Pipeline Overview</p>
              <div className="grid grid-cols-5 gap-2">
                <FunnelStage
                  label="Scraped"
                  count={stats.jobs_scraped}
                  color="#0071e3"
                  isFirst
                />
                <FunnelStage
                  label="Ranked"
                  count={stats.jobs_ranked}
                  color="#30d158"
                />
                <FunnelStage
                  label="Applied"
                  count={stats.applications}
                  color="#ff9f0a"
                />
                <FunnelStage
                  label="Interviews"
                  count={stats.interviews}
                  color="#bf5af2"
                />
                <FunnelStage
                  label="Hired"
                  count={stats.hired}
                  color="#ff375f"
                  isLast
                />
              </div>
              {stats.avg_rank_score != null && (
                <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[#858585]">
                  <svg className="size-3 text-[#ff9f0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                  Avg. rank score: <span className="font-medium text-[#1d1d1f]">{stats.avg_rank_score}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <div className="skeleton h-12 w-full rounded-lg" />
            </div>
          )}
        </div>
      </div>

      {/* ── Accessibility Settings ─────────────────────────────── */}
      <div className="mt-7 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="card">
          <p className="eyebrow !text-[#0071e3] mb-3">Accessibility</p>
          <p className="text-[13px] text-[#707070] mb-4">
            Customize your reading and visual experience.
          </p>
          <AccessibilitySettings />
        </div>
      </div>
    </section>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

function TabContent({ children, ...props }: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="animate-fade-in-up" {...props}>
      {children}
    </div>
  )
}

/* ── Usage & Activity Sub-components ──────────────────────── */

function UsageMeter({ label, used, max, icon, color }: {
  label: string
  used: number
  max: number
  icon: React.ReactNode
  color: string
}) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0
  const isNearLimit = pct >= 80

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#858585]">
          <span style={{ color }}>{icon}</span>
          <span>{label}</span>
        </div>
        <span className={cn(
          'text-[12px] font-medium tabular-nums',
          isNearLimit ? 'text-[#ff9f0a]' : 'text-[#1d1d1f]'
        )}>
          {used}<span className="text-[#b0b0b0]">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#e2e2e5] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: isNearLimit ? '#ff9f0a' : color,
          }}
        />
      </div>
    </div>
  )
}

function FunnelStage({ label, count, color, isFirst, isLast }: {
  label: string
  count: number
  color: string
  isFirst?: boolean
  isLast?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'w-full rounded-lg py-2.5 text-center transition-all hover:opacity-80',
          isFirst && 'rounded-l-lg',
          isLast && 'rounded-r-lg'
        )}
        style={{ backgroundColor: `${color}12` }}
      >
        <p className="text-[16px] font-semibold tabular-nums" style={{ color }}>
          {count}
        </p>
      </div>
      <p className="text-[10px] text-[#858585] uppercase tracking-wider font-medium">
        {label}
      </p>
    </div>
  )
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="size-10 rounded-full bg-[#f5f5f7] flex items-center justify-center mb-3">
        <svg className="size-5 text-[#b0b0b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      </div>
      <p className="text-[13px] text-[#b0b0b0]">{message}</p>
      <Link
        href="/pipeline/setup"
        className="btn-ghost text-[12px] mt-2"
      >
        Go to profile setup
      </Link>
    </div>
  )
}
