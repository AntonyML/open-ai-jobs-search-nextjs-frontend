'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { getCompletedSteps, setCompletedSteps } from '@/lib/auth'
import { PipelineHeader } from '@/components/ui/pipeline-header'
import { AppleButton } from '@/components/ui/apple-button'
import { StatusPanel } from '@/components/setup/StatusPanel'
import { BehavioralProfileSection } from '@/components/setup/BehavioralProfileSection'
import { StarExamplesSection } from '@/components/setup/StarExamplesSection'

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
  period: '',
  key_topics: '',
})

const emptyProject = (): ProjectEntry => ({
  _id: generateId(),
  name: '',
  description: '',
})

export default function Setup() {
  const t = useTranslations('setup')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [exists, setExists] = useState(false)

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

  const [bpData, setBpData] = useState<BehavioralProfile>({})
  const [starData, setStarData] = useState<StarExample[]>([])

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
        period: e.period || undefined,
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
        <form onSubmit={submit} className="space-y-6">
          <BasicInfoSection form={form} onChange={f} />

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

          <AppleButton disabled={saving} loading={saving} className="w-full">
            {saving ? t('saving') : exists ? 'Update' : t('saveProfile')}
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

        <div className="space-y-6">
          <StatusPanel saved={saved} exists={exists} />
          <BehavioralProfileSection initial={bpData} />
          <StarExamplesSection initial={starData} />
        </div>
      </div>
    </section>
  )
}
