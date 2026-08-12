'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { SceneDynamic } from '@/components/three/SceneDynamic'
import { JourneyScene } from '@/components/three/JourneyScene'

const STEPS = [
  { titleKey: 'howStep01Title', descKey: 'howStep01Desc' },
  { titleKey: 'howStep02Title', descKey: 'howStep02Desc' },
  { titleKey: 'howStep03Title', descKey: 'howStep03Desc' },
  { titleKey: 'howStep04Title', descKey: 'howStep04Desc' },
]

/**
 * "From profile to offer in four steps" — the 3D JourneyScene advances as the
 * user scrolls through the section (scroll progress 0..1).
 */
export default function HowItWorksSection() {
  const t = useTranslations('marketing')
  const sectionRef = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const el = sectionRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height + window.innerHeight
      const p = (window.innerHeight - rect.top) / total
      setProgress(Math.min(1, Math.max(0, p)))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="border-t border-[#d2d2d7] bg-[#f5f5f7]"
    >
      <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">
            {t('howItWorksLabel')}
          </p>
          <h2 className="text-[36px] font-semibold leading-[1.07] tracking-tight text-[#1d1d1f] md:text-[48px]">
            {t('howItWorksHeading')}
          </h2>
          <p className="mt-4 text-[17px] font-light text-[#707070]">{t('howItWorksSubheading')}</p>
        </div>

        {/* 3D journey (scroll-driven) */}
        <div className="mx-auto mb-16 max-w-2xl">
          <SceneDynamic className="aspect-[16/9] w-full" activeFrameloop="always">
            <JourneyScene progress={progress} />
          </SceneDynamic>
        </div>

        {/* Steps */}
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <div
              key={s.titleKey}
              className="rounded-xl border border-[#d2d2d7] bg-white p-5 transition-all duration-300 hover:border-[#0071e3]/30 hover:shadow-sm"
            >
              <p className="text-[11px] font-bold text-[#0071e3]">0{i + 1}</p>
              <h3 className="mt-2 text-[16px] font-semibold text-[#1d1d1f]">{t(s.titleKey)}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#707070]">{t(s.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
