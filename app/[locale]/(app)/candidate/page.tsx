'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch, ApiError } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { getCompletedSteps, setCompletedSteps } from '@/lib/auth'
import { PageHeader } from '@/components/ui/page-header'
import { AppleButton } from '@/components/ui/apple-button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

import { BasicInfoSection } from '@/app/[locale]/(app)/candidate/components/BasicInfoSection'
import {
  ExperienceSection,
  type ExperienceEntry,
} from '@/app/[locale]/(app)/candidate/components/ExperienceSection'
import {
  EducationSection,
  type EducationEntry,
} from '@/app/[locale]/(app)/candidate/components/EducationSection'
import {
  ProjectsSection,
  type ProjectEntry,
} from '@/app/[locale]/(app)/candidate/components/ProjectsSection'
import {
  CertificationsSection,
  type CertificationEntry,
} from '@/app/[locale]/(app)/candidate/components/CertificationsSection'
import {
  LanguagesSection,
  type LanguageEntry,
} from '@/app/[locale]/(app)/candidate/components/LanguagesSection'
import {
  SkillsSection,
  type CategorizedSkills,
} from '@/app/[locale]/(app)/candidate/components/SkillsSection'
import { ProfileQualityIndicator } from '@/app/[locale]/(app)/candidate/components/ProfileQualityIndicator'
import { ProfileSectionNav } from '@/components/setup/ProfileSectionNav'
import {
  JobTargetSection,
  DEFAULT_JOB_TARGET,
  type JobTarget,
} from '@/app/[locale]/(app)/candidate/components/JobTargetSection'

interface FormState {
  full_name: string
  email: string
  phone: string
  location: string
  linkedin_url: string
  github_url: string
  portfolio_url: string
  skills_categorized?: CategorizedSkills
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
  client_context: '',
  technologies: [],
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
  role: '',
  client: '',
  start_date: '',
  end_date: '',
  is_ongoing: false,
  url: '',
  technologies: [],
})

const emptyCertification = (): CertificationEntry => ({
  _id: generateId(),
  name: '',
  issuer: '',
  issue_date: '',
  credential_url: '',
})

const emptyLanguage = (): LanguageEntry => ({
  _id: generateId(),
  language: '',
  proficiency: 'Native',
})

