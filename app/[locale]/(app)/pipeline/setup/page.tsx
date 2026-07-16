'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { showSuccess, showError } from '@/lib/toasts'
import { getCompletedSteps, setCompletedSteps } from '@/lib/auth'
import { PipelineHeader } from '@/components/ui/pipeline-header'
import { AppleButton } from '@/components/ui/apple-button'
import { StatusPanel } from '@/components/setup/StatusPanel'
import {
  CollapsibleCard,
  CollapsibleCardListWrapper,
} from '@/components/setup/CollapsibleCard'
import { BehavioralProfileSection } from '@/components/setup/BehavioralProfileSection'
import { StarExamplesSection } from '@/components/setup/StarExamplesSection'

// ── Types ──────────────────────────────────────────────────────────

interface ProjectEntry {
  _id: string
  name: string
  description: string
}

interface EducationEntry {
  _id: string
  degree: string
  institution: string
  period: string
  key_topics: string
}

interface ExperienceEntry {
  _id: string
  title: string
  company: string
  start_date: string
  end_date: string
  location: string
  bullets: string[]
}

interface BehavioralProfile {
  id?: string
  profile_type?: string
  summary?: string
  drives?: { drive: string; level?: string; meaning?: string }[]
  behaviors?: { behavior: string; description?: string }[]
  work_preferences?: string[]
  growth_areas?: { area: string; positive_frame?: string }[]
  strong_fit_keywords?: string[]
  friction_keywords?: string[]
  management_preferences?: { works_with: string[]; doesnt_work: string[] }
}

interface StarExample {
  id: string
  title: string
  skill_demonstrated?: string
  situation: string
  task: string
  action: string
  result: string
  use_for?: string[]
  created_at: string
}

// ── Helpers ─────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

const emptyProject = (): ProjectEntry => ({
  _id: generateId(),
  name: '',
  description: '',
})

const emptyEducation = (): EducationEntry => ({
  _id: generateId(),
  degree: '',
  institution: '',
  period: '',
  key_topics: '',
})

const emptyExperience = (): ExperienceEntry => ({
  _id: generateId(),
  title: '',
  company: '',
  start_date: '',
  end_date: '',
  location: '',
  bullets: [],
})

// ── Section icons (reusable) ──────────────────────────────────────

const SectionIcon = ({
  bg,
  children,
}: {
  bg: string
  children: React.ReactNode
}) => (
  <div
    className={`flex h-8 w-8 items-center justify-center rounded-full ${bg}`}
  >
    {children}
  </div>
)

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════

export default function Setup() {
  const t = useTranslations('setup')
  const tc = useTranslations('common')
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [exists, setExists] = useState(false)

  // ── Profile form ─────────────────────────────────────────
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    skills_raw: '',
    profile_statement: '',
  })

  // ── Dynamic arrays ─────────────────────────────────────
  const [projects, setProjects] = useState<ProjectEntry[]>([emptyProject()])
  const [educations, setEducations] = useState<EducationEntry[]>([emptyEducation()])
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([emptyExperience()])

  // ── Behavioral profile & STAR data (from API) ──────────
  const [bpData, setBpData] = useState<BehavioralProfile>({})
  const [starData, setStarData] = useState<StarExample[]>([])

  // ── Collapse state ────────────────────────────────────
  const [openExpCards, setOpenExpCards] = useState<Set<string>>(new Set())
  const [openEduCards, setOpenEduCards] = useState<Set<string>>(new Set())
  const [openProjectCards, setOpenProjectCards] = useState<Set<string>>(new Set())

  function toggleCards(setter: typeof setOpenExpCards, id: string) {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Update helpers ───────────────────────────────────
  function f(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function updateExp(id: string, key: keyof ExperienceEntry, value: any) {
    setExperiences((prev) =>
      prev.map((e) => (e._id === id ? { ...e, [key]: value } : e))
    )
  }

  function updateBullets(id: string, raw: string) {
    setExperiences((prev) =>
      prev.map((e) =>
        e._id === id
          ? { ...e, bullets: raw.split('\n').map((s) => s.trim()).filter(Boolean) }
          : e
      )
    )
  }

  function updateEdu(id: string, key: keyof EducationEntry, value: string) {
    setEducations((prev) =>
      prev.map((e) => (e._id === id ? { ...e, [key]: value } : e))
    )
  }

  function updateProject(id: string, key: keyof ProjectEntry, value: string) {
    setProjects((prev) =>
      prev.map((p) => (p._id === id ? { ...p, [key]: value } : p))
    )
  }

  // ── Load data ─────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch<any>('/api/v1/setup/profile').catch(() => null),
      apiFetch<BehavioralProfile>('/api/v1/setup/behavioral-profile').catch(() => null),
      apiFetch<StarExample[]>('/api/v1/setup/star-examples').catch(() => []),
    ])
      .then(([profile, bp, stars]) => {
        if (profile) {
          setExists(true)
          const mlSkills: any[] = profile.skills?.programming_ml ?? []
          const tools: string[] = profile.skills?.software_tools ?? []
          const allSkills = [
            ...mlSkills.map((s: any) => s.language ?? s).filter(Boolean),
            ...tools,
          ].join(', ')

          setForm({
            full_name: profile.full_name ?? '',
            email: profile.email ?? '',
            phone: profile.phone ?? '',
            location: profile.location ?? '',
            skills_raw: allSkills,
            profile_statement: profile.profile_statement ?? '',
          })

          if (profile.projects?.length) {
            setProjects(
              profile.projects.map((p: any) => ({
                _id: generateId(),
                name: p.name ?? '',
                description: p.description ?? '',
              }))
            )
          }
          if (profile.education?.length) {
            setEducations(
              profile.education.map((e: any) => ({
                _id: generateId(),
                degree: e.degree ?? '',
                institution: e.institution ?? '',
                period: e.period ?? '',
                key_topics: e.key_topics ?? '',
              }))
            )
          }
          if (profile.experience?.length) {
            setExperiences(
              profile.experience.map((exp: any) => ({
                _id: generateId(),
                title: exp.title ?? '',
                company: exp.company ?? '',
                start_date: exp.start_date ?? '',
                end_date: exp.end_date ?? '',
                location: exp.location ?? '',
                bullets: exp.bullets ?? [],
              }))
            )
          }
        }
        if (bp) setBpData(bp)
        if (Array.isArray(stars)) setStarData(stars)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Build payload ─────────────────────────────────────
  function buildPayload() {
    const skillsList = form.skills_raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const experiencePayload = experiences
      .filter((e) => e.title.trim())
      .map((e) => ({
        title: e.title.trim(),
        company: e.company.trim(),
        start_date: e.start_date.trim() || undefined,
        end_date: e.end_date.trim() || undefined,
        location: e.location.trim() || undefined,
        bullets: e.bullets,
      }))

    const payload: Record<string, any> = {}
    if (form.full_name) payload.full_name = form.full_name
    if (form.email) payload.email = form.email
    if (form.phone) payload.phone = form.phone
    if (form.location) payload.location = form.location
    if (experiencePayload.length) payload.experience = experiencePayload

    const projectPayload = projects
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        description: p.description.trim() || undefined,
      }))
    if (projectPayload.length) payload.projects = projectPayload

    const educationPayload = educations
      .filter((e) => e.degree.trim())
      .map((e) => ({
        degree: e.degree.trim(),
        institution: e.institution.trim(),
        period: e.period.trim() || undefined,
        key_topics: e.key_topics.trim() || undefined,
      }))
    if (educationPayload.length) payload.education = educationPayload
    if (skillsList.length)
      payload.skills = {
        software_tools: skillsList,
        programming_ml: [],
        domain_expertise: [],
      }
    if (form.profile_statement) payload.profile_statement = form.profile_statement
    return payload
  }

  // ── Submit ───────────────────────────────────────────
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const method = exists ? 'PATCH' : 'POST'
      await apiFetch<any>('/api/v1/setup/profile', {
        method,
        body: JSON.stringify(buildPayload()),
      })
      setExists(true)
      setSaved(true)
      const steps = getCompletedSteps()
      if (!steps.includes(1)) {
        setCompletedSteps([...steps, 1])
        showSuccess('Profile saved!')
      } else {
        showSuccess('Profile updated')
      }
    } catch (x) {
      const msg = x instanceof Error ? x.message : 'Request failed'
      setError(msg)
      showError(msg)
    } finally {
      setSaving(false)
    }
  }

  // ── Loading state ───────────────────────────────────
  if (loading) {
    return (
      <section className="mx-auto max-w-5xl">
        <PipelineHeader eyebrow="02 / PROFILE" title={t('title')} />
        <div className="mt-8 animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-[#e2e2e5]" />
          <div className="h-64 rounded-2xl bg-[#e2e2e5]" />
          <div className="h-48 rounded-2xl bg-[#e2e2e5]" />
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl">
      <PipelineHeader eyebrow="02 / PROFILE" title={t('title')} subtitle={t('subtitle')} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* ═══ LEFT: Profile form ═══ */}
        <form onSubmit={submit} className="space-y-6">
          {/* ── Basic Info ───────────────────────────── */}
          <div className="card space-y-5">
            <div className="flex items-center gap-2.5">
              <SectionIcon bg="bg-[#0071e3]/10 text-[#0071e3]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </SectionIcon>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">Basic Info</p>
                <p className="text-[11px] text-[#b0b0b0]">Your name and contact details</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-[#1d1d1f]">
                {t('fullName')} <span className="text-rose-400">*</span>
                <input required className="field mt-1.5" placeholder="Jane Doe" value={form.full_name} onChange={(e) => f('full_name', e.target.value)} />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                Email <span className="text-rose-400">*</span>
                <input required type="email" className="field mt-1.5" placeholder="jane@example.com" value={form.email} onChange={(e) => f('email', e.target.value)} />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                Phone <span className="text-[#b0b0b0]">optional</span>
                <input className="field mt-1.5" placeholder="+45 12 34 56 78" value={form.phone} onChange={(e) => f('phone', e.target.value)} />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                {t('location')} <span className="text-[#b0b0b0]">{tc('optional')}</span>
                <input className="field mt-1.5" placeholder="Copenhagen, Denmark" value={form.location} onChange={(e) => f('location', e.target.value)} />
              </label>
            </div>
          </div>

          {/* ── Work Experience ──────────────────────── */}
          <CollapsibleCardListWrapper
            title={t('experience')}
            countLabel={`${experiences.filter((e) => e.title.trim()).length} position(s) added`}
            icon={
              <SectionIcon bg="bg-emerald-100 text-emerald-600">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </SectionIcon>
            }
            count={experiences.filter((e) => e.title.trim()).length}
            emptyMessage="No experience added yet."
            addLabel={t('addExperience')}
            onAdd={() => setExperiences((prev) => [...prev, emptyExperience()])}
            isEmpty={experiences.length === 0}
          >
            {experiences.map((exp, idx) => (
              <CollapsibleCard
                key={exp._id}
                id={exp._id}
                index={idx}
                title={exp.title || `Position ${idx + 1}`}
                isFilled={!!exp.title.trim()}
                isOpen={openExpCards.has(exp._id)}
                onToggle={(id) => toggleCards(setOpenExpCards, id)}
                onRemove={(id) =>
                  setExperiences((prev) => prev.filter((e) => e._id !== id))
                }
                badgeColor="bg-emerald-100"
                badgeTextColor="text-emerald-700"
                placeholder="position"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-[#1d1d1f]">
                    Job title
                    <input className="field mt-1.5" placeholder="Senior Software Engineer" value={exp.title} onChange={(e) => updateExp(exp._id, 'title', e.target.value)} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Company
                    <input className="field mt-1.5" placeholder="Acme Corp" value={exp.company} onChange={(e) => updateExp(exp._id, 'company', e.target.value)} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Start date <span className="text-[#b0b0b0]">YYYY-MM</span>
                    <input className="field mt-1.5" placeholder="2022-03" value={exp.start_date} onChange={(e) => updateExp(exp._id, 'start_date', e.target.value)} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    End date <span className="text-[#b0b0b0]">or present</span>
                    <input className="field mt-1.5" placeholder="2024-01" value={exp.end_date} onChange={(e) => updateExp(exp._id, 'end_date', e.target.value)} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f] sm:col-span-2">
                    Location <span className="text-[#b0b0b0]">optional</span>
                    <input className="field mt-1.5" placeholder="San Francisco, CA" value={exp.location} onChange={(e) => updateExp(exp._id, 'location', e.target.value)} />
                  </label>
                </div>
                <label className="block text-sm text-[#1d1d1f]">
                  Achievements <span className="text-[#b0b0b0]">one per line</span>
                  <textarea className="field mt-1.5 h-20 resize-none" placeholder="Built X that reduced Y by Z%&#10;Led team of N to deliver Q&#10;Implemented feature resulting in W" value={exp.bullets.join('\n')} onChange={(e) => updateBullets(exp._id, e.target.value)} />
                </label>
              </CollapsibleCard>
            ))}
          </CollapsibleCardListWrapper>

          {/* ── Education ───────────────────────────── */}
          <CollapsibleCardListWrapper
            title={t('education')}
            countLabel={`${educations.filter((e) => e.degree.trim()).length} degree(s) added`}
            icon={
              <SectionIcon bg="bg-violet-100 text-violet-600">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </SectionIcon>
            }
            count={educations.filter((e) => e.degree.trim()).length}
            emptyMessage="No education added yet."
            addLabel={t('addEducation')}
            onAdd={() => setEducations((prev) => [...prev, emptyEducation()])}
            isEmpty={educations.length === 0}
          >
            {educations.map((edu, idx) => (
              <CollapsibleCard
                key={edu._id}
                id={edu._id}
                index={idx}
                title={edu.degree || `Degree ${idx + 1}`}
                isFilled={!!edu.degree.trim()}
                isOpen={openEduCards.has(edu._id)}
                onToggle={(id) => toggleCards(setOpenEduCards, id)}
                onRemove={(id) =>
                  setEducations((prev) => prev.filter((e) => e._id !== id))
                }
                badgeColor="bg-violet-100"
                badgeTextColor="text-violet-700"
                placeholder="degree"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-[#1d1d1f]">
                    Degree
                    <input className="field mt-1.5" placeholder="B.Sc. Computer Science" value={edu.degree} onChange={(e) => updateEdu(edu._id, 'degree', e.target.value)} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Institution
                    <input className="field mt-1.5" placeholder="MIT" value={edu.institution} onChange={(e) => updateEdu(edu._id, 'institution', e.target.value)} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Period <span className="text-[#b0b0b0]">optional</span>
                    <input className="field mt-1.5" placeholder="2020–2024" value={edu.period} onChange={(e) => updateEdu(edu._id, 'period', e.target.value)} />
                  </label>
                </div>
                <label className="block text-sm text-[#1d1d1f]">
                  Key topics <span className="text-[#b0b0b0]">optional — relevant coursework</span>
                  <textarea className="field mt-1.5 h-16 resize-none" placeholder="Machine Learning, Distributed Systems, Algorithm Design" value={edu.key_topics} onChange={(e) => updateEdu(edu._id, 'key_topics', e.target.value)} />
                </label>
              </CollapsibleCard>
            ))}
          </CollapsibleCardListWrapper>

          {/* ── Projects ───────────────────────────── */}
          <CollapsibleCardListWrapper
            title={t('projects')}
            countLabel={`${projects.filter((p) => p.name.trim()).length} project(s) added`}
            icon={
              <SectionIcon bg="bg-sky-100 text-sky-600">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </SectionIcon>
            }
            count={projects.filter((p) => p.name.trim()).length}
            emptyMessage="No projects added yet."
            addLabel={t('addProject')}
            onAdd={() => setProjects((prev) => [...prev, emptyProject()])}
            isEmpty={projects.length === 0}
          >
            {projects.map((proj, idx) => (
              <CollapsibleCard
                key={proj._id}
                id={proj._id}
                index={idx}
                title={proj.name || `Project ${idx + 1}`}
                isFilled={!!proj.name.trim()}
                isOpen={openProjectCards.has(proj._id)}
                onToggle={(id) => toggleCards(setOpenProjectCards, id)}
                onRemove={(id) =>
                  setProjects((prev) => prev.filter((p) => p._id !== id))
                }
                badgeColor="bg-sky-100"
                badgeTextColor="text-sky-700"
                placeholder="project"
              >
                <label className="block text-sm text-[#1d1d1f]">
                  Project name
                  <input className="field mt-1.5" placeholder="ML Pipeline Optimization" value={proj.name} onChange={(e) => updateProject(proj._id, 'name', e.target.value)} />
                </label>
                <label className="block text-sm text-[#1d1d1f]">
                  Description <span className="text-[#b0b0b0]">optional</span>
                  <textarea className="field mt-1.5 h-20 resize-none" placeholder="Built an end-to-end ML pipeline that reduced inference time by 40% and improved model accuracy by 15%." value={proj.description} onChange={(e) => updateProject(proj._id, 'description', e.target.value)} />
                </label>
              </CollapsibleCard>
            ))}
          </CollapsibleCardListWrapper>

          {/* ── Skills & Summary ───────────────────── */}
          <div className="card space-y-5">
            <div className="flex items-center gap-2.5">
              <SectionIcon bg="bg-amber-100 text-amber-600">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </SectionIcon>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">{t('skills')} &amp; {t('profileStatement')}</p>
                <p className="text-[11px] text-[#b0b0b0]">Technical skills and professional summary</p>
              </div>
            </div>
            <label className="block text-sm text-[#1d1d1f]">
              {t('skills')} <span className="text-[#b0b0b0]">comma separated</span>
              <input className="field mt-1.5" placeholder="Python, FastAPI, React, PostgreSQL, Docker…" value={form.skills_raw} onChange={(e) => f('skills_raw', e.target.value)} />
            </label>
            {form.skills_raw && (
              <div className="flex flex-wrap gap-1.5">
                {form.skills_raw
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((skill, i) => (
                    <span
                      key={i}
                      className="animate-fade-in-up rounded-full border border-[#e2e2e5] bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] text-[#474747]"
                      style={{ animationDelay: `${i * 20}ms` }}
                    >
                      {skill}
                    </span>
                  ))}
              </div>
            )}
            <label className="block text-sm text-[#1d1d1f]">
              {t('profileStatement')} <span className="text-[#b0b0b0]">{tc('optional')} — 2-3 sentences</span>
              <textarea className="field mt-1.5 h-24 resize-none" placeholder="ML engineer with 5+ years building production systems at scale. Passionate about turning complex problems into elegant solutions." value={form.profile_statement} onChange={(e) => f('profile_statement', e.target.value)} />
            </label>
            <div className="flex items-center gap-2 text-[11px] text-[#b0b0b0]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              This summary appears at the top of your CV and cover letters.
            </div>
          </div>

          {/* ── Save button + error ───────────────── */}
          <AppleButton disabled={saving} loading={saving} className="w-full">
            {saving ? t('saving') : exists ? tc('edit') : t('saveProfile')}
          </AppleButton>
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}
        </form>

        {/* ═══ RIGHT: Status + BP + STAR ═══ */}
        <div className="space-y-6">
          <StatusPanel saved={saved} exists={exists} />
          <BehavioralProfileSection initial={bpData} />
          <StarExamplesSection initial={starData} />
        </div>
      </div>
    </section>
  )
}
