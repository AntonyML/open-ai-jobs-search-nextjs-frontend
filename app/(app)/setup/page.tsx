'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { showSuccess, showError } from '@/lib/toasts'

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
  _id: string  // local tracking ID (not sent to API)
  title: string
  company: string
  start_date: string
  end_date: string
  location: string
  bullets: string[]
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

// ── Helpers ─────────────────────────────────────────────────────────

function emptyProject(): ProjectEntry {
  return { _id: generateId(), name: '', description: '' }
}

function emptyEducation(): EducationEntry {
  return { _id: generateId(), degree: '', institution: '', period: '', key_topics: '' }
}

function emptyExperience(): ExperienceEntry {
  return { _id: generateId(), title: '', company: '', start_date: '', end_date: '', location: '', bullets: [] }
}

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════

export default function Setup() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [exists, setExists] = useState(false)

  // ── Profile form state ─────────────────────────────────────────
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    skills_raw: '',
    profile_statement: '',
  })

  // ── Project entries (dynamic array) ──────────────────────────
  const [projects, setProjects] = useState<ProjectEntry[]>([emptyProject()])

  // ── Education entries (dynamic array) ─────────────────────────
  const [educations, setEducations] = useState<EducationEntry[]>([emptyEducation()])

  // ── Experiences (dynamic array) ────────────────────────────────
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([emptyExperience()])

  // ── Behavioral profile ────────────────────────────────────────
  const [bpOpen, setBpOpen] = useState(false)
  const [bpSaving, setBpSaving] = useState(false)
  const [bp, setBp] = useState<BehavioralProfile>({})

  // ── STAR examples ─────────────────────────────────────────────
  const [starOpen, setStarOpen] = useState(false)
  const [stars, setStars] = useState<StarExample[]>([])
  const [starForm, setStarForm] = useState({
    title: '',
    skill_demonstrated: '',
    situation: '',
    task: '',
    action: '',
    result: '',
    use_for: '',
  })

  // ── Projects collapse state ──────────────────────────────────
  const [openProjectCards, setOpenProjectCards] = useState<Set<string>>(new Set())

  function toggleProjectCard(id: string) {
    setOpenProjectCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Experience collapse state ────────────────────────────────
  const [openExpCards, setOpenExpCards] = useState<Set<string>>(new Set())

  function toggleExpCard(id: string) {
    setOpenExpCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Education collapse state (track open card IDs) ───────────
  const [openEduCards, setOpenEduCards] = useState<Set<string>>(new Set())

  function toggleEduCard(id: string) {
    setOpenEduCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Projects helpers ─────────────────────────────────────────
  function updateProject(id: string, key: keyof ProjectEntry, value: string) {
    setProjects(prev => prev.map(p => (p._id === id ? { ...p, [key]: value } : p)))
  }

  function addProject() {
    setProjects(prev => [...prev, emptyProject()])
  }

  function removeProject(id: string) {
    setProjects(prev => prev.filter(p => p._id !== id))
  }

  // ── Education helpers ─────────────────────────────────────────
  function updateEdu(id: string, key: keyof EducationEntry, value: string) {
    setEducations(prev => prev.map(e => (e._id === id ? { ...e, [key]: value } : e)))
  }

  function addEducation() {
    setEducations(prev => [...prev, emptyEducation()])
  }

  function removeEducation(id: string) {
    setEducations(prev => prev.filter(e => e._id !== id))
  }

  // ── Experience helpers ────────────────────────────────────────

  function updateExp(id: string, key: keyof ExperienceEntry, value: any) {
    setExperiences(prev => prev.map(e => (e._id === id ? { ...e, [key]: value } : e)))
  }

  function addExperience() {
    setExperiences(prev => [...prev, emptyExperience()])
  }

  function removeExperience(id: string) {
    setExperiences(prev => prev.filter(e => e._id !== id))
  }

  // ── Form helper ───────────────────────────────────────────────
  function f(name: string, value: string) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // ── Bullets helper ────────────────────────────────────────────
  function updateBullets(id: string, raw: string) {
    setExperiences(prev =>
      prev.map(e =>
        e._id === id
          ? { ...e, bullets: raw.split('\n').map(s => s.trim()).filter(Boolean) }
          : e
      )
    )
  }

  // ── Load all data ─────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch<any>('/api/v1/setup/profile').catch(() => null),
      apiFetch<BehavioralProfile>('/api/v1/setup/behavioral-profile').catch(() => null),
      apiFetch<StarExample[]>('/api/v1/setup/star-examples').catch(() => []),
    ])
      .then(([profile, bpData, starData]) => {
        if (profile) {
          setExists(true)
          const mlSkills: any[] = profile.skills?.programming_ml ?? []
          const tools: string[] = profile.skills?.software_tools ?? []
          const allSkills = [...mlSkills.map((s: any) => s.language ?? s).filter(Boolean), ...tools].join(', ')

          setForm({
            full_name: profile.full_name ?? '',
            email: profile.email ?? '',
            phone: profile.phone ?? '',
            location: profile.location ?? '',
            skills_raw: allSkills,
            profile_statement: profile.profile_statement ?? '',
          })

          // Load all project entries
          if (profile.projects?.length) {
            setProjects(
              profile.projects.map((p: any) => ({
                _id: generateId(),
                name: p.name ?? '',
                description: p.description ?? '',
              }))
            )
          } else {
            setProjects([emptyProject()])
          }

          // Load all education entries
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
          } else {
            setEducations([emptyEducation()])
          }

          // Load all experiences with a local ID for tracking
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
          } else {
            setExperiences([emptyExperience()])
          }
        }
        if (bpData) setBp(bpData)
        if (Array.isArray(starData)) setStars(starData)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Build profile payload ─────────────────────────────────────
  function buildPayload() {
    const skillsList = form.skills_raw.split(',').map(s => s.trim()).filter(Boolean)
    const experiencePayload = experiences
      .filter(e => e.title.trim())
      .map(e => ({
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
      .filter(p => p.name.trim())
      .map(p => ({
        name: p.name.trim(),
        description: p.description.trim() || undefined,
      }))
    if (projectPayload.length) payload.projects = projectPayload

    const educationPayload = educations
      .filter(e => e.degree.trim())
      .map(e => ({
        degree: e.degree.trim(),
        institution: e.institution.trim(),
        period: e.period.trim() || undefined,
        key_topics: e.key_topics.trim() || undefined,
      }))
    if (educationPayload.length) payload.education = educationPayload
    if (skillsList.length) payload.skills = { software_tools: skillsList, programming_ml: [], domain_expertise: [] }
    if (form.profile_statement) payload.profile_statement = form.profile_statement
    return payload
  }

  // ── Submit profile ────────────────────────────────────────────
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const method = exists ? 'PATCH' : 'POST'
      await apiFetch<any>('/api/v1/setup/profile', { method, body: JSON.stringify(buildPayload()) })
      setExists(true)
      setSaved(true)
      const steps = JSON.parse(localStorage.getItem('completed_steps') || '[]')
      if (!steps.includes(1)) {
        localStorage.setItem('completed_steps', JSON.stringify([...steps, 1]))
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

  // ── Save behavioral profile ───────────────────────────────────
  async function saveBehavioralProfile() {
    if (bpSaving) return
    setBpSaving(true)
    try {
      await apiFetch<BehavioralProfile>('/api/v1/setup/behavioral-profile', {
        method: 'PUT',
        body: JSON.stringify(bp),
      })
      showSuccess('Behavioral profile saved')
    } catch (x) {
      showError(x instanceof Error ? x.message : 'Failed to save')
    } finally {
      setBpSaving(false)
    }
  }

  // ── Create STAR example ───────────────────────────────────────
  async function createStar(e: React.FormEvent) {
    e.preventDefault()
    try {
      const useFor = starForm.use_for.split(',').map(s => s.trim()).filter(Boolean)
      const created = await apiFetch<StarExample>('/api/v1/setup/star-examples', {
        method: 'POST',
        body: JSON.stringify({ ...starForm, use_for: useFor.length ? useFor : undefined }),
      })
      setStars(prev => [...prev, created])
      setStarForm({ title: '', skill_demonstrated: '', situation: '', task: '', action: '', result: '', use_for: '' })
      showSuccess('STAR example created')
    } catch (x) {
      showError(x instanceof Error ? x.message : 'Failed to create')
    }
  }

  // ── Delete STAR example ───────────────────────────────────────
  async function deleteStar(id: string) {
    try {
      await apiFetch(`/api/v1/setup/star-examples/${id}`, { method: 'DELETE' })
      setStars(prev => prev.filter(s => s.id !== id))
      showSuccess('STAR example deleted')
    } catch (x) {
      showError(x instanceof Error ? x.message : 'Failed to delete')
    }
  }

  // ── Helpers for nested fields ─────────────────────────────────
  const updateBpDrive = useCallback((i: number, key: string, value: string) => {
    setBp(prev => {
      const drives = [...(prev.drives || [])]
      drives[i] = { ...drives[i], [key]: value }
      return { ...prev, drives }
    })
  }, [])

  const updateBpBehavior = useCallback((i: number, key: string, value: string) => {
    setBp(prev => {
      const behaviors = [...(prev.behaviors || [])]
      behaviors[i] = { ...behaviors[i], [key]: value }
      return { ...prev, behaviors }
    })
  }, [])

  const updateBpGrowth = useCallback((i: number, key: string, value: string) => {
    setBp(prev => {
      const areas = [...(prev.growth_areas || [])]
      areas[i] = { ...areas[i], [key]: value }
      return { ...prev, growth_areas: areas }
    })
  }, [])

  if (loading) return (
    <section className="mx-auto max-w-5xl">
      <p className="eyebrow">02 / PROFILE</p>
      <h2 className="title">Build your candidate profile</h2>
      <div className="mt-8 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-[#e2e2e5] rounded-lg" />
        <div className="h-64 bg-[#e2e2e5] rounded-2xl" />
        <div className="h-48 bg-[#e2e2e5] rounded-2xl" />
      </div>
    </section>
  )

  return (
    <section className="mx-auto max-w-5xl">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="eyebrow">02 / PROFILE</p>
        <h2 className="title">Build your candidate profile</h2>
        <p className="mt-2 text-sm text-[#858585]">
          Fill in your details so the AI can tailor applications to each job.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* ═══════════════════════════════════════════════════════════
            LEFT: Profile form
        ═══════════════════════════════════════════════════════════ */}
        <form onSubmit={submit} className="space-y-6">
          {/* ── Basic Info ──────────────────────────────────────── */}
          <div className="card space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">Basic Info</p>
                <p className="text-[11px] text-[#b0b0b0]">Your name and contact details</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-[#1d1d1f]">
                Full name <span className="text-rose-400">*</span>
                <input
                  required
                  className="field mt-1.5"
                  placeholder="Jane Doe"
                  value={form.full_name}
                  onChange={e => f('full_name', e.target.value)}
                />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                Email <span className="text-rose-400">*</span>
                <input
                  required
                  type="email"
                  className="field mt-1.5"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={e => f('email', e.target.value)}
                />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                Phone <span className="text-[#b0b0b0]">optional</span>
                <input
                  className="field mt-1.5"
                  placeholder="+45 12 34 56 78"
                  value={form.phone}
                  onChange={e => f('phone', e.target.value)}
                />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                Location <span className="text-[#b0b0b0]">optional</span>
                <input
                  className="field mt-1.5"
                  placeholder="Copenhagen, Denmark"
                  value={form.location}
                  onChange={e => f('location', e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* ── Work Experience ──────────────────────────────────── */}
          <div className="card space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">Work Experience</p>
                  <p className="text-[11px] text-[#b0b0b0]">{experiences.filter(e => e.title.trim()).length} position(s) added</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addExperience}
                className="flex items-center gap-1.5 rounded-full border border-[#0066cc] px-3 py-1.5 text-[11px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add experience
              </button>
            </div>

            {/* Experience cards */}
            {experiences.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#d2d2d7] p-8 text-center">
                <p className="text-sm text-[#858585]">No experience added yet.</p>
                <button
                  type="button"
                  onClick={addExperience}
                  className="mt-2 text-[13px] font-medium text-[#0066cc] hover:underline"
                >
                  + Add your first position
                </button>
              </div>
            )}

            <div className="space-y-4">
              {experiences.map((exp, idx) => {
                const isOpen = openExpCards.has(exp._id)
                return (
                  <div
                    key={exp._id}
                    className="animate-fade-in-up rounded-xl border border-[#e2e2e5] bg-white overflow-hidden"
                  >
                    {/* Clickable header — toggles collapse */}
                    <button
                      type="button"
                      onClick={() => toggleExpCard(exp._id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700">
                          {idx + 1}
                        </span>
                        <span className="text-[13px] font-medium text-[#474747]">
                          {exp.title || `Position ${idx + 1}`}
                        </span>
                        {!exp.title.trim() && (
                          <span className="text-[11px] text-[#b0b0b0]">— not filled</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg
                          className={`w-3.5 h-3.5 text-[#858585] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeExperience(exp._id) }}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[#b0b0b0] hover:bg-rose-50 hover:text-rose-400 transition-all"
                          title="Remove"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </button>

                    {/* Collapsible body */}
                    {isOpen && (
                      <div className="border-t border-[#e2e2e5] p-4 space-y-3 animate-fade-in-up">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block text-sm text-[#1d1d1f]">
                            Job title
                            <input
                              className="field mt-1.5"
                              placeholder="Senior Software Engineer"
                              value={exp.title}
                              onChange={e => updateExp(exp._id, 'title', e.target.value)}
                            />
                          </label>
                          <label className="block text-sm text-[#1d1d1f]">
                            Company
                            <input
                              className="field mt-1.5"
                              placeholder="Acme Corp"
                              value={exp.company}
                              onChange={e => updateExp(exp._id, 'company', e.target.value)}
                            />
                          </label>
                          <label className="block text-sm text-[#1d1d1f]">
                            Start date <span className="text-[#b0b0b0]">YYYY-MM</span>
                            <input
                              className="field mt-1.5"
                              placeholder="2022-03"
                              value={exp.start_date}
                              onChange={e => updateExp(exp._id, 'start_date', e.target.value)}
                            />
                          </label>
                          <label className="block text-sm text-[#1d1d1f]">
                            End date <span className="text-[#b0b0b0]">or present</span>
                            <input
                              className="field mt-1.5"
                              placeholder="2024-01"
                              value={exp.end_date}
                              onChange={e => updateExp(exp._id, 'end_date', e.target.value)}
                            />
                          </label>
                          <label className="block text-sm text-[#1d1d1f] sm:col-span-2">
                            Location <span className="text-[#b0b0b0]">optional</span>
                            <input
                              className="field mt-1.5"
                              placeholder="San Francisco, CA"
                              value={exp.location}
                              onChange={e => updateExp(exp._id, 'location', e.target.value)}
                            />
                          </label>
                        </div>
                        <label className="block text-sm text-[#1d1d1f]">
                          Achievements <span className="text-[#b0b0b0]">one per line</span>
                          <textarea
                            className="field mt-1.5 h-20 resize-none"
                            placeholder="Built X that reduced Y by Z%&#10;Led team of N to deliver Q&#10;Implemented feature resulting in W"
                            value={exp.bullets.join('\n')}
                            onChange={e => updateBullets(exp._id, e.target.value)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Education ────────────────────────────────────────── */}
          <div className="card space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">Education</p>
                  <p className="text-[11px] text-[#b0b0b0]">{educations.filter(e => e.degree.trim()).length} degree(s) added</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addEducation}
                className="flex items-center gap-1.5 rounded-full border border-[#0066cc] px-3 py-1.5 text-[11px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add education
              </button>
            </div>

            {educations.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#d2d2d7] p-8 text-center">
                <p className="text-sm text-[#858585]">No education added yet.</p>
                <button
                  type="button"
                  onClick={addEducation}
                  className="mt-2 text-[13px] font-medium text-[#0066cc] hover:underline"
                >
                  + Add your first degree
                </button>
              </div>
            )}

            <div className="space-y-4">
              {educations.map((edu, idx) => {
                const isOpen = openEduCards.has(edu._id)
                return (
                  <div
                    key={edu._id}
                    className="animate-fade-in-up rounded-xl border border-[#e2e2e5] bg-white overflow-hidden"
                  >
                    {/* Clickable header — toggles collapse */}
                    <button
                      type="button"
                      onClick={() => toggleEduCard(edu._id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700">
                          {idx + 1}
                        </span>
                        <span className="text-[13px] font-medium text-[#474747]">
                          {edu.degree || `Degree ${idx + 1}`}
                        </span>
                        {!edu.degree.trim() && (
                          <span className="text-[11px] text-[#b0b0b0]">— not filled</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg
                          className={`w-3.5 h-3.5 text-[#858585] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeEducation(edu._id) }}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[#b0b0b0] hover:bg-rose-50 hover:text-rose-400 transition-all"
                          title="Remove"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </button>

                    {/* Collapsible body */}
                    {isOpen && (
                      <div className="border-t border-[#e2e2e5] p-4 space-y-3 animate-fade-in-up">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block text-sm text-[#1d1d1f]">
                            Degree
                            <input
                              className="field mt-1.5"
                              placeholder="B.Sc. Computer Science"
                              value={edu.degree}
                              onChange={e => updateEdu(edu._id, 'degree', e.target.value)}
                            />
                          </label>
                          <label className="block text-sm text-[#1d1d1f]">
                            Institution
                            <input
                              className="field mt-1.5"
                              placeholder="MIT"
                              value={edu.institution}
                              onChange={e => updateEdu(edu._id, 'institution', e.target.value)}
                            />
                          </label>
                          <label className="block text-sm text-[#1d1d1f]">
                            Period <span className="text-[#b0b0b0]">optional</span>
                            <input
                              className="field mt-1.5"
                              placeholder="2020–2024"
                              value={edu.period}
                              onChange={e => updateEdu(edu._id, 'period', e.target.value)}
                            />
                          </label>
                        </div>
                        <label className="block text-sm text-[#1d1d1f]">
                          Key topics <span className="text-[#b0b0b0]">optional — relevant coursework</span>
                          <textarea
                            className="field mt-1.5 h-16 resize-none"
                            placeholder="Machine Learning, Distributed Systems, Algorithm Design"
                            value={edu.key_topics}
                            onChange={e => updateEdu(edu._id, 'key_topics', e.target.value)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Projects ──────────────────────────────────────────── */}
          <div className="card space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">Projects</p>
                  <p className="text-[11px] text-[#b0b0b0]">{projects.filter(p => p.name.trim()).length} project(s) added</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addProject}
                className="flex items-center gap-1.5 rounded-full border border-[#0066cc] px-3 py-1.5 text-[11px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add project
              </button>
            </div>

            {projects.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#d2d2d7] p-8 text-center">
                <p className="text-sm text-[#858585]">No projects added yet.</p>
                <button
                  type="button"
                  onClick={addProject}
                  className="mt-2 text-[13px] font-medium text-[#0066cc] hover:underline"
                >
                  + Add your first project
                </button>
              </div>
            )}

            <div className="space-y-4">
              {projects.map((proj, idx) => {
                const isOpen = openProjectCards.has(proj._id)
                return (
                  <div
                    key={proj._id}
                    className="animate-fade-in-up rounded-xl border border-[#e2e2e5] bg-white overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleProjectCard(proj._id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700">
                          {idx + 1}
                        </span>
                        <span className="text-[13px] font-medium text-[#474747]">
                          {proj.name || `Project ${idx + 1}`}
                        </span>
                        {!proj.name.trim() && (
                          <span className="text-[11px] text-[#b0b0b0]">— not filled</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg
                          className={`w-3.5 h-3.5 text-[#858585] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeProject(proj._id) }}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[#b0b0b0] hover:bg-rose-50 hover:text-rose-400 transition-all"
                          title="Remove"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-[#e2e2e5] p-4 space-y-3 animate-fade-in-up">
                        <label className="block text-sm text-[#1d1d1f]">
                          Project name
                          <input
                            className="field mt-1.5"
                            placeholder="ML Pipeline Optimization"
                            value={proj.name}
                            onChange={e => updateProject(proj._id, 'name', e.target.value)}
                          />
                        </label>
                        <label className="block text-sm text-[#1d1d1f]">
                          Description <span className="text-[#b0b0b0]">optional</span>
                          <textarea
                            className="field mt-1.5 h-20 resize-none"
                            placeholder="Built an end-to-end ML pipeline that reduced inference time by 40% and improved model accuracy by 15%."
                            value={proj.description}
                            onChange={e => updateProject(proj._id, 'description', e.target.value)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Skills & Summary ─────────────────────────────────── */}
          <div className="card space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">Skills & Summary</p>
                <p className="text-[11px] text-[#b0b0b0]">Technical skills and professional summary</p>
              </div>
            </div>
            <label className="block text-sm text-[#1d1d1f]">
              Skills <span className="text-[#b0b0b0]">comma separated</span>
              <input
                className="field mt-1.5"
                placeholder="Python, FastAPI, React, PostgreSQL, Docker…"
                value={form.skills_raw}
                onChange={e => f('skills_raw', e.target.value)}
              />
            </label>
            {form.skills_raw && (
              <div className="flex flex-wrap gap-1.5">
                {form.skills_raw.split(',').map(s => s.trim()).filter(Boolean).map((skill, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-[#e2e2e5] bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] text-[#474747] animate-fade-in-up"
                    style={{ animationDelay: `${i * 20}ms` }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
            <label className="block text-sm text-[#1d1d1f]">
              Profile summary <span className="text-[#b0b0b0]">optional — 2-3 sentences</span>
              <textarea
                className="field mt-1.5 h-24 resize-none"
                placeholder="ML engineer with 5+ years building production systems at scale. Passionate about turning complex problems into elegant solutions."
                value={form.profile_statement}
                onChange={e => f('profile_statement', e.target.value)}
              />
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

          {/* ── Save button + error ──────────────────────────────── */}
          <button disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {saving ? 'Saving…' : exists ? 'Update profile' : 'Save profile'}
          </button>
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

        {/* ═══════════════════════════════════════════════════════════
            RIGHT: Status + Behavioral Profile + STAR
        ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          {/* ── Status panel ─────────────────────────────────────── */}
          {saved ? (
            <div className="card space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Profile saved</p>
                  <p className="text-[11px] text-[#858585]">Your data is stored and ready</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/scrape')}
                className="btn-primary w-full"
              >
                Continue to Scrape →
              </button>
            </div>
          ) : (
            <div className="card border-dashed">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f0f2]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#858585]">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#707070]">
                    {exists ? 'Profile loaded' : 'No profile yet'}
                  </p>
                  <p className="text-[11px] text-[#b0b0b0]">
                    {exists ? 'Edit and save to update.' : 'Fill the form and save to get started.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
             BEHAVIORAL PROFILE SECTION
          ═══════════════════════════════════════════════════════════ */}
          <div className="card overflow-hidden !p-0">
            <button
              onClick={() => setBpOpen(!bpOpen)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#f5f5f7] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">Behavioral Profile</p>
                  <p className="text-[11px] text-[#b0b0b0] mt-0.5">
                    {bp.profile_type || bp.drives?.length ? 'Profile defined' : 'DISC, strengths, work preferences'}
                  </p>
                </div>
              </div>
              <svg className={`w-4 h-4 text-[#858585] transition-transform ${bpOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {bpOpen && (
              <div className="px-6 pb-6 space-y-4 border-t border-[#f0f0f2] pt-4 animate-fade-in-up">
                <label className="block text-sm text-[#1d1d1f]">
                  Profile type <span className="text-[#b0b0b0]">e.g. Analytical Driver</span>
                  <input className="field mt-1.5" placeholder="Analytical Driver, Collaborative Builder..." value={bp.profile_type || ''} onChange={e => setBp(prev => ({ ...prev, profile_type: e.target.value }))} />
                </label>
                <label className="block text-sm text-[#1d1d1f]">
                  Summary
                  <textarea className="field mt-1.5 h-16 resize-none" value={bp.summary || ''} onChange={e => setBp(prev => ({ ...prev, summary: e.target.value }))} />
                </label>

                {/* Core drives */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-[#707070]">Core drives</p>
                    <button
                      onClick={() => setBp(prev => ({ ...prev, drives: [...(prev.drives || []), { drive: '', level: '', meaning: '' }] }))}
                      className="text-[11px] text-[#0066cc] hover:underline"
                    >+ Add drive</button>
                  </div>
                  {(bp.drives || []).map((d, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-start">
                      <input className="field text-sm flex-1" placeholder="Drive name" value={d.drive} onChange={e => updateBpDrive(i, 'drive', e.target.value)} />
                      <input className="field text-sm w-20" placeholder="Level" value={d.level || ''} onChange={e => updateBpDrive(i, 'level', e.target.value)} />
                      <button
                        onClick={() => setBp(prev => ({ ...prev, drives: (prev.drives || []).filter((_, j) => j !== i) }))}
                        className="text-[#b0b0b0] hover:text-rose-400 mt-1.5 shrink-0"
                      >✕</button>
                    </div>
                  ))}
                </div>

                {/* Behaviors */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-[#707070]">Strongest behaviors</p>
                    <button
                      onClick={() => setBp(prev => ({ ...prev, behaviors: [...(prev.behaviors || []), { behavior: '', description: '' }] }))}
                      className="text-[11px] text-[#0066cc] hover:underline"
                    >+ Add behavior</button>
                  </div>
                  {(bp.behaviors || []).map((b, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-start">
                      <input className="field text-sm flex-1" placeholder="Behavior" value={b.behavior} onChange={e => updateBpBehavior(i, 'behavior', e.target.value)} />
                      <input className="field text-sm flex-1" placeholder="Description" value={b.description || ''} onChange={e => updateBpBehavior(i, 'description', e.target.value)} />
                      <button
                        onClick={() => setBp(prev => ({ ...prev, behaviors: (prev.behaviors || []).filter((_, j) => j !== i) }))}
                        className="text-[#b0b0b0] hover:text-rose-400 mt-1.5 shrink-0"
                      >✕</button>
                    </div>
                  ))}
                </div>

                {/* Work preferences */}
                <label className="block text-sm text-[#1d1d1f]">
                  Work preferences <span className="text-[#b0b0b0]">comma separated</span>
                  <input className="field mt-1.5" placeholder="Autonomous, Fast-paced, Collaborative..." value={(bp.work_preferences || []).join(', ')} onChange={e => setBp(prev => ({ ...prev, work_preferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
                </label>

                {/* Growth areas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-[#707070]">Growth areas</p>
                    <button
                      onClick={() => setBp(prev => ({ ...prev, growth_areas: [...(prev.growth_areas || []), { area: '', positive_frame: '' }] }))}
                      className="text-[11px] text-[#0066cc] hover:underline"
                    >+ Add area</button>
                  </div>
                  {(bp.growth_areas || []).map((g, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-start">
                      <input className="field text-sm flex-1" placeholder="Area" value={g.area} onChange={e => updateBpGrowth(i, 'area', e.target.value)} />
                      <input className="field text-sm flex-1" placeholder="Positive reframe" value={g.positive_frame || ''} onChange={e => updateBpGrowth(i, 'positive_frame', e.target.value)} />
                      <button
                        onClick={() => setBp(prev => ({ ...prev, growth_areas: (prev.growth_areas || []).filter((_, j) => j !== i) }))}
                        className="text-[#b0b0b0] hover:text-rose-400 mt-1.5 shrink-0"
                      >✕</button>
                    </div>
                  ))}
                </div>

                {/* Keywords */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm text-[#1d1d1f]">
                    Strong fit keywords <span className="text-[#b0b0b0]">comma sep</span>
                    <input className="field mt-1.5" placeholder="Autonomy, Innovation..." value={(bp.strong_fit_keywords || []).join(', ')} onChange={e => setBp(prev => ({ ...prev, strong_fit_keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Friction keywords <span className="text-[#b0b0b0]">comma sep</span>
                    <input className="field mt-1.5" placeholder="Micromanagement..." value={(bp.friction_keywords || []).join(', ')} onChange={e => setBp(prev => ({ ...prev, friction_keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
                  </label>
                </div>

                {/* Management preferences */}
                <div>
                  <p className="text-xs font-semibold text-[#707070] mb-2">Management preferences</p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm text-[#1d1d1f]">
                      Works with
                      <input className="field mt-1.5" placeholder="Delegators, Mentors..." value={(bp.management_preferences?.works_with || []).join(', ')} onChange={e => setBp(prev => {
                        const mp = prev.management_preferences || { works_with: [], doesnt_work: [] }
                        return { ...prev, management_preferences: { ...mp, works_with: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }
                      })} />
                    </label>
                    <label className="block text-sm text-[#1d1d1f]">
                      Doesn't work
                      <input className="field mt-1.5" placeholder="Micromanagers..." value={(bp.management_preferences?.doesnt_work || []).join(', ')} onChange={e => setBp(prev => {
                        const mp = prev.management_preferences || { works_with: [], doesnt_work: [] }
                        return { ...prev, management_preferences: { ...mp, doesnt_work: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }
                      })} />
                    </label>
                  </div>
                </div>

                <button onClick={saveBehavioralProfile} disabled={bpSaving} className="btn-secondary w-full disabled:opacity-40">
                  {bpSaving ? 'Saving…' : 'Save behavioral profile'}
                </button>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════
             STAR EXAMPLES SECTION
          ═══════════════════════════════════════════════════════════ */}
          <div className="card overflow-hidden !p-0">
            <button
              onClick={() => setStarOpen(!starOpen)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#f5f5f7] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">STAR Examples</p>
                  <p className="text-[11px] text-[#b0b0b0] mt-0.5">{stars.length} example(s) saved</p>
                </div>
              </div>
              <svg className={`w-4 h-4 text-[#858585] transition-transform ${starOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {starOpen && (
              <div className="px-6 pb-6 space-y-4 border-t border-[#f0f0f2] pt-4 animate-fade-in-up">
                {/* Existing examples */}
                {stars.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                    {stars.map(s => (
                      <div key={s.id} className="flex items-start justify-between gap-2 rounded-xl border border-[#e2e2e5] p-3 hover:border-[#d2d2d7] transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1d1d1f]">{s.title}</p>
                          {s.skill_demonstrated && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-[#f4f8fb] text-[10px] text-[#0066cc]">{s.skill_demonstrated}</span>
                          )}
                          <p className="text-[11px] text-[#858585] mt-1 line-clamp-2">
                            <strong>S:</strong> {s.situation.slice(0, 80)}{s.situation.length > 80 ? '…' : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteStar(s.id)}
                          className="text-[#b0b0b0] hover:text-rose-400 shrink-0 mt-0.5"
                          title="Delete"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New STAR form */}
                <form onSubmit={createStar} className="space-y-3">
                  <p className="text-xs font-semibold text-[#707070]">Add new STAR example</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm text-[#1d1d1f]">
                      Title <span className="text-rose-400">*</span>
                      <input required className="field mt-1.5" placeholder="ML Pipeline Optimization" value={starForm.title} onChange={e => setStarForm(prev => ({ ...prev, title: e.target.value }))} />
                    </label>
                    <label className="block text-sm text-[#1d1d1f]">
                      Skill <span className="text-[#b0b0b0]">opt</span>
                      <input className="field mt-1.5" placeholder="Machine Learning, Leadership..." value={starForm.skill_demonstrated} onChange={e => setStarForm(prev => ({ ...prev, skill_demonstrated: e.target.value }))} />
                    </label>
                  </div>
                  <label className="block text-sm text-[#1d1d1f]">
                    Situation <span className="text-rose-400">*</span>
                    <textarea required className="field mt-1.5 h-14 resize-none" placeholder="What was the context?" value={starForm.situation} onChange={e => setStarForm(prev => ({ ...prev, situation: e.target.value }))} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Task <span className="text-rose-400">*</span>
                    <textarea required className="field mt-1.5 h-14 resize-none" placeholder="What needed to be done?" value={starForm.task} onChange={e => setStarForm(prev => ({ ...prev, task: e.target.value }))} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Action <span className="text-rose-400">*</span>
                    <textarea required className="field mt-1.5 h-14 resize-none" placeholder="What did you do?" value={starForm.action} onChange={e => setStarForm(prev => ({ ...prev, action: e.target.value }))} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Result <span className="text-rose-400">*</span>
                    <textarea required className="field mt-1.5 h-14 resize-none" placeholder="What was the outcome?" value={starForm.result} onChange={e => setStarForm(prev => ({ ...prev, result: e.target.value }))} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Use for <span className="text-[#b0b0b0]">comma separated tags, opt</span>
                    <input className="field mt-1.5" placeholder="teamwork, technical challenge, leadership" value={starForm.use_for} onChange={e => setStarForm(prev => ({ ...prev, use_for: e.target.value }))} />
                  </label>
                  <button className="btn-primary w-full">
                    Add STAR example
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
