'use client'

import { AppleButton } from '@/components/ui/apple-button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Application } from '@/types/pipeline'

interface OutcomeForm {
  application_id: string
  status: string
  date_resolved: string
  phone_screen_date: string
  technical_date: string
  case_date: string
  final_round_date: string
  offer_received_date: string
  notes: string
  lessons_learned: string
  valued_signals: string
}

interface OutcomeModalProps {
  open: boolean
  saving: boolean
  atLimit: boolean
  limitTooltip: string
  form: OutcomeForm
  applications: Application[]
  onFormChange: (form: OutcomeForm) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  tc: (key: string) => string
  t: (key: string, opts?: any) => string
}

export function OutcomeModal({ open, saving, atLimit, limitTooltip, form, applications, onFormChange, onSubmit, onClose, tc, t }: OutcomeModalProps) {
  if (!open) return null

  function update(field: keyof OutcomeForm, value: string) {
    onFormChange({ ...form, [field]: value })
  }

  const dateFields: { key: keyof OutcomeForm; label: string }[] = [
    { key: 'phone_screen_date', label: 'Phone screen' },
    { key: 'technical_date', label: 'Technical' },
    { key: 'case_date', label: 'Case' },
    { key: 'final_round_date', label: 'Final round' },
    { key: 'offer_received_date', label: 'Offer received' },
    { key: 'date_resolved', label: 'Date resolved' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="mx-4 w-full max-w-lg card shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#1d1d1f]">Record outcome</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-[#858585] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <label className="block">
            <span className="text-[12px] font-medium text-[#1d1d1f]">Application</span>
            <select required value={form.application_id} onChange={e => update('application_id', e.target.value)} className="field mt-1">
              <option value="">Select application…</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>
                  {(app as any).job_posting?.company || 'Unknown'} — {(app as any).job_posting?.title || 'Unknown role'}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[12px] font-medium text-[#1d1d1f]">Status</span>
            <select required value={form.status} onChange={e => update('status', e.target.value)} className="field mt-1">
              <optgroup label="Progress updates">
                <option value="interview_invited">Interview invited</option>
                <option value="phone_screen_completed">Phone screen completed</option>
                <option value="technical_completed">Technical completed</option>
                <option value="case_completed">Case completed</option>
                <option value="final_round_completed">Final round completed</option>
                <option value="offer_received">Offer received</option>
              </optgroup>
              <optgroup label="Resolutions">
                <option value="hired">Hired</option>
                <option value="offer_declined">Offer declined</option>
                <option value="rejected">Rejected</option>
                <option value="no_response">No response</option>
                <option value="interview_only">Interview only</option>
                <option value="withdrawn">Withdrawn</option>
              </optgroup>
            </select>
          </label>

          {/* Dates */}
          <details className="group">
            <summary className="cursor-pointer text-[12px] font-medium text-[#0066cc] hover:text-[#0071e3] transition-colors">
              Interview dates
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {dateFields.map(field => (
                <label key={field.key} className="block">
                  <span className="text-[10px] text-[#858585]">{field.label}</span>
                  <input type="date" value={(form[field.key] as string) || ''} onChange={e => update(field.key, e.target.value)} className="field mt-0.5 text-[12px]" />
                </label>
              ))}
            </div>
          </details>

          <label className="block">
            <span className="text-[12px] font-medium text-[#1d1d1f]">Notes</span>
            <textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="field mt-1 h-20 resize-none" placeholder="Feedback, what to improve, what worked…" />
          </label>

          <label className="block">
            <span className="text-[12px] font-medium text-[#1d1d1f]">Lessons learned</span>
            <textarea value={form.lessons_learned} onChange={e => update('lessons_learned', e.target.value)} className="field mt-1 h-16 resize-none" placeholder="What would you do differently?" />
          </label>

          <label className="block">
            <span className="text-[12px] font-medium text-[#1d1d1f]">Valued signals</span>
            <input type="text" value={form.valued_signals} onChange={e => update('valued_signals', e.target.value)} className="field mt-1" placeholder="Comma-separated: Tailored CV, STAR answers, Company research" />
            <p className="mt-0.5 text-[10px] text-[#858585]">What did the company seem to value most?</p>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 !px-4 !py-2.5 text-[12px]">
              {tc('cancel')}
            </button>
            <Tooltip>
              <TooltipTrigger>
                <span tabIndex={0} className="flex-1">
                  <AppleButton type="submit" disabled={saving || atLimit} loading={saving} className="w-full text-[12px] !px-4 !py-2.5">
                    {saving ? 'Saving…' : 'Save outcome'}
                  </AppleButton>
                </span>
              </TooltipTrigger>
              {atLimit && (
                <TooltipContent side="top" align="center">{limitTooltip}</TooltipContent>
              )}
            </Tooltip>
          </div>
        </form>
      </div>
    </div>
  )
}
