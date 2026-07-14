'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function Setup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    years_of_experience: '',
    current_role: '',
    skills_raw: '',       // comma-separated → convertido a dict antes de enviar
    education_raw: '',    // texto libre → convertido a list[dict]
    summary: '',
  })

  function f(name: string, value: string) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Transformar skills CSV → { software_tools: [...] }
      const skillsList = form.skills_raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      const skills = skillsList.length ? { software_tools: skillsList } : undefined

      // Transformar education string → [{ degree: "...", institution: "", period: "" }]
      const education = form.education_raw.trim()
        ? [{ degree: form.education_raw.trim(), institution: '', period: '' }]
        : undefined

      const payload: Record<string, any> = {
        full_name: form.full_name,
        email: form.email,
      }
      if (form.phone) payload.phone = form.phone
      if (form.location) payload.location = form.location
      if (form.years_of_experience) payload.years_of_experience = Number(form.years_of_experience)
      if (form.current_role) payload.current_role = form.current_role
      if (skills) payload.skills = skills
      if (education) payload.education = education
      if (form.summary) payload.profile_statement = form.summary

      const data = await apiFetch<any>('/api/v1/setup/profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setResult(data)
      const steps = JSON.parse(localStorage.getItem('completed_steps') || '[]')
      if (!steps.includes(1)) localStorage.setItem('completed_steps', JSON.stringify([...steps, 1]))
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <p className="eyebrow">02 / PROFILE</p>
      <h2 className="title">Build your candidate profile</h2>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="card space-y-4">
          <label className="block text-sm text-slate-300">Full name
            <input required className="field mt-2" value={form.full_name} onChange={e => f('full_name', e.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">Email
            <input required type="email" className="field mt-2" value={form.email} onChange={e => f('email', e.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">Phone <span className="text-slate-600">optional</span>
            <input className="field mt-2" value={form.phone} onChange={e => f('phone', e.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">Location <span className="text-slate-600">optional</span>
            <input className="field mt-2" value={form.location} onChange={e => f('location', e.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">Years of experience
            <input required type="number" min="0" className="field mt-2" value={form.years_of_experience} onChange={e => f('years_of_experience', e.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">Current role <span className="text-slate-600">optional</span>
            <input className="field mt-2" value={form.current_role} onChange={e => f('current_role', e.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">Skills — comma separated <span className="text-slate-600">optional</span>
            <input className="field mt-2" placeholder="Python, FastAPI, React…" value={form.skills_raw} onChange={e => f('skills_raw', e.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">Education <span className="text-slate-600">optional</span>
            <input className="field mt-2" placeholder="B.Sc. Computer Science, MIT, 2020–2024" value={form.education_raw} onChange={e => f('education_raw', e.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">Summary <span className="text-slate-600">optional</span>
            <textarea className="field mt-2 h-24 resize-none" value={form.summary} onChange={e => f('summary', e.target.value)} />
          </label>
          <button disabled={loading} className="btn-primary w-full">{loading ? 'Saving…' : 'Save profile'}</button>
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </form>

        <div className="space-y-4">
          {result ? (
            <div className="card space-y-2">
              <p className="text-emerald-400 font-semibold">Profile saved ✓</p>
              <pre className="max-h-72 overflow-auto text-xs text-slate-300">{JSON.stringify(result, null, 2)}</pre>
              <button onClick={() => router.push('/scrape')} className="btn-primary w-full">Continue to Scrape →</button>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-800 p-8 text-slate-500">
              Fill the form and save your profile to continue.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
