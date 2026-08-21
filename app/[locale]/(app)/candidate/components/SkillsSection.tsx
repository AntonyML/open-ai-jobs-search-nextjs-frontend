'use client'

import { useTranslations } from 'next-intl'
import { TagInput } from '@/components/ui/TagInput'
import { Sparkles, Wrench, Briefcase, Award } from 'lucide-react'

export interface CategorizedSkills {
  languages: string[]
  frameworks: string[]
  databases: string[]
  architecture: string[]
  tools_db: string[]
  methodologies: string[]
}

interface SkillsForm {
  skills_categorized?: CategorizedSkills
  skills_raw: string
  profile_statement: string
}

interface Props {
  form: SkillsForm
  onFieldChange: (name: string, value: any) => void
}

const UNIVERSAL_CATEGORIES: {
  key: keyof CategorizedSkills
  labelKey: string
  descKey: string
  icon: typeof Award
  color: 'blue' | 'violet' | 'amber'
  placeholder: string
  suggestions: string[]
}[] = [
  {
    key: 'languages',
    labelKey: 'skillsTechnicalTitle',
    descKey: 'skillsTechnicalDesc',
    icon: Award,
    color: 'blue',
    placeholder: 'ej. Cocina italiana, Diagnóstico clínico, C#, Ventas consultivas...',
    suggestions: [
      'Cocina y gastronomía',
      'Atención al paciente',
      'C# / .NET',
      'TypeScript / React',
      'Contabilidad financiera',
      'Python',
      'Diagnóstico mecánico',
      'Diseño UX/UI',
      'Enseñanza y pedagogía',
    ],
  },
  {
    key: 'tools_db',
    labelKey: 'skillsToolsTitle',
    descKey: 'skillsToolsDesc',
    icon: Wrench,
    color: 'amber',
    placeholder: 'ej. Excel, SAP, Figma, Docker, Terminal POS, Git, Maquinaria...',
    suggestions: [
      'Excel avanzado',
      'SAP / ERP',
      'Figma',
      'Git / GitHub',
      'Docker',
      'PostgreSQL / SQL',
      'Sistema POS / Caja',
      'Photoshop',
      'Google Workspace',
    ],
  },
  {
    key: 'methodologies',
    labelKey: 'skillsProfessionalTitle',
    descKey: 'skillsProfessionalDesc',
    icon: Briefcase,
    color: 'violet',
    placeholder: 'ej. Atención al cliente, Liderazgo, Manipulación de alimentos, Scrum...',
    suggestions: [
      'Atención al cliente',
      'Manipulación de alimentos',
      'Liderazgo de equipos',
      'Control de inventario',
      'Scrum / Metodologías Ágiles',
      'Resolución de conflictos',
      'Gestión de compras',
      'Primeros auxilios',
    ],
  },
]

export function SkillsSection({ form, onFieldChange }: Props) {
  const t = useTranslations('setup')
  const tc = useTranslations('common')

  const cat: CategorizedSkills = {
    languages: form.skills_categorized?.languages || [],
    frameworks: form.skills_categorized?.frameworks || [],
    databases: form.skills_categorized?.databases || [],
    architecture: form.skills_categorized?.architecture || [],
    tools_db: form.skills_categorized?.tools_db || (form.skills_raw ? form.skills_raw.split(',').map((s) => s.trim()).filter(Boolean) : []),
    methodologies: form.skills_categorized?.methodologies || [],
  }

  function handleCatChange(key: keyof CategorizedSkills, tags: string[]) {
    const updated = { ...cat, [key]: tags }
    onFieldChange('skills_categorized', updated)
    const all = [
      ...updated.languages,
      ...updated.frameworks,
      ...updated.databases,
      ...updated.architecture,
      ...updated.tools_db,
      ...updated.methodologies,
    ]
    onFieldChange('skills_raw', all.join(', '))
  }

  function addSuggestion(key: keyof CategorizedSkills, item: string) {
    if (!cat[key].includes(item)) {
      handleCatChange(key, [...cat[key], item])
    }
  }

  return (
    <div id="section-skills" className="card space-y-5">
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#1d1d1f]">{t('skillsAndSummary')}</h2>
          <p className="mt-0.5 text-[11px] text-[#5f6368] leading-relaxed">
            {t('skillsUniversalDesc')}
          </p>
        </div>
      </div>

      {/* 3 Universal Categories */}
      <div className="space-y-4">
        {UNIVERSAL_CATEGORIES.map((catConfig) => {
          const key = catConfig.key
          const currentValues = cat[key]
          const Icon = catConfig.icon

          return (
            <div key={key} className="rounded-[12px] border border-[#d2d2d7] bg-[#fbfbfd] p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#1d1d1f] shadow-2xs">
                    <Icon className="h-3.5 w-3.5 text-[#0071e3]" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1d1d1f]">
                      {t(catConfig.labelKey)}
                    </span>
                    <p className="text-[10px] text-[#5f6368]">{t(catConfig.descKey)}</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[#5f6368] bg-white px-2 py-0.5 rounded-full border border-[#e5e5ea]">
                  {currentValues.length} {tc('added') || 'agregada(s)'}
                </span>
              </div>

              <TagInput
                tags={currentValues}
                onChange={(tags) => handleCatChange(key, tags)}
                placeholder={catConfig.placeholder}
                color={catConfig.color}
                ariaLabel={t(catConfig.labelKey)}
              />

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap items-center gap-1 pt-1" role="group" aria-label={t('quickSuggestions')}>
                <span className="text-[10px] text-[#5f6368] mr-1">{t('quickSuggestions')}:</span>
                {catConfig.suggestions.map((item) => {
                  const isSelected = currentValues.includes(item)
                  if (isSelected) return null
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => addSuggestion(key, item)}
                      className="rounded-md border border-[#d2d2d7] bg-white px-2 py-0.5 text-[10px] text-[#1d1d1f] transition-colors hover:border-[#0066cc] hover:bg-[#f4f8fb] hover:text-[#0066cc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
                      aria-label={`Agregar habilidad ${item}`}
                    >
                      + {item}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Profile Statement */}
      <div className="pt-2">
        <label htmlFor="skills-profile-statement" className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
          {t('profileStatement')} <span className="text-[#5f6368] font-normal">({tc('optional')} — {t('twoThreeSentences')})</span>
        </label>
        <textarea
          id="skills-profile-statement"
          name="profile_statement"
          aria-describedby="skills-summary-hint"
          className="field h-24 resize-none"
          placeholder={t('profileStatementUniversalPlaceholder')}
          value={form.profile_statement}
          onChange={(e) => onFieldChange('profile_statement', e.target.value)}
        />
        <p id="skills-summary-hint" className="mt-1.5 flex items-center gap-2 text-[11px] text-[#5f6368]">
          <Sparkles className="h-3.5 w-3.5 text-[#0071e3] shrink-0" aria-hidden="true" />
          <span>{t('summaryUniversalHint')}</span>
        </p>
      </div>
    </div>
  )
}
