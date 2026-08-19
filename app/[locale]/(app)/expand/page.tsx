'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { showSuccess, showError } from '@/lib/toasts'
import { addNotification } from '@/lib/notifications'
import { playActionSound, playErrorSound } from '@/lib/sounds'
import { useBilling } from '@/hooks/useBilling'
import { PageHeader } from '@/components/ui/page-header'
import { AppleButton } from '@/components/ui/apple-button'
import { UpgradeBanner } from '@/components/ui/upgrade-banner'
import UpgradeModal from '@/components/UpgradeModal'

interface Expansion {
  id: string
  status: string
  experience_items: any[]
  enriched_competencies: any[]
  proposed_additions: any[]
  error_message?: string
  created_at: string
}

interface ExpansionSummary {
  id: string
  status: string
  items_found: number
  competencies_enriched: number
  proposed_additions: number
  created_at: string
}

// ── Skill addition card ─────────────────────────────────────────

function SkillAdditionCard({
  addition,
  accepted,
  rejected,
  onAccept,
  onReject,
  t,
}: {
  addition: any
  index?: number
  accepted: boolean
  rejected: boolean
  onAccept: () => void
  onReject: () => void
  t: (key: string) => string
}) {
  const itemName =
    typeof addition.item === 'string'
      ? addition.item
      : addition.item?.language || addition.item?.skill || 'Unknown'
  const category = (addition.category || '').replace('skills.', '').replace(/_/g, ' ')

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${
        accepted
          ? 'border-[#2997ff] bg-[#f4f8fb]'
          : rejected
            ? 'border-rose-200 bg-rose-50/50 opacity-50'
            : 'border-[#e2e2e5] hover:border-[#d2d2d7]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#1d1d1f]">{itemName}</p>
          <p className="mt-0.5 text-[11px] capitalize text-[#858585]">{category}</p>
          {addition.reason && (
            <p className="mt-1 text-[11px] leading-snug text-[#707070]">{addition.reason}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onAccept}
            className={`rounded-full p-1.5 transition-colors ${
              accepted
                ? 'bg-[#0071e3] text-white'
                : 'text-[#858585] hover:bg-[#f4f8fb] hover:text-[#2997ff]'
            }`}
            title={t('accept')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <button
            onClick={onReject}
            className={`rounded-full p-1.5 transition-colors ${
              rejected
                ? 'bg-rose-400 text-white'
                : 'text-[#858585] hover:bg-rose-50 hover:text-rose-400'
            }`}
            title={t('reject')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── History item ───────────────────────────────────────────────

function HistoryItem({ exp }: { exp: ExpansionSummary }) {
  return (
    <div className="rounded-xl border border-[#e2e2e5] bg-white p-4">
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            exp.status === 'completed'
              ? 'bg-emerald-50 text-emerald-600'
              : exp.status === 'failed'
                ? 'bg-rose-50 text-rose-500'
                : 'bg-amber-50 text-amber-600'
          }`}
        >
          {exp.status}
        </span>
        <span className="text-[11px] text-[#858585]">
          {new Date(exp.created_at).toLocaleDateString()}
        </span>
      </div>
      <div className="mt-2 flex gap-3 text-[11px] text-[#707070]">
        <span>{exp.items_found} items found</span>
        <span>·</span>
        <span>{exp.competencies_enriched} enriched</span>
        <span>·</span>
        <span>{exp.proposed_additions} additions</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════

export default function ExpandPage() {
  const t = useTranslations('expand')
  const tc = useTranslations('common')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const premium = useBilling().isPremium
  const [running, setRunning] = useState(false)
  const [pollId, setPollId] = useState<string | null>(null)
  const [current, setCurrent] = useState<Expansion | null>(null)
  const [history, setHistory] = useState<ExpansionSummary[]>([])
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState<Set<number>>(new Set())
  const [rejected, setRejected] = useState<Set<number>>(new Set())

  useEffect(() => {
    apiFetch<any>('/api/v1/expand/')
      .then((x) => setHistory(Array.isArray(x) ? x : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!pollId) return
    const interval = window.setInterval(async () => {
      try {
        const exp = await apiFetch<Expansion>(`/api/v1/expand/${pollId}`)
        if (exp.status === 'completed' || exp.status === 'failed') {
          setCurrent(exp)
          setPollId(null)
          setRunning(false)
          const h = await apiFetch<any>('/api/v1/expand/')
          setHistory(Array.isArray(h) ? h : [])
          if (exp.status === 'completed') {
            playActionSound('expand')
            showSuccess(t('complete', { count: exp.proposed_additions.length }))
          } else {
            playErrorSound()
            const errMsg = exp.error_message || t('failed')
            showError(errMsg)
          }
        }
      } catch {
        setPollId(null)
        setRunning(false)
      }
    }, 2000)
    return () => window.clearInterval(interval)
  }, [pollId])

  async function triggerExpand() {
    setRunning(true)
    setError('')
    setCurrent(null)
    setAccepted(new Set())
    setRejected(new Set())
    try {
      const exp = await apiFetch<Expansion>('/api/v1/expand/', {
        method: 'POST',
        body: JSON.stringify({
          scan_cv: true,
          scan_linkedin: true,
          scan_diplomas: true,
          scan_references: true,
          scan_github: true,
          scan_other_urls: true,
        }),
      })
      setPollId(exp.id)
    } catch (x) {
      setRunning(false)
      const msg = x instanceof Error ? x.message : tc('error')
      playErrorSound()
      showError(msg)
      setError(msg)
    }
  }

  async function acceptAddition(index: number) {
    setAccepted((prev) => new Set(prev).add(index))
    setRejected((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }

  async function rejectAddition(index: number) {
    setRejected((prev) => new Set(prev).add(index))
    setAccepted((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }

  async function applyAccepted() {
    if (!current?.proposed_additions) return
    const toApply = current.proposed_additions.filter((_, i) => accepted.has(i))
    if (toApply.length === 0) {
      showError(t('noSkillsFound'))
      return
    }
    try {
      const profile = await apiFetch<any>('/api/v1/setup/profile')
      const skills = profile.skills || {}
      const programmingMl: any[] = [...(skills.programming_ml || [])]
      const domainExpertise: string[] = [...(skills.domain_expertise || [])]
      const softwareTools: string[] = [...(skills.software_tools || [])]

      for (const addition of toApply) {
        const category = addition.category || ''
        const item = addition.item || {}
        const skillName = typeof item === 'string' ? item : item.language || item.skill || ''
        if (category.includes('programming_ml') || category === 'skills.programming_ml') {
          if (!programmingMl.some((s: any) => (s.language || s) === skillName)) {
            programmingMl.push(
              typeof item === 'string' ? { language: item, proficiency: 'Intermediate' } : item
            )
          }
        } else if (category.includes('domain_expertise') || category === 'skills.domain_expertise') {
          if (!domainExpertise.includes(skillName)) domainExpertise.push(skillName)
        } else if (category.includes('software_tools') || category === 'skills.software_tools') {
          if (!softwareTools.includes(skillName)) softwareTools.push(skillName)
        }
      }

      await apiFetch('/api/v1/setup/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          skills: { programming_ml: programmingMl, domain_expertise: domainExpertise, software_tools: softwareTools },
        }),
      })
      showSuccess(t('applySelected', { count: toApply.length }))
      setAccepted(new Set())
      setRejected(new Set())
    } catch (x) {
      showError(x instanceof Error ? x.message : tc('error'))
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <PageHeader eyebrow="EXTRAS" title={t('title')} subtitle={t('subtitle')} />

      {!premium && (
        <UpgradeBanner
          message={t('freeLimitation') || 'Premium feature — expand your skills. Upgrade to unlock.'}
          upgradeLabel={t('upgrade') || 'Upgrade'}
          onUpgrade={() => setShowUpgrade(true)}
        />
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_1fr]">
        {/* Left: trigger + results */}
        <div className="space-y-4">
          {/* Trigger */}
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6">
            <AppleButton
              disabled={running}
              loading={running}
              className="w-full"
              onClick={triggerExpand}
            >
              {running ? t('expanding') : t('expandButton')}
            </AppleButton>

            {running && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#0066cc]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#0071e3]" />
                {t('expandingHint')}
              </div>
            )}

            {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
          </div>

          {/* Results */}
          {current?.status === 'completed' && current.proposed_additions.length > 0 && (
            <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1d1d1f]">
                  {t('discoveredSkills', { count: current.proposed_additions.length })}
                </h3>
                <AppleButton
                  variant="secondary"
                  disabled={accepted.size === 0}
                  onClick={applyAccepted}
                >
                  {t('applySelected', { count: accepted.size })}
                </AppleButton>
              </div>

              <div className="max-h-96 space-y-2 overflow-y-auto">
                {current.proposed_additions.map((addition, i) => (
                  <SkillAdditionCard
                    key={i}
                    addition={addition}
                    index={i}
                    accepted={accepted.has(i)}
                    rejected={rejected.has(i)}
                    onAccept={() => acceptAddition(i)}
                    onReject={() => rejectAddition(i)}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {current?.status === 'completed' && current.proposed_additions.length === 0 && (
            <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6 text-center">
              <p className="text-sm text-[#707070]">{t('noSkillsFound')}</p>
            </div>
          )}

          {current?.status === 'failed' && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
              {current.error_message || t('failed')}
            </div>
          )}
        </div>

        {/* Right: history */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#858585]">
            {t('history')}
          </h3>
          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d2d2d7] p-8 text-center text-sm text-[#858585]">
              {t('noHistory')}
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((exp) => (
                <HistoryItem key={exp.id} exp={exp} />
              ))}
            </div>
          )}
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  )
}
