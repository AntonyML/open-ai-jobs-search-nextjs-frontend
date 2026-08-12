'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Download } from 'lucide-react'
import type { CVResponse } from '@/lib/cv'
import { cvPdfUrl, fetchCvPdfObjectUrl } from '@/lib/cv'

export function CvPdfPreview({ cv }: { cv: CVResponse }) {
  const t = useTranslations('cvBuilder')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let revokeUrl: string | null = null
    const pdfUrl = cvPdfUrl(cv.cv_id, cv.pdf_url)
    setLoading(true)
    fetchCvPdfObjectUrl(pdfUrl)
      .then((url) => {
        revokeUrl = url
        setObjectUrl(url)
      })
      .catch(() => setObjectUrl(null))
      .finally(() => setLoading(false))
    return () => {
      if (revokeUrl) URL.revokeObjectURL(revokeUrl)
    }
  }, [cv.cv_id, cv.pdf_url])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-[#1d1d1f]">
            {cv.cv_type === 'base' ? t('baseTitle') : t('ofertaTitle')}
          </p>
          <p className="text-xs text-[#707070]">
            {new Date(cv.created_at).toLocaleString()}
          </p>
        </div>
        {objectUrl && (
          <a
            href={objectUrl}
            download={`cv_${cv.cv_id}.pdf`}
            className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0068d2]"
          >
            <Download className="size-3.5" />
            {t('download')}
          </a>
        )}
      </div>

      {loading && !objectUrl && (
        <div className="flex h-80 w-full items-center justify-center rounded-xl border border-[#d2d2d7]/60 bg-white">
          <p className="text-sm text-[#707070]">{t('datosLoading')}</p>
        </div>
      )}

      {!loading && !objectUrl && (
        <div className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-[#d2d2d7]/60 bg-white text-center">
          <Download className="size-5 text-[#b0b0b0]" />
          <p className="text-sm text-[#707070]">{t('noPdf')}</p>
        </div>
      )}

      {objectUrl && (
        <iframe
          src={objectUrl}
          title={`CV ${cv.cv_id}`}
          className="h-[620px] w-full rounded-xl border border-[#d2d2d7]/60 bg-white"
        />
      )}
    </div>
  )
}