'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch, ApiError } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { getCompletedSteps, setCompletedSteps } from '@/lib/auth'
import { PipelineHeader } from '@/components/ui/pipeline-header'
import { AppleButton } from '@/components/ui/apple-button'

import { BasicInfoSection } from '@/app/[locale]/(app)/setup/components/BasicInfoSection'
import {
  ExperienceSection,
  type ExperienceEntry,
} from '@/app/[locale]/(app)/setup/components/ExperienceSection'
import {
  EducationSection,
  type EducationEntry,
} from '@/app/[locale]/(app)/setup/components/EducationSection'
import {
  ProjectsSection,
  type ProjectEntry,
} from '@/app/[locale]/(app)/setup/components/ProjectsSection'
import { SkillsSection } from '@/app/[locale]/(app)/setup/components/SkillsSection'
import {
  JobTargetSection,
  DEFAULT_JOB_TARGET,
  type JobTarget,
} from '@/app/[locale]/(app)/setup/components/JobTargetSection'

interface FormState {
  full_name: string
  email: string
  phone: string
  location: string
  skills_raw: string
  profile_statement: string
}

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

const emptyExperience = (): ExperienceEntry => ({
  _id: generateId(),
  title: '',
  company: '',
  start_date: '',
  end_date: '',
  location: '',
  bullets: [],
})

const emptyEducation = (): EducationEntry => ({
  _id: generateId(),
  degree: '',
  institution: '',
  start_date: '',
  end_date: '',
  key_topics: [],
})

const emptyProject = (): ProjectEntry => ({
  _id: generateId(),
  name: '',
  description: '',
})