export default function Setup() {
  const { locale } = useParams()
  const router = useRouter()
  const t = useTranslations('setup')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)

  const [form, setForm] = useState<FormState>({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    skills_raw: '',
    profile_statement: '',
  })

  const [projects, setProjects] = useState<ProjectEntry[]>([emptyProject()])
  const [educations, setEducations] = useState<EducationEntry[]>([emptyEducation()])
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([emptyExperience()])
  const [certifications, setCertifications] = useState<CertificationEntry[]>([])
  const [languages, setLanguages] = useState<LanguageEntry[]>([])
  const [jobTarget, setJobTarget] = useState<JobTarget>(DEFAULT_JOB_TARGET)

  const [openExpCards, setOpenExpCards] = useState<Set<string>>(new Set())
  const [openEduCards, setOpenEduCards] = useState<Set<string>>(new Set())
  const [openProjectCards, setOpenProjectCards] = useState<Set<string>>(new Set())
  const [openCertCards, setOpenCertCards] = useState<Set<string>>(new Set())
  const [openLangCards, setOpenLangCards] = useState<Set<string>>(new Set())

  // Load full profile on mount
  useEffect(() => {
    Promise.all([
      apiFetch<any>('/api/v1/setup/profile').catch(() => null),
      apiFetch<{ full_name?: string; email?: string }>('/api/v1/auth/me').catch(() => null),
    ]).then(([profile, user]) => {
      setHasProfile(!!profile)
      if (!profile && !user) return

      const initialCat: CategorizedSkills = {
        languages: (profile?.skills?.programming_ml || []).map((p: any) => p.language || p).filter(Boolean),
        frameworks: profile?.skills?.domain_expertise || [],
        tools_db: profile?.skills?.software_tools || [],
      }

      setForm((prev) => ({
        ...prev,
        full_name: profile?.full_name || user?.full_name || prev.full_name,
        email: profile?.email || user?.email || prev.email,
        phone: profile?.phone || prev.phone,
        location: profile?.location || prev.location,
        linkedin_url: profile?.linkedin_url || prev.linkedin_url,
        github_url: profile?.github_url || prev.github_url,
        portfolio_url: profile?.portfolio_url || prev.portfolio_url,
        skills_categorized: initialCat,
        skills_raw: [
          ...initialCat.languages,
          ...initialCat.frameworks,
          ...initialCat.tools_db,
        ].join(', '),
        profile_statement: profile?.profile_statement || prev.profile_statement,
      }))

      if (profile?.experience?.length) {
        const exps = profile.experience.map((exp: any) => ({
          _id: generateId(),
          title: exp.title || '',
          company: exp.company || '',
          start_date: exp.start_date || '',
          end_date: exp.end_date || '',
          is_current: !exp.end_date && !!exp.start_date,
          location: exp.location || '',
          work_mode: exp.work_mode || undefined,
          client_context: exp.client_context || '',
          technologies: exp.technologies || [],
          bullets: exp.bullets || [],
        }))
        setExperiences(exps)
        setOpenExpCards(new Set(exps.map((e: any) => e._id)))
      }

      if (profile?.education?.length) {
        const edus = profile.education.map((edu: any) => ({
          _id: generateId(),
          degree: edu.degree || '',
          institution: edu.institution || '',
          start_date: edu.start_date || '',
          end_date: edu.end_date || '',
          key_topics: edu.key_topics
            ? String(edu.key_topics).split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
        }))
        setEducations(edus)
        setOpenEduCards(new Set(edus.map((e: any) => e._id)))
      }

      if (profile?.certifications?.length) {
        const certs = profile.certifications.map((c: any) => ({
          _id: generateId(),
          name: c.name || '',
          issuer: c.issuer || '',
          issue_date: c.issue_date || c.year || '',
          credential_url: c.credential_url || c.url || '',
        }))
        setCertifications(certs)
        setOpenCertCards(new Set(certs.map((c: any) => c._id)))
      }

      if (profile?.languages?.length) {
        const langs = profile.languages.map((l: any) => ({
          _id: generateId(),
          language: l.language || '',
          proficiency: l.proficiency || 'Native',
        }))
        setLanguages(langs)
        setOpenLangCards(new Set(langs.map((l: any) => l._id)))
      }

      if (profile?.projects?.length) {
        const projs = profile.projects.map((proj: any) => ({
          _id: generateId(),
          name: proj.name || '',
          description: proj.description || '',
          role: proj.role || '',
          client: proj.client || '',
          start_date: proj.start_date || '',
          end_date: proj.end_date || '',
          is_ongoing: !proj.end_date && !!proj.start_date,
          url: proj.url || '',
          technologies: proj.technologies || [],
        }))
        setProjects(projs)
        setOpenProjectCards(new Set(projs.map((p: any) => p._id)))
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

  function f(name: string, value: any) {
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

  // P2: Auto-sync technologies from experience into skills
  function updateTechnologies(id: string, technologies: string[]) {
    setExperiences((prev) =>
      prev.map((e) => (e._id === id ? { ...e, technologies } : e))
    )

    // Automatically sync new technologies into tools_db if not present
    setForm((prev) => {
      const currentTools = new Set(prev.skills_categorized?.tools_db || [])
      const currentLangs = new Set(prev.skills_categorized?.languages || [])
      const currentFws = new Set(prev.skills_categorized?.frameworks || [])
      
      let modified = false
      const newTools = [...(prev.skills_categorized?.tools_db || [])]

      technologies.forEach((t) => {
        const trimmed = t.trim()
        if (trimmed && !currentTools.has(trimmed) && !currentLangs.has(trimmed) && !currentFws.has(trimmed)) {
          newTools.push(trimmed)
          currentTools.add(trimmed)
          modified = true
        }
      })

      if (!modified) return prev

      const updatedCat = {
        languages: prev.skills_categorized?.languages || [],
        frameworks: prev.skills_categorized?.frameworks || [],
        tools_db: newTools,
      }
      return {
        ...prev,
        skills_categorized: updatedCat,
        skills_raw: [...updatedCat.languages, ...updatedCat.frameworks, ...updatedCat.tools_db].join(', '),
      }
    })
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

  function handleAddExperience() {
    const entry = emptyExperience()
    setExperiences((prev) => [...prev, entry])
    setOpenExpCards((prev) => new Set(prev).add(entry._id))
  }

  function handleAddEducation() {
    const entry = emptyEducation()
    setEducations((prev) => [...prev, entry])
    setOpenEduCards((prev) => new Set(prev).add(entry._id))
  }

  function handleAddCertification() {
    const entry = emptyCertification()
    setCertifications((prev) => [...prev, entry])
    setOpenCertCards((prev) => new Set(prev).add(entry._id))
  }

  function handleAddLanguage() {
    const entry = emptyLanguage()
    setLanguages((prev) => [...prev, entry])
    setOpenLangCards((prev) => new Set(prev).add(entry._id))
  }

  function handleAddProject() {
    const entry = emptyProject()
    setProjects((prev) => [...prev, entry])
    setOpenProjectCards((prev) => new Set(prev).add(entry._id))
  }

  function updateCert(id: string, key: keyof CertificationEntry, value: string) {
    setCertifications((prev) =>
      prev.map((c) => (c._id === id ? { ...c, [key]: value } : c))
    )
  }

  function updateLang(id: string, key: keyof LanguageEntry, value: string) {
    setLanguages((prev) =>
      prev.map((l) => (l._id === id ? { ...l, [key]: value } : l))
    )
  }

  function buildPayload() {
    const experiencePayload = experiences
      .filter((e) => e.title.trim())
      .map((e) => ({
        title: e.title.trim(),
        company: e.company.trim(),
        start_date: e.start_date || undefined,
        end_date: e.end_date || undefined,
        location: e.location.trim() || undefined,
        work_mode: e.work_mode || undefined,
        client_context: e.client_context?.trim() || undefined,
        technologies: e.technologies?.filter((t: string) => t.trim()) || [],
        bullets: e.bullets.filter((b: string) => b.trim()),
      }))

    const payload: Record<string, any> = {}
    if (form.full_name) payload.full_name = form.full_name
    if (form.email) payload.email = form.email
    if (form.phone) payload.phone = form.phone
    if (form.location) payload.location = form.location
    if (form.linkedin_url) payload.linkedin_url = form.linkedin_url
    if (form.github_url) payload.github_url = form.github_url
    if (form.portfolio_url) payload.portfolio_url = form.portfolio_url
    if (experiencePayload.length) payload.experience = experiencePayload

    const certPayload = certifications
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name.trim(),
        issuer: c.issuer.trim(),
        issue_date: c.issue_date.trim() || undefined,
        credential_url: c.credential_url.trim() || undefined,
      }))
    if (certPayload.length) payload.certifications = certPayload

    const langPayload = languages
      .filter((l) => l.language.trim())
      .map((l) => ({
        language: l.language.trim(),
        proficiency: l.proficiency || 'Native',
      }))
    if (langPayload.length) payload.languages = langPayload

    const projectPayload = projects
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        description: p.description.trim() || undefined,
        role: p.role?.trim() || undefined,
        client: p.client?.trim() || undefined,
        start_date: p.start_date || undefined,
        end_date: p.end_date || undefined,
        url: p.url?.trim() || undefined,
        technologies: p.technologies?.filter(Boolean) || [],
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

    const cat = form.skills_categorized
    if (cat) {
      payload.skills = {
        programming_ml: cat.languages.map((l) => ({ language: l, proficiency: 'Proficient' })),
        domain_expertise: cat.frameworks,
        software_tools: cat.tools_db,
      }
    } else {
      const skillsList = form.skills_raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (skillsList.length) {
        payload.skills = {
          software_tools: skillsList,
          programming_ml: [],
          domain_expertise: [],
        }
      }
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
    setDeleting(true)
    try {
      await apiFetch('/api/v1/setup/profile', { method: 'DELETE' })
      setForm({
        full_name: '',
        email: '',
        phone: '',
        location: '',
        linkedin_url: '',
        github_url: '',
        portfolio_url: '',
        skills_raw: '',
        profile_statement: '',
      })
      setExperiences([emptyExperience()])
      setEducations([emptyEducation()])
      setCertifications([])
      setLanguages([])
      setProjects([emptyProject()])
      setJobTarget(DEFAULT_JOB_TARGET)
      setSaved(false)
      setConfirmDelete(false)
      showSuccess(t('profileDeleted'))
    } catch {
      showError(t('profileDeleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  function hasRequiredFields(): boolean {
    const hasTargetTitles = jobTarget.target_titles.some(t => t.trim().length > 0)
    const hasExperience = experiences.some(e => e.title.trim().length > 0)
    const hasSkills = form.skills_raw.split(',').some(s => s.trim().length > 0)
    return !!form.full_name && !!form.email && !!form.location
      && hasTargetTitles
      && hasExperience
      && hasSkills
  }

  return (
    <section className="mx-auto max-w-3xl">
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      <a
        href={`/${locale}/admin/providers`}
        className="mb-5 inline-flex items-center gap-1 text-xs font-medium text-[#707070] hover:text-[#1d1d1f] transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        {t('backToProviders')}
      </a>

      <ProfileQualityIndicator
        hasBasicInfo={!!(form.full_name && form.email && form.location)}
        hasExperience={experiences.some((e) => e.title.trim().length > 0)}
        hasEducation={educations.some((e) => e.degree.trim().length > 0)}
        hasSkills={!!(form.skills_raw && form.skills_raw.trim().length > 0)}
        hasCertifications={certifications.some((c) => c.name.trim().length > 0)}
        hasLanguages={languages.some((l) => l.language.trim().length > 0)}
      />

      <ProfileSectionNav
        sections={[
          { id: 'section-basic-info', labelKey: 'sectionBasicInfo', isComplete: !!(form.full_name && form.email && form.location) },
          { id: 'section-job-target', labelKey: 'sectionJobTarget', isComplete: jobTarget.target_titles.length > 0 },
          { id: 'section-experience', labelKey: 'sectionExperience', isComplete: experiences.some((e) => e.title.trim().length > 0), count: experiences.filter((e) => e.title.trim()).length },
          { id: 'section-education', labelKey: 'sectionEducation', isComplete: educations.some((e) => e.degree.trim().length > 0), count: educations.filter((e) => e.degree.trim()).length },
          { id: 'section-certifications', labelKey: 'sectionCertifications', isComplete: certifications.some((c) => c.name.trim().length > 0), count: certifications.filter((c) => c.name.trim()).length },
          { id: 'section-languages', labelKey: 'sectionLanguages', isComplete: languages.some((l) => l.language.trim().length > 0), count: languages.filter((l) => l.language.trim()).length },
          { id: 'section-projects', labelKey: 'sectionProjects', isComplete: projects.some((p) => p.name.trim().length > 0), count: projects.filter((p) => p.name.trim()).length },
          { id: 'section-skills', labelKey: 'sectionSkills', isComplete: !!(form.skills_raw && form.skills_raw.trim().length > 0) },
        ]}
      />

      <form onSubmit={submit} className="space-y-6 mt-6" id="setup-form">
        <BasicInfoSection
          full_name={form.full_name}
          email={form.email}
          phone={form.phone}
          location={form.location}
          linkedin_url={form.linkedin_url}
          github_url={form.github_url}
          portfolio_url={form.portfolio_url}
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
          onUpdateTechnologies={updateTechnologies}
          onAdd={handleAddExperience}
          onRemove={(id) =>
            setExperiences((prev) => prev.filter((e) => e._id !== id))
          }
        />

        <EducationSection
          educations={educations}
          openCards={openEduCards}
          onToggle={(id) => toggleCards(setOpenEduCards, id)}
          onUpdate={updateEdu}
          onAdd={handleAddEducation}
          onRemove={(id) =>
            setEducations((prev) => prev.filter((e) => e._id !== id))
          }
        />

        <CertificationsSection
          certifications={certifications}
          openCards={openCertCards}
          onToggle={(id) => toggleCards(setOpenCertCards, id)}
          onUpdate={updateCert}
          onAdd={handleAddCertification}
          onRemove={(id) =>
            setCertifications((prev) => prev.filter((c) => c._id !== id))
          }
        />

        <LanguagesSection
          languages={languages}
          openCards={openLangCards}
          onToggle={(id) => toggleCards(setOpenLangCards, id)}
          onUpdate={updateLang}
          onAdd={handleAddLanguage}
          onRemove={(id) =>
            setLanguages((prev) => prev.filter((l) => l._id !== id))
          }
        />

        <ProjectsSection
          projects={projects}
          openCards={openProjectCards}
          onToggle={(id) => toggleCards(setOpenProjectCards, id)}
          onUpdate={updateProject}
          onAdd={handleAddProject}
          onRemove={(id) =>
            setProjects((prev) => prev.filter((p) => p._id !== id))
          }
        />

        <SkillsSection form={form} onFieldChange={f} />

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

      {/* ── Sticky action panel ───────────────────────────── */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+80px)] z-10 -mx-4 mt-8 border-t border-[#d2d2d7] bg-white/95 px-4 py-4 backdrop-blur sm:-mx-0 sm:rounded-t-xl sm:border sm:border-b-0 sm:px-5 sm:py-4 sm:shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:bottom-0">
        {confirmDelete ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#1d1d1f]">{t('deleteProfileConfirm')}</p>
            <div className="flex gap-2">
              <AppleButton variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                {t('cancel')}
              </AppleButton>
              <AppleButton variant="danger" size="sm" loading={deleting} disabled={deleting} onClick={deleteProfile}>
                {t('deleteProfile')}
              </AppleButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <AppleButton variant="danger" size="sm" disabled={saving || deleting} onClick={() => setConfirmDelete(true)}>
                {t('deleteProfile')}
              </AppleButton>
              {saved && hasRequiredFields() && (
                <Tooltip>
                  <TooltipTrigger render={
                    <AppleButton variant="secondary" size="sm" onClick={() => router.push(`/${locale}/search`)}>
                      {t('continueToSearch')} →
                    </AppleButton>
                  } />
                  <TooltipContent side="top" className="px-3 py-1.5 text-xs">
                    {t('continueToSearchTooltip')}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <AppleButton disabled={saving || deleting} loading={saving} className="w-full sm:w-auto" type="submit" form="setup-form">
              {saving ? t('saving') : hasProfile ? t('updateProfile') : t('saveProfile')}
            </AppleButton>
          </div>
        )}
      </div>
    </section>
  )
}
