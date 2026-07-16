'use client'

import type { Application } from '@/types/pipeline'
import { AppleButton } from '@/components/ui/apple-button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PrepFormData {
  application_id: string
  stage: string
  interview_date: string
  interview_format: string
  interviewer_names: string
}

interface PrepFormProps {
  form: PrepFormData
  applications: Application[]
  generating: boolean
  atLimit: boolean
  limitTooltip: string
  onChange: (field: keyof PrepFormData, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  t: (key: string, opts?: any) => string
}

export function PrepForm({ form, applications, generating, atLimit, limitTooltip, onChange, onSubmit, t }: PrepFormProps) {
  function getAppLabel(appId: string) {
    const app = applications.find(a => a.id === appId)
    return app ? appId.slice(0, 12) + '...' : appId.slice(0, 12) + '...'
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">{t('generatePrep')}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-[12px] font-medium text-[#1d1d1f]">Application</span>
          <select
            required
            value={form.application_id}
            onChange={e => onChange('application_id', e.target.value)}
            className="field mt-1"
          >
            <option value="">Select application…</option>
            {applications.map(app => (
              <option key={app.id} value={app.id}>{getAppLabel(app.id)}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[12px] font-medium text-[#1d1d1f]">Stage</span>
            <select
              value={form.stage}
              onChange={e => onChange('stage', e.target.value)}
              className="field mt-1"
            >
              <option value="phone_screen">Phone Screen</option>
              <option value="technical">Technical</option>
              <option value="case">Case Study</option>
              <option value="final_round">Final Round</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-[#1d1d1f]">Format</span>
            <select
              value={form.interview_format}
              onChange={e => onChange('interview_format', e.target.value)}
              className="field mt-1"
            >
              <option value="">Any</option>
              <option value="phone">Phone</option>
              <option value="video">Video</option>
              <option value="onsite">Onsite</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[12px] font-medium text-[#1d1d1f]">Date</span>
            <input
              type="date"
              value={form.interview_date}
              onChange={e => onChange('interview_date', e.target.value)}
              className="field mt-1"
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-[#1d1d1f]">Interviewers</span>
            <input
              type="text"
              value={form.interviewer_names}
              onChange={e => onChange('interviewer_names', e.target.value)}
              className="field mt-1"
              placeholder="Comma-separated names"
            />
          </label>
        </div>

        <Tooltip>
          <TooltipTrigger>
            <span tabIndex={0}>
              <AppleButton
                type="submit"
                disabled={generating || atLimit}
                loading={generating}
                className="w-full"
              >
                {generating ? t('generating') : t('generatePrep')}
              </AppleButton>
            </span>
          </TooltipTrigger>
          {atLimit && (
            <TooltipContent side="top" align="center">
              {limitTooltip}
            </TooltipContent>
          )}
        </Tooltip>
      </form>
    </div>
  )
}
