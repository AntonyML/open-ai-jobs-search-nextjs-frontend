'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { showSuccess, showError } from '@/lib/toasts'

// ── Types ──────────────────────────────────────────────────────────

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

  // ── Profile form ──────────────────────────────────────────────
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    job_title: '',
    company: '',
    start_date: '',
    end_date: '',
    bullets_raw: '',
    degree: '',
    institution: '',
    edu_period: '',
    skills_raw: '',
    profile_statement: '',
  })

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

  function f(name: string, value: string) {
    setForm(prev => ({ ...prev, [name]: value }))
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
          const exp = profile.experience?.[0]
          const edu = profile.education?.[0]
          const mlSkills: any[] = profile.skills?.programming_ml ?? []
          const tools: string[] = profile.skills?.software_tools ?? []
          const allSkills = [...mlSkills.map((s: any) => s.language ?? s).filter(Boolean), ...tools].join(', ')
          setForm({
            full_name: profile.full_name ?? '',
            email: profile.email ?? '',
            phone: profile.phone ?? '',
            location: profile.location ?? '',
            job_title: exp?.title ?? '',
            company: exp?.company ?? '',
            start_date: exp?.start_date ?? '',
            end_date: exp?.end_date ?? '',
            bullets_raw: (exp?.bullets ?? []).join('\n'),
            degree: edu?.degree ?? '',
            institution: edu?.institution ?? '',
            edu_period: edu?.period ?? '',
            skills_raw: allSkills,
            profile_statement: profile.profile_statement ?? '',
          })
        }
        if (bpData) setBp(bpData)
        if (Array.isArray(starData)) setStars(starData)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Build profile payload ─────────────────────────────────────
  function buildPayload() {
    const skillsList = form.skills_raw.split(',').map(s => s.trim()).filter(Boolean)
    const bullets = form.bullets_raw.split('\n').map(s => s.trim()).filter(Boolean)
    const payload: Record<string, any> = {}
    if (form.full_name) payload.full_name = form.full_name
    if (form.email) payload.email = form.email
    if (form.phone) payload.phone = form.phone
    if (form.location) payload.location = form.location
    if (form.job_title.trim()) {
      payload.experience = [{
        title: form.job_title.trim(),
        company: form.company.trim(),
        start_date: form.start_date.trim() || undefined,
        end_date: form.end_date.trim() || undefined,
        bullets,
      }]
    }
    if (form.degree.trim()) {
      payload.education = [{ degree: form.degree.trim(), institution: form.institution.trim(), period: form.edu_period.trim() || undefined }]
    }
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

  if (loading) return <div className="mx-auto max-w-5xl p-8 text-sm text-[#858585]">Loading profile…</div>

  return (
    <section className="mx-auto max-w-5xl">
      <p className="eyebrow">02 / PROFILE</p>
      <h2 className="title">Build your candidate profile</h2>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* ── LEFT: Profile form ──────────────────────────────────── */}
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">Basic info</p>

            <label className="block text-sm text-[#1d1d1f]">
              Full name
              <input required className="field mt-2" value={form.full_name} onChange={e => f('full_name', e.target.value)} />
            </label>
            <label className="block text-sm text-[#1d1d1f]">
              Email
              <input required type="email" className="field mt-2" value={form.email} onChange={e => f('email', e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-[#1d1d1f]">
                Phone <span className="text-[#b0b0b0]">opt</span>
                <input className="field mt-2" value={form.phone} onChange={e => f('phone', e.target.value)} />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                Location <span className="text-[#b0b0b0]">opt</span>
                <input className="field mt-2" value={form.location} onChange={e => f('location', e.target.value)} />
              </label>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-[#858585] pt-2">Most recent experience</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-[#1d1d1f]">
                Job title
                <input required className="field mt-2" placeholder="Software Engineer" value={form.job_title} onChange={e => f('job_title', e.target.value)} />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                Company
                <input className="field mt-2" placeholder="Acme Corp" value={form.company} onChange={e => f('company', e.target.value)} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-[#1d1d1f]">
                Start <span className="text-[#b0b0b0]">YYYY-MM</span>
                <input className="field mt-2" placeholder="2022-03" value={form.start_date} onChange={e => f('start_date', e.target.value)} />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                End <span className="text-[#b0b0b0]">or present</span>
                <input className="field mt-2" placeholder="2024-01" value={form.end_date} onChange={e => f('end_date', e.target.value)} />
              </label>
            </div>
            <label className="block text-sm text-[#1d1d1f]">
              Achievements <span className="text-[#b0b0b0]">one per line</span>
              <textarea className="field mt-2 h-20 resize-none" placeholder="Built X that reduced Y by Z%" value={form.bullets_raw} onChange={e => f('bullets_raw', e.target.value)} />
            </label>

            <p className="text-xs font-bold uppercase tracking-widest text-[#858585] pt-2">Education</p>
            <label className="block text-sm text-[#1d1d1f]">
              Degree
              <input className="field mt-2" placeholder="B.Sc. Computer Science" value={form.degree} onChange={e => f('degree', e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-[#1d1d1f]">
                Institution
                <input className="field mt-2" placeholder="MIT" value={form.institution} onChange={e => f('institution', e.target.value)} />
              </label>
              <label className="block text-sm text-[#1d1d1f]">
                Period <span className="text-[#b0b0b0]">opt</span>
                <input className="field mt-2" placeholder="2020–2024" value={form.edu_period} onChange={e => f('edu_period', e.target.value)} />
              </label>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-[#858585] pt-2">Skills & summary</p>
            <label className="block text-sm text-[#1d1d1f]">
              Skills <span className="text-[#b0b0b0]">comma separated</span>
              <input className="field mt-2" placeholder="Python, FastAPI, React…" value={form.skills_raw} onChange={e => f('skills_raw', e.target.value)} />
            </label>
            <label className="block text-sm text-[#1d1d1f]">
              Profile summary <span className="text-[#b0b0b0]">opt</span>
              <textarea className="field mt-2 h-20 resize-none" value={form.profile_statement} onChange={e => f('profile_statement', e.target.value)} />
            </label>

            <button disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : exists ? 'Update profile' : 'Save profile'}</button>
            {error && <p className="text-sm text-rose-500">{error}</p>}
          </div>
        </form>

        {/* ── RIGHT: Status + Behavioral Profile + STAR ────────────── */}
        <div className="space-y-4">
          {saved ? (
            <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6 space-y-3">
              <p className="text-sm font-semibold text-emerald-600">✅ Profile saved</p>
              <button onClick={() => router.push('/scrape')} className="btn-primary w-full">Continue to Scrape →</button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d2d2d7] p-6 text-sm text-[#858585]">
              {exists ? 'Profile loaded. Edit and save to update.' : 'Fill the form and save.'}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
             BEHAVIORAL PROFILE SECTION
          ═══════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-[#d2d2d7] bg-white overflow-hidden">
            <button
              onClick={() => setBpOpen(!bpOpen)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#f5f5f7] transition-colors"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">BEHAVIORAL PROFILE</p>
                <p className="text-[11px] text-[#b0b0b0] mt-0.5">
                  {bp.profile_type || bp.drives?.length ? 'Profile defined' : 'DISC, strengths, work preferences'}
                </p>
              </div>
              <svg className={`w-4 h-4 text-[#858585] transition-transform ${bpOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {bpOpen && (
              <div className="px-6 pb-6 space-y-4 border-t border-[#f0f0f2] pt-4">
                <label className="block text-sm text-[#1d1d1f]">
                  Profile type <span className="text-[#b0b0b0]">e.g. Analytical Driver</span>
                  <input className="field mt-2" placeholder="Analytical Driver, Collaborative Builder..." value={bp.profile_type || ''} onChange={e => setBp(prev => ({ ...prev, profile_type: e.target.value }))} />
                </label>
                <label className="block text-sm text-[#1d1d1f]">
                  Summary
                  <textarea className="field mt-2 h-16 resize-none" value={bp.summary || ''} onChange={e => setBp(prev => ({ ...prev, summary: e.target.value }))} />
                </label>

                {/* ── Core drives ──────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-[#707070]">Core drives</p>
                    <button
                      onClick={() => setBp(prev => ({ ...prev, drives: [...(prev.drives || []), { drive: '', level: '', meaning: '' }] }))}
                      className="text-[11px] text-[#0066cc] hover:underline"
                    >+ Add drive</button>
                  </div>
                  {(bp.drives || []).map((d, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 mb-2 items-start">
                      <input className="field text-sm" placeholder="Drive name" value={d.drive} onChange={e => updateBpDrive(i, 'drive', e.target.value)} />
                      <input className="field text-sm w-20" placeholder="Level" value={d.level || ''} onChange={e => updateBpDrive(i, 'level', e.target.value)} />
                      <button
                        onClick={() => setBp(prev => ({ ...prev, drives: (prev.drives || []).filter((_, j) => j !== i) }))}
                        className="text-[#b0b0b0] hover:text-rose-400 mt-1"
                      >✕</button>
                    </div>
                  ))}
                </div>

                {/* ── Behaviors ────────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-[#707070]">Strongest behaviors</p>
                    <button
                      onClick={() => setBp(prev => ({ ...prev, behaviors: [...(prev.behaviors || []), { behavior: '', description: '' }] }))}
                      className="text-[11px] text-[#0066cc] hover:underline"
                    >+ Add behavior</button>
                  </div>
                  {(bp.behaviors || []).map((b, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2 items-start">
                      <input className="field text-sm" placeholder="Behavior" value={b.behavior} onChange={e => updateBpBehavior(i, 'behavior', e.target.value)} />
                      <input className="field text-sm" placeholder="Description" value={b.description || ''} onChange={e => updateBpBehavior(i, 'description', e.target.value)} />
                      <button
                        onClick={() => setBp(prev => ({ ...prev, behaviors: (prev.behaviors || []).filter((_, j) => j !== i) }))}
                        className="text-[#b0b0b0] hover:text-rose-400 mt-1"
                      >✕</button>
                    </div>
                  ))}
                </div>

                {/* ── Work preferences ─────────────────────────── */}
                <label className="block text-sm text-[#1d1d1f]">
                  Work preferences <span className="text-[#b0b0b0]">comma separated</span>
                  <input className="field mt-2" placeholder="Autonomous, Fast-paced, Collaborative..." value={(bp.work_preferences || []).join(', ')} onChange={e => setBp(prev => ({ ...prev, work_preferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
                </label>

                {/* ── Growth areas ─────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-[#707070]">Growth areas</p>
                    <button
                      onClick={() => setBp(prev => ({ ...prev, growth_areas: [...(prev.growth_areas || []), { area: '', positive_frame: '' }] }))}
                      className="text-[11px] text-[#0066cc] hover:underline"
                    >+ Add area</button>
                  </div>
                  {(bp.growth_areas || []).map((g, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2 items-start">
                      <input className="field text-sm" placeholder="Area" value={g.area} onChange={e => updateBpGrowth(i, 'area', e.target.value)} />
                      <input className="field text-sm" placeholder="Positive reframe" value={g.positive_frame || ''} onChange={e => updateBpGrowth(i, 'positive_frame', e.target.value)} />
                      <button
                        onClick={() => setBp(prev => ({ ...prev, growth_areas: (prev.growth_areas || []).filter((_, j) => j !== i) }))}
                        className="text-[#b0b0b0] hover:text-rose-400 mt-1"
                      >✕</button>
                    </div>
                  ))}
                </div>

                {/* ── Keywords ─────────────────────────────────── */}
                <label className="block text-sm text-[#1d1d1f]">
                  Strong fit keywords <span className="text-[#b0b0b0]">comma separated</span>
                  <input className="field mt-2" placeholder="Autonomy, Innovation, Impact..." value={(bp.strong_fit_keywords || []).join(', ')} onChange={e => setBp(prev => ({ ...prev, strong_fit_keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
                </label>
                <label className="block text-sm text-[#1d1d1f]">
                  Friction keywords <span className="text-[#b0b0b0]">comma separated</span>
                  <input className="field mt-2" placeholder="Micromanagement, Bureaucracy..." value={(bp.friction_keywords || []).join(', ')} onChange={e => setBp(prev => ({ ...prev, friction_keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
                </label>

                {/* ── Management preferences ───────────────────── */}
                <p className="text-xs font-semibold text-[#707070]">Management preferences</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm text-[#1d1d1f]">
                    Works with
                    <input className="field mt-2" placeholder="Delegators, Mentors..." value={(bp.management_preferences?.works_with || []).join(', ')} onChange={e => setBp(prev => ({ ...prev, management_preferences: { ...prev.management_preferences, works_with: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Doesn't work
                    <input className="field mt-2" placeholder="Micromanagers..." value={(bp.management_preferences?.doesnt_work || []).join(', ')} onChange={e => setBp(prev => ({ ...prev, management_preferences: { ...prev.management_preferences, doesnt_work: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))} />
                  </label>
                </div>

                <button onClick={saveBehavioralProfile} disabled={bpSaving} className="rounded-full border border-[#0066cc] px-5 py-2 text-[13px] font-medium text-[#0066cc] hover:bg-[#f4f8fb] transition-colors w-full disabled:opacity-40">
                  {bpSaving ? 'Saving…' : 'Save behavioral profile'}
                </button>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════
             STAR EXAMPLES SECTION
          ═══════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-[#d2d2d7] bg-white overflow-hidden">
            <button
              onClick={() => setStarOpen(!starOpen)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#f5f5f7] transition-colors"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#858585]">STAR EXAMPLES</p>
                <p className="text-[11px] text-[#b0b0b0] mt-0.5">{stars.length} example(s) saved</p>
              </div>
              <svg className={`w-4 h-4 text-[#858585] transition-transform ${starOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {starOpen && (
              <div className="px-6 pb-6 space-y-4 border-t border-[#f0f0f2] pt-4">
                {/* Existing examples */}
                {stars.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {stars.map(s => (
                      <div key={s.id} className="flex items-start justify-between gap-2 rounded-xl border border-[#e2e2e5] p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1d1d1f]">{s.title}</p>
                          {s.skill_demonstrated && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-[#f4f8fb] text-[10px] text-[#0066cc]">{s.skill_demonstrated}</span>
                          )}
                          <p className="text-[11px] text-[#858585] mt-1 line-clamp-1">
                            <strong>S:</strong> {s.situation.slice(0, 60)}… <strong>T:</strong> {s.task.slice(0, 40)}…
                          </p>
                        </div>
                        <button
                          onClick={() => deleteStar(s.id)}
                          className="text-[#b0b0b0] hover:text-rose-400 shrink-0"
                          title="Delete"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New STAR form */}
                <form onSubmit={createStar} className="space-y-3">
                  <p className="text-xs font-semibold text-[#707070]">Add new STAR example</p>
                  <label className="block text-sm text-[#1d1d1f]">
                    Title
                    <input required className="field mt-2" placeholder="ML Pipeline Optimization" value={starForm.title} onChange={e => setStarForm(prev => ({ ...prev, title: e.target.value }))} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Skill demonstrated <span className="text-[#b0b0b0]">opt</span>
                    <input className="field mt-2" placeholder="Machine Learning, Leadership..." value={starForm.skill_demonstrated} onChange={e => setStarForm(prev => ({ ...prev, skill_demonstrated: e.target.value }))} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Situation
                    <textarea required className="field mt-2 h-14 resize-none" placeholder="What was the context?" value={starForm.situation} onChange={e => setStarForm(prev => ({ ...prev, situation: e.target.value }))} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Task
                    <textarea required className="field mt-2 h-14 resize-none" placeholder="What needed to be done?" value={starForm.task} onChange={e => setStarForm(prev => ({ ...prev, task: e.target.value }))} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Action
                    <textarea required className="field mt-2 h-14 resize-none" placeholder="What did you do?" value={starForm.action} onChange={e => setStarForm(prev => ({ ...prev, action: e.target.value }))} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Result
                    <textarea required className="field mt-2 h-14 resize-none" placeholder="What was the outcome?" value={starForm.result} onChange={e => setStarForm(prev => ({ ...prev, result: e.target.value }))} />
                  </label>
                  <label className="block text-sm text-[#1d1d1f]">
                    Use for <span className="text-[#b0b0b0]">comma separated tags, opt</span>
                    <input className="field mt-2" placeholder="teamwork, technical challenge, leadership" value={starForm.use_for} onChange={e => setStarForm(prev => ({ ...prev, use_for: e.target.value }))} />
                  </label>
                  <button className="rounded-full bg-[#0071e3] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#0068d2] transition-colors w-full">
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
