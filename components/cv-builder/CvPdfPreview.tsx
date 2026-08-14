'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Download, Expand, X } from 'lucide-react'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import type { CVResponse } from '@/lib/cv'
import { cvPdfUrl, fetchCvPdfObjectUrl } from '@/lib/cv'

/**
 * PDF preview with optional full-screen viewer.
 *
 * When `expandable` is true (default), a "View PDF" button opens the document
 * at full size in a modal. It reuses the already-fetched object URL, so no
 * extra request is made. The modal is built with Base UI Dialog, which
 * handles ESC-to-close, backdrop click, focus trap and body scroll lock.
 */
export function CvPdfPreview({ cv, expandable = true }: { cv: CVResponse; expandable?: boolean }) {
  const t = useTranslations('cvBuilder')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

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

  const docLabel = cv.cv_type === 'base' ? t('baseTitle') : t('ofertaTitle')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-[#1d1d1f]">
            {docLabel}
          </p>
          <p className="text-xs text-[#707070]">
            {new Date(cv.created_at).toLocaleString()}
          </p>
        </div>
        {objectUrl && (
          <div className="flex shrink-0 items-center gap-2">
            {expandable && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#0066cc] px-4 py-2 text-xs font-medium text-[#0066cc] transition-colors hover:bg-[#f4f8fb]"
              >
                <Expand className="size-3.5" />
                {t('viewFull')}
              </button>
            )}
            <a
              href={objectUrl}
              download={`cv_${cv.cv_id}.pdf`}
              className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0068d2]"
            >
              <Download className="size-3.5" />
              {t('download')}
            </a>
          </div>
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

      {/* ── Full-screen PDF viewer ──────────────────────────── */}
      {expandable && objectUrl && (
        <BaseDialog.Root open={previewOpen} onOpenChange={(open) => setPreviewOpen(open)}>
          <BaseDialog.Portal>
            <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0" />
            <BaseDialog.Popup className="fixed inset-x-3 inset-y-3 z-50 flex flex-col overflow-hidden rounded-xl bg-white shadow-2xl transition duration-200 ease-in-out data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0 sm:inset-x-10 sm:inset-y-10">
              <div className="flex items-center justify-between gap-3 border-b border-[#d2d2d7] px-4 py-3">
                <BaseDialog.Title className="truncate text-sm font-semibold text-[#1d1d1f]">
                  {docLabel}
                </BaseDialog.Title>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={objectUrl}
                    download={`cv_${cv.cv_id}.pdf`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0068d2]"
                  >
                    <Download className="size-3.5" />
                    {t('download')}
                  </a>
                  <BaseDialog.Close
                    aria-label={t('viewFullClose')}
                    className="flex size-8 items-center justify-center rounded-full text-[#707070] transition-colors hover:bg-[#f5f5f7]"
                  >
                    <X className="size-4" />
                  </BaseDialog.Close>
                </div>
              </div>
              <iframe
                src={objectUrl}
                title={`CV ${cv.cv_id}`}
                className="min-h-0 w-full flex-1 bg-white"
              />
            </BaseDialog.Popup>
          </BaseDialog.Portal>
        </BaseDialog.Root>
      )}
    </div>
  )
}