export default function Setup() {
  const { locale } = useParams()
  const router = useRouter()
  const t = useTranslations('setup')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)

  const [form, setForm] = useState<FormState>({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    skills_raw: '',
    profile_statement: '',
  })

  const [projects, setProjects] = useState<ProjectEntry[]>([emptyProject()])
  const [educations, setEducations] = useState<EducationEntry[]>([emptyEducation()])
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([emptyExperience()])
  const [jobTarget, setJobTarget] = useState<JobTarget>(DEFAULT_JOB_TARGET)

  const [openExpCards, setOpenExpCards] = useState<Set<string>>(new Set())
  const [openEduCards, setOpenEduCards] = useState<Set<string>>(new Set())
  const [openProjectCards, setOpenProjectCards] = useState<Set<string>>(new Set())

  // Load full profile on mount
  useEffect(() => {
    Promise.all([
      apiFetch<any>('/api/v1/setup/profile').catch(() => null),
      apiFetch<{ full_name?: string; email?: string }>('/api/v1/auth/me').catch(() => null),
    ]).then(([profile, user]) => {
      setHasProfile(!!profile)
      if (!profile && !user) return

      setForm((prev) => ({
        ...prev,
        full_name: profile?.full_name || user?.full_name || prev.full_name,
        email: profile?.email || user?.email || prev.email,
        phone: profile?.phone || prev.phone,
        location: profile?.location || prev.location,
        skills_raw: profile?.skills?.software_tools?.join(', ') || prev.skills_raw,
        profile_statement: profile?.profile_statement || prev.profile_statement,
      }))

      if (profile?.experience?.length) {
        setExperiences(
          profile.experience.map((exp: any) => ({
            _id: generateId(),
            title: exp.title || '',
            company: exp.company || '',
            start_date: exp.start_date || '',
            end_date: exp.end_date || '',
            location: exp.location || '',
            bullets: exp.bullets || [],
          }))
        )
      }

      if (profile?.education?.length) {
        setEducations(
          profile.education.map((edu: any) => ({
            _id: generateId(),
            degree: edu.degree || '',
            institution: edu.institution || '',
            start_date: edu.start_date || '',
            end_date: edu.end_date || '',
            key_topics: edu.key_topics
              ? String(edu.key_topics).split(',').map((s: string) => s.trim()).filter(Boolean)
              : [],
          }))
        )
      }

      if (profile?.projects?.length) {
        setProjects(
          profile.projects.map((proj: any) => ({
            _id: generateId(),
            name: proj.name || '',
            description: proj.description || '',
          }))
        )
      }

      // If profile exists with required fields, show saved state and mark step complete
      const prefillName = profile?.full_name || user?.full_name || ''
      const prefillEmail = profile?.email || user?.email || ''
      const prefillLocation = profile?.location || ''
      if (!!prefillName && !!prefillEmail && !!prefillLocation) {
        setSaved(true)
        const steps = getCompletedSteps()
        if (!steps.includes(1)) {
          setCompletedSteps([...steps, 1])
        }
      }

      if (profile?.job_target) {
        const jt = profile.job_target
        setJobTarget({
          target_titles: jt.target_titles || [],
          seniority: jt.seniority ?? null,
          work_mode: jt.work_mode || [],
          search_locations: jt.search_locations || [],
          search_radius_km: jt.search_radius_km ?? null,
          employment_types: jt.employment_types || [],
          industry: typeof jt.industry === 'string'
            ? jt.industry.split(',').map((s: string) => s.trim()).filter(Boolean)
            : (Array.isArray(jt.industry) ? jt.industry : []),
          keywords: jt.keywords || [],
          exclude_keywords: jt.exclude_keywords || [],
          exclude_companies: jt.exclude_companies || [],
          salary_min: jt.salary_min ?? null,
          salary_max: jt.salary_max ?? null,
          availability: jt.availability ?? null,
          visa_needed: jt.visa_needed ?? null,
          relocation_willing: jt.relocation_willing ?? null,
        })
      }
    })
  }, [])

  function toggleCards(setter: typeof setOpenExpCards, id: string) {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function f(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function updateExp(id: string, key: keyof ExperienceEntry, value: any) {
    setExperiences((prev) =>
      prev.map((e) => (e._id === id ? { ...e, [key]: value } : e))
    )
  }

  function updateBullets(id: string, bullets: string[]) {
    setExperiences((prev) =>
      prev.map((e) =>
        e._id === id ? { ...e, bullets } : e
      )
    )
  }

  function updateEdu(id: string, key: keyof EducationEntry, value: any) {
    setEducations((prev) =>
      prev.map((e) => (e._id === id ? { ...e, [key]: value } : e))
    )
  }

  function updateProject(id: string, key: keyof ProjectEntry, value: string) {
    setProjects((prev) =>
      prev.map((p) => (p._id === id ? { ...p, [key]: value } : p))
    )
  }

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
        start_date: e.start_date || undefined,
        end_date: e.end_date || undefined,
        location: e.location.trim() || undefined,
        bullets: e.bullets.filter((b: string) => b.trim()),
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
        start_date: e.start_date || undefined,
        end_date: e.end_date || undefined,
        key_topics: e.key_topics.filter(Boolean).join(', ') || undefined,
      }))
    if (educationPayload.length) payload.education = educationPayload
    if (skillsList.length)
      payload.skills = {
        software_tools: skillsList,
        programming_ml: [],
        domain_expertise: [],
      }
    if (form.profile_statement) payload.profile_statement = form.profile_statement
    const hasJobTarget = jobTarget.target_titles.length > 0
    if (hasJobTarget) {
      payload.job_target = {
        ...jobTarget,
        industry: jobTarget.industry.filter(Boolean).join(', ') || null,
      }
    }
    return payload
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = buildPayload()
      const method = hasProfile ? 'PATCH' : 'POST'
      await apiFetch<any>('/api/v1/setup/profile', {
        method,
        body: JSON.stringify(payload),
      })
    } catch (x: any) {
      let msg: string
      if (x instanceof ApiError && x.status === 409) {
        msg = hasProfile ? t('updateFailed') : t('alreadyExists')
      } else if (x instanceof ApiError && x.status === 422) {
        msg = t('invalidData')
      } else {
        msg = x instanceof Error ? x.message : t('requestFailed')
      }
      setError(msg)
      showError(msg)
      setSaving(false)
      return
    }
    setHasProfile(true)
    setSaved(true)
    const steps = getCompletedSteps()
    if (!steps.includes(1)) {
      setCompletedSteps([...steps, 1])
    }
    showSuccess(t('saved'))
    setSaving(false)
  }

  async function deleteProfile() {
    if (!confirm(t('deleteProfileConfirm'))) return
    try {
      await apiFetch('/api/v1/setup/profile', { method: 'DELETE' })
      setForm({ full_name: '', email: '', phone: '', location: '', skills_raw: '', profile_statement: '' })
      setExperiences([emptyExperience()])
      setEducations([emptyEducation()])
      setProjects([emptyProject()])
      setJobTarget(DEFAULT_JOB_TARGET)
      setSaved(false)
      showSuccess(t('profileDeleted'))
    } catch {
      showError(t('profileDeleteFailed'))
    }
  }

  function hasRequiredFields(): boolean {
    return !!form.full_name && !!form.email && !!form.location
  }

  return (
    <section className="mx-auto max-w-3xl">
      <PipelineHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      {saved && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            {t('profileSaved')}
          </div>
           <AppleButton variant="secondary" size="sm" onClick={() => router.push(`/${locale}/pipeline/search`)}>
             {t('continueToSearch')}
           </AppleButton>
        </div>
      )}

      <form onSubmit={submit} className="space-y-6" id="setup-form">
        <BasicInfoSection
          full_name={form.full_name}
          email={form.email}
          phone={form.phone}
          location={form.location}
          onChange={f}
          locale={locale as string}
        />

        <JobTargetSection value={jobTarget} onChange={setJobTarget} />

        <ExperienceSection
          experiences={experiences}
          openCards={openExpCards}
          onToggle={(id) => toggleCards(setOpenExpCards, id)}
          onUpdate={updateExp}
          onUpdateBullets={updateBullets}
          onAdd={() => setExperiences((prev) => [...prev, emptyExperience()])}
          onRemove={(id) =>
            setExperiences((prev) => prev.filter((e) => e._id !== id))
          }
        />

        <EducationSection
          educations={educations}
          openCards={openEduCards}
          onToggle={(id) => toggleCards(setOpenEduCards, id)}
          onUpdate={updateEdu}
          onAdd={() => setEducations((prev) => [...prev, emptyEducation()])}
          onRemove={(id) =>
            setEducations((prev) => prev.filter((e) => e._id !== id))
          }
        />

        <ProjectsSection
          projects={projects}
          openCards={openProjectCards}
          onToggle={(id) => toggleCards(setOpenProjectCards, id)}
          onUpdate={updateProject}
          onAdd={() => setProjects((prev) => [...prev, emptyProject()])}
          onRemove={(id) =>
            setProjects((prev) => prev.filter((p) => p._id !== id))
          }
        />

        <SkillsSection form={form} onFieldChange={f} />

        <div className="flex gap-3 border-t border-[#d2d2d7] pt-6">
          <AppleButton disabled={saving} loading={saving} className="flex-1" type="submit">
            {saving ? t('saving') : hasProfile ? t('updateProfile') : t('saveProfile')}
          </AppleButton>
          <button
            type="button"
            onClick={deleteProfile}
            className="rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            {t('deleteProfile')}
          </button>
        </div>

        {saved && hasRequiredFields() && (
          <div className="flex justify-center pt-2">
             <AppleButton variant="secondary" onClick={() => router.push(`/${locale}/pipeline/search`)}>
               {t('continueToSearch')}
             </AppleButton>
          </div>
        )}

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
    </section>
  )
}
