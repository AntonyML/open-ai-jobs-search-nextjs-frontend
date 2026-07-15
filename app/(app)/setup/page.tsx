'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { showSuccess, showError } from '@/lib/toasts'

export default function Setup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [exists, setExists] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    // experience[0] fields
    job_title: '',
    company: '',
    start_date: '',
    end_date: '',
    bullets_raw: '',   // newline-separated bullets
    // education[0]
    degree: '',
    institution: '',
    edu_period: '',
    // skills
    skills_raw: '',
    // misc
    profile_statement: '',
  })

  function f(name: string, value: string) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Load existing profile on mount
  useEffect(() => {
    setLoading(true)
    apiFetch<any>('/api/v1/setup/profile')
      .then(p => {
        setExists(true)
        const exp = p.experience?.[0]
        const edu = p.education?.[0]
        const tools: string[] = p.skills?.software_tools ?? []
        const mlSkills: any[] = p.skills?.programming_ml ?? []
        const allSkills = [
          ...mlSkills.map((s: any) => s.language ?? s).filter(Boolean),
          ...tools,
        ].join(', ')
        setForm({
          full_name: p.full_name ?? '',
          email: p.email ?? '',
          phone: p.phone ?? '',
          location: p.location ?? '',
          job_title: exp?.title ?? '',
          company: exp?.company ?? '',
          start_date: exp?.start_date ?? '',
          end_date: exp?.end_date ?? '',
          bullets_raw: (exp?.bullets ?? []).join('\n'),
          degree: edu?.degree ?? '',
          institution: edu?.institution ?? '',
          edu_period: edu?.period ?? '',
          skills_raw: allSkills,
          profile_statement: p.profile_statement ?? '',
        })
      })
      .catch(() => setExists(false))
      .finally(() => setLoading(false))
  }, [])

  function buildPayload() {
    const skillsList = form.skills_raw.split(',').map(s => s.trim()).filter(Boolean)
    const skills = skillsList.length
      ? { software_tools: skillsList, programming_ml: [], domain_expertise: [] }
      : undefined

    const bullets = form.bullets_raw.split('\n').map(s => s.trim()).filter(Boolean)
    const experience = form.job_title.trim()
      ? [{
          title: form.job_title.trim(),
          company: form.company.trim(),
          start_date: form.start_date.trim() || undefined,
          end_date: form.end_date.trim() || undefined,
          bullets,
        }]
      : undefined

    const education = form.degree.trim()
      ? [{ degree: form.degree.trim(), institution: form.institution.trim(), period: form.edu_period.trim() || undefined }]
      : undefined

    const payload: Record<string, any> = {}
    if (form.full_name) payload.full_name = form.full_name
    if (form.email) payload.email = form.email
    if (form.phone) payload.phone = form.phone
    if (form.location) payload.location = form.location
    if (experience) payload.experience = experience
    if (education) payload.education = education
    if (skills) payload.skills = skills
    if (form.profile_statement) payload.profile_statement = form.profile_statement
    return payload
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = buildPayload()
      const method = exists ? 'PATCH' : 'POST'
      await apiFetch<any>('/api/v1/setup/profile', { method, body: JSON.stringify(payload) })
      setExists(true)
      setSaved(true)
      const steps = JSON.parse(localStorage.getItem('completed_steps') || '[]')
      if (!steps.includes(1)) {
        localStorage.setItem('completed_steps', JSON.stringify([...steps, 1]))
        showSuccess('Profile saved! Step 2 completed.')
      } else {
        showSuccess('Profile updated successfully')
      }
    } catch (x) {
      const msg = x instanceof Error ? x.message : 'Request failed'
      setError(msg)
      showError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-slate-500 p-8">Loading profile…</div>

  return (
    <section className="mx-auto max-w-5xl">
      <p className="eyebrow">02 / PROFILE</p>
      <h2 className="title">Build your candidate profile</h2>
      {exists && !saved && (
        <p className="mt-2 text-xs text-cyan-400">Existing profile loaded — edit and save to update.</p>
      )}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="card space-y-4">

          {/* Basic info */}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Basic info</p>
          <label className="block text-sm text-slate-300">Full name
            <input required className="field mt-2" value={form.full_name} onChange={e => f('full_name', e.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">Email
            <input required type="email" className="field mt-2" value={form.email} onChange={e => f('email', e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-slate-300">Phone <span className="text-slate-600">opt</span>
              <input className="field mt-2" value={form.phone} onChange={e => f('phone', e.target.value)} />
            </label>
            <label className="block text-sm text-slate-300">Location <span className="text-slate-600">opt</span>
              <input className="field mt-2" value={form.location} onChange={e => f('location', e.target.value)} />
            </label>
          </div>

          {/* Experience */}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 pt-2">Most recent experience</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-slate-300">Job title
              <input required className="field mt-2" placeholder="Software Engineer" value={form.job_title} onChange={e => f('job_title', e.target.value)} />
            </label>
            <label className="block text-sm text-slate-300">Company
              <input className="field mt-2" placeholder="Acme Corp" value={form.company} onChange={e => f('company', e.target.value)} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-slate-300">Start <span className="text-slate-600">YYYY-MM</span>
              <input className="field mt-2" placeholder="2022-03" value={form.start_date} onChange={e => f('start_date', e.target.value)} />
            </label>
            <label className="block text-sm text-slate-300">End <span className="text-slate-600">or present</span>
              <input className="field mt-2" placeholder="2024-01" value={form.end_date} onChange={e => f('end_date', e.target.value)} />
            </label>
          </div>
          <label className="block text-sm text-slate-300">Achievements / bullets <span className="text-slate-600">one per line</span>
            <textarea className="field mt-2 h-20 resize-none" placeholder="Built X that reduced Y by Z%" value={form.bullets_raw} onChange={e => f('bullets_raw', e.target.value)} />
          </label>

          {/* Education */}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 pt-2">Education</p>
          <label className="block text-sm text-slate-300">Degree
            <input className="field mt-2" placeholder="B.Sc. Computer Science" value={form.degree} onChange={e => f('degree', e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-slate-300">Institution
              <input className="field mt-2" placeholder="MIT" value={form.institution} onChange={e => f('institution', e.target.value)} />
            </label>
            <label className="block text-sm text-slate-300">Period <span className="text-slate-600">opt</span>
              <input className="field mt-2" placeholder="2020–2024" value={form.edu_period} onChange={e => f('edu_period', e.target.value)} />
            </label>
          </div>

          {/* Skills & summary */}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 pt-2">Skills & summary</p>
          <label className="block text-sm text-slate-300">Skills <span className="text-slate-600">comma separated</span>
            <input className="field mt-2" placeholder="Python, FastAPI, React…" value={form.skills_raw} onChange={e => f('skills_raw', e.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">Profile summary <span className="text-slate-600">opt</span>
            <textarea className="field mt-2 h-24 resize-none" value={form.profile_statement} onChange={e => f('profile_statement', e.target.value)} />
          </label>

          <button disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : exists ? 'Update profile' : 'Save profile'}</button>
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </form>

        <div className="space-y-4">
          {saved ? (
            <div className="card space-y-3">
              <p className="text-emerald-400 font-semibold">Profile saved ✓</p>
              <button onClick={() => router.push('/scrape')} className="btn-primary w-full">Continue to Scrape →</button>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-800 p-8 text-slate-500 text-sm">
              {exists ? 'Profile loaded from database. Edit and save to update.' : 'Fill the form and save your profile to continue.'}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
