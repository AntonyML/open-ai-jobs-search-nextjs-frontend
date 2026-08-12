'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { isLoggedIn, isAdmin } from '@/lib/auth'
import { showSuccess, showError } from '@/lib/toasts'
import {
  CreditCard, Plus, Trash2, Save, RefreshCw, X, Coins, DollarSign,
  CalendarDays, Layers, ShieldCheck, Pencil,
} from 'lucide-react'
import {
  adminListPlans,
  adminUpsertPlan,
  adminDeletePlan,
  adminGetCreditCosts,
  adminSetCreditCosts,
} from '@/lib/billing'
import type { PlanAdmin } from '@/types/billing'
import styles from './PlansAdmin.module.css'

const EMPTY_PLAN: PlanAdmin = {
  id: '',
  key: '',
  name: '',
  description: null,
  price_monthly_usd: 0,
  price_yearly_usd: 0,
  credits_per_period: 0,
  refill_cadence: 'period',
  refill_weekday: 0,
  daily_quota: 0,
  weekly_quota: 0,
  features: [],
  is_active: true,
  sort_order: 10,
}

const FEATURE_OPTIONS = ['cv_base', 'cv_adapted', 'pipeline', 'expand', 'upskill']

export default function AdminPlansPage() {
  const t = useTranslations('adminPlans')
  const router = useRouter()
  const [plans, setPlans] = useState<PlanAdmin[]>([])
  const [costs, setCosts] = useState({ cv_base: 1, cv_adapted: 1, pipeline: 1 })
  const [loading, setLoading] = useState(true)
  const [savingCosts, setSavingCosts] = useState(false)
  const [editing, setEditing] = useState<PlanAdmin | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    if (!isAdmin()) { router.replace('/dashboard'); return }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([adminListPlans(), adminGetCreditCosts()])
      setPlans(p)
      setCosts(c)
    } catch (x) {
      showError(x instanceof Error ? x.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  async function saveCosts() {
    setSavingCosts(true)
    try {
      const next = await adminSetCreditCosts(costs)
      setCosts(next)
      showSuccess(t('costsSaved'))
    } catch (x) {
      showError(x instanceof Error ? x.message : t('saveError'))
    } finally {
      setSavingCosts(false)
    }
  }

  async function savePlan() {
    if (!editing || editing === 'new') return
    setSaving(true)
    try {
      await adminUpsertPlan(editing.key, editing as Partial<PlanAdmin>)
      showSuccess(t('planSaved'))
      setEditing(null)
      await load()
    } catch (x) {
      showError(x instanceof Error ? x.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function removePlan(key: string) {
    setConfirmDelete(null)
    try {
      await adminDeletePlan(key)
      showSuccess(t('planDeleted'))
      await load()
    } catch (x) {
      showError(x instanceof Error ? x.message : t('deleteError'))
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`flex items-center gap-2 text-xl font-bold text-[#1d1d1f] sm:text-2xl ${styles.gradientText}`}>
            <CreditCard className="h-6 w-6 text-[#0071e3]" />
            {t('title')}
          </h1>
          <p className="mt-0.5 text-sm text-[#707070]">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0071e3] to-[#0060c0] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-[.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('newPlan')}
          </button>
          <button
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-[#858585]" />
        </div>
      ) : (
        <>
          {/* ── Credit costs calibration ── */}
          <section className={`${styles.glassCard} rounded-2xl p-5`}>
            <div className="mb-4 flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              <h2 className="text-sm font-bold text-[#1d1d1f]">{t('costsTitle')}</h2>
            </div>
            <p className="mb-4 text-xs text-[#707070]">{t('costsDesc')}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(['cv_base', 'cv_adapted', 'pipeline'] as const).map((k) => (
                <label key={k} className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">
                    {t(`cost.${k}`)}
                  </span>
                  <div className="relative">
                    <Coins className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#858585]" />
                    <input
                      type="number"
                      min={0}
                      value={costs[k]}
                      onChange={(e) => setCosts({ ...costs, [k]: Math.max(0, parseInt(e.target.value || '0', 10)) })}
                      className="w-full rounded-xl border border-[#d2d2d7] bg-white py-2 pl-9 pr-3 text-sm font-medium text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                    />
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={saveCosts}
                disabled={savingCosts}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50 active:scale-[.98]"
              >
                <Save className="h-3.5 w-3.5" />
                {t('saveCosts')}
              </button>
            </div>
          </section>

          {/* ── Plans grid ── */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <div key={p.key} className={`${styles.planCard} group relative rounded-2xl border p-5 transition-all`}>
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f8fb]">
                      <DollarSign className="h-4 w-4 text-[#0071e3]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1d1d1f]">{p.name}</h3>
                      <code className="text-[10px] text-[#858585]">{p.key}</code>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setEditing(p)}
                      className="rounded-lg p-1.5 text-[#707070] transition-all hover:bg-[#f4f8fb] hover:text-[#0071e3]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {p.key !== 'free' && (
                      <button
                        onClick={() => setConfirmDelete(p.key)}
                        className="rounded-lg p-1.5 text-[#858585] transition-all hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-[#1d1d1f]">${p.price_monthly_usd.toFixed(2)}</span>
                  <span className="text-[10px] text-[#707070]">/mo · ${p.price_yearly_usd.toFixed(2)}/yr</span>
                </div>

                <div className="mb-3 space-y-1.5 text-[11px] text-[#707070]">
                  <p className="flex items-center gap-1.5">
                    <Coins className="h-3 w-3 text-amber-500" />
                    {t('creditsPerPeriod')}: <b className="text-[#1d1d1f]">{p.credits_per_period}</b> ({p.refill_cadence})
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3 text-[#0071e3]" />
                    {t('dailyQuota')}: <b className="text-[#1d1d1f]">{p.daily_quota || '∞'}</b> · {t('weeklyQuota')}: <b className="text-[#1d1d1f]">{p.weekly_quota || '∞'}</b>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Layers className="h-3 w-3 text-purple-500" />
                    {(p.features ?? []).join(' · ') || '—'}
                  </p>
                </div>

                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-[#f5f5f7] text-[#858585]'
                }`}>
                  <ShieldCheck className="h-3 w-3" />
                  {p.is_active ? t('active') : t('inactive')}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Edit / create modal ── */}
      {editing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative z-10 max-h-[calc(100vh-4rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1d1d1f]">
                {editing === 'new' ? t('newPlan') : `${t('editPlan')}: ${editing.name}`}
              </h3>
              <button onClick={() => setEditing(null)} className="rounded-full p-1.5 text-[#858585] hover:bg-[#f5f5f7]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <PlanForm value={editing} onChange={setEditing} t={t} />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7]"
              >
                {t('cancel')}
              </button>
              <button
                onClick={savePlan}
                disabled={saving || editing === 'new' || !editing.key || !editing.name}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0071e3] to-[#0060c0] px-5 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {t('savePlan')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]">
            <h3 className="mb-2 text-sm font-bold text-[#1d1d1f]">{t('deleteConfirm')}</h3>
            <p className="mb-4 text-xs text-[#707070]">{t('deleteConfirmDesc')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-full border border-[#d2d2d7] px-4 py-2 text-xs font-medium text-[#474747] transition-all hover:bg-[#f5f5f7]"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => removePlan(confirmDelete)}
                className="flex-1 rounded-full bg-rose-500 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-rose-600"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlanForm({
  value,
  onChange,
  t,
}: {
  value: PlanAdmin | 'new'
  onChange: (v: PlanAdmin | 'new') => void
  t: (key: string) => string
}) {
  const v: PlanAdmin = value === 'new' ? { ...EMPTY_PLAN } : value
  const set = (patch: Partial<PlanAdmin>) => onChange({ ...v, ...patch })

  const inputCls = 'w-full rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-sm text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20'
  const labelCls = 'mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#707070]'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{t('key')}</label>
          <input className={inputCls} value={v.key} onChange={(e) => set({ key: e.target.value })} placeholder="pro" disabled={value !== 'new'} />
        </div>
        <div>
          <label className={labelCls}>{t('name')}</label>
          <input className={inputCls} value={v.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
      </div>
      <div>
        <label className={labelCls}>{t('description')}</label>
        <input className={inputCls} value={v.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>$/mo</label>
          <input className={inputCls} type="number" min={0} step={0.01} value={v.price_monthly_usd} onChange={(e) => set({ price_monthly_usd: parseFloat(e.target.value || '0') })} />
        </div>
        <div>
          <label className={labelCls}>$/yr</label>
          <input className={inputCls} type="number" min={0} step={0.01} value={v.price_yearly_usd} onChange={(e) => set({ price_yearly_usd: parseFloat(e.target.value || '0') })} />
        </div>
        <div>
          <label className={labelCls}>{t('credits')}</label>
          <input className={inputCls} type="number" min={0} value={v.credits_per_period} onChange={(e) => set({ credits_per_period: parseInt(e.target.value || '0', 10) })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>{t('refillCadence')}</label>
          <select className={inputCls} value={v.refill_cadence} onChange={(e) => set({ refill_cadence: e.target.value as 'weekly' | 'period' })}>
            <option value="period">{t('cadencePeriod')}</option>
            <option value="weekly">{t('cadenceWeekly')}</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>{t('dailyQuota')}</label>
          <input className={inputCls} type="number" min={0} value={v.daily_quota} onChange={(e) => set({ daily_quota: parseInt(e.target.value || '0', 10) })} />
        </div>
        <div>
          <label className={labelCls}>{t('weeklyQuota')}</label>
          <input className={inputCls} type="number" min={0} value={v.weekly_quota} onChange={(e) => set({ weekly_quota: parseInt(e.target.value || '0', 10) })} />
        </div>
      </div>
      <div>
        <label className={labelCls}>{t('features')}</label>
        <div className="flex flex-wrap gap-1.5">
          {FEATURE_OPTIONS.map((f) => {
            const on = (v.features ?? []).includes(f)
            return (
              <button
                key={f}
                type="button"
                onClick={() => set({ features: on ? (v.features ?? []).filter((x) => x !== f) : [...(v.features ?? []), f] })}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  on ? 'bg-[#0071e3] text-white' : 'bg-[#f5f5f7] text-[#707070] hover:bg-[#e9e9ec]'
                }`}
              >
                {f}
              </button>
            )
          })}
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-[#474747]">
        <input type="checkbox" checked={v.is_active} onChange={(e) => set({ is_active: e.target.checked })} className="h-4 w-4 rounded accent-[#0071e3]" />
        {t('active')}
      </label>
    </div>
  )
}
