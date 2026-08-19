'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface TermsModalProps {
  onAccept: () => void
  onDecline: () => void
}

function TermsContent() {
  const [termsMd, setTermsMd] = useState('')
  const [privacyMd, setPrivacyMd] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/legal/terms.md').then(r => r.text()),
      fetch('/legal/privacy.md').then(r => r.text()),
    ]).then(([terms, privacy]) => {
      setTermsMd(terms)
      setPrivacyMd(privacy)
      setLoaded(true)
    })
  }, [])

  if (!loaded) {
    return (
      <div className="legal-modal-content">
        <div className="legal-section">
          <p className="text-[13px] text-[#858585]">Cargando documentos legales...</p>
        </div>
      </div>
    )
  }

  const mdComponents = {
    h1: ({ children, ...rest }: React.ComponentPropsWithoutRef<'h3'>) => (
      <h3 className="text-[16px] font-bold text-[#1d1d1f] mb-4 mt-0" {...rest}>{children}</h3>
    ),
    h2: ({ children, ...rest }: React.ComponentPropsWithoutRef<'h3'>) => (
      <h3 className="text-[14px] font-bold text-[#1d1d1f] mb-2 mt-4" {...rest}>{children}</h3>
    ),
    h3: ({ children, ...rest }: React.ComponentPropsWithoutRef<'h4'>) => (
      <h4 className="text-[13px] font-bold text-[#1d1d1f] mb-1 mt-3" {...rest}>{children}</h4>
    ),
    h4: ({ children, ...rest }: React.ComponentPropsWithoutRef<'h5'>) => (
      <h5 className="text-[12px] font-bold text-[#1d1d1f] mb-1 mt-2" {...rest}>{children}</h5>
    ),
    p: ({ children, ...rest }: React.ComponentPropsWithoutRef<'p'>) => (
      <p className="text-[13px] text-[#474747] leading-relaxed mb-3" {...rest}>{children}</p>
    ),
    ul: ({ children, ...rest }: React.ComponentPropsWithoutRef<'ul'>) => (
      <ul className="list-disc ml-5 mb-3 space-y-1" {...rest}>{children}</ul>
    ),
    ol: ({ children, ...rest }: React.ComponentPropsWithoutRef<'ol'>) => (
      <ol className="list-decimal ml-5 mb-3 space-y-1" {...rest}>{children}</ol>
    ),
    li: ({ children, ...rest }: React.ComponentPropsWithoutRef<'li'>) => (
      <li className="text-[13px] text-[#474747] leading-relaxed" {...rest}>{children}</li>
    ),
    strong: ({ children, ...rest }: React.ComponentPropsWithoutRef<'strong'>) => (
      <strong className="font-semibold text-[#1d1d1f]" {...rest}>{children}</strong>
    ),
    em: ({ children, ...rest }: React.ComponentPropsWithoutRef<'em'>) => (
      <em className="italic text-[#707070]" {...rest}>{children}</em>
    ),
    hr: (props: React.ComponentPropsWithoutRef<'hr'>) => (
      <hr className="my-5 border-t border-[#e2e2e5]" {...props} />
    ),
    table: ({ children, ...rest }: React.ComponentPropsWithoutRef<'table'>) => (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full text-[13px] border-collapse" {...rest}>{children}</table>
      </div>
    ),
    thead: ({ children, ...rest }: React.ComponentPropsWithoutRef<'thead'>) => (
      <thead className="bg-[#f5f5f7]" {...rest}>{children}</thead>
    ),
    th: ({ children, ...rest }: React.ComponentPropsWithoutRef<'th'>) => (
      <th className="border border-[#e2e2e5] px-3 py-2 text-left font-semibold text-[#1d1d1f] text-[12px]" {...rest}>{children}</th>
    ),
    td: ({ children, ...rest }: React.ComponentPropsWithoutRef<'td'>) => (
      <td className="border border-[#e2e2e5] px-3 py-2 text-[#474747]" {...rest}>{children}</td>
    ),
    code: ({ children, ...rest }: React.ComponentPropsWithoutRef<'code'>) => (
      <code className="bg-[#f5f5f7] px-1.5 py-0.5 rounded text-[12px] font-mono text-[#c85000]" {...rest}>{children}</code>
    ),
    a: ({ href, children, ...rest }: React.ComponentPropsWithoutRef<'a'>) => (
      <a href={href} className="text-[#0066cc] hover:underline" target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>
    ),
  }

  const fullContent = `${termsMd}\n\n---\n\n${privacyMd}`

  return (
    <div className="legal-modal-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {fullContent}
      </ReactMarkdown>
    </div>
  )
}

export default function TermsModal({ onAccept, onDecline }: TermsModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)
  const [hasScrolledAtAll, setHasScrolledAtAll] = useState(false)
  const [nudge, setNudge] = useState(false)

  // ── Inertia scroll effect ─────────────────────────────────────────────────
  const velocityRef = useRef(0)
  const animRef = useRef<number | null>(null)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const isDragging = useRef(false)

  const applyInertiaRef = useRef<() => void>(() => {})
  useEffect(() => {
    applyInertiaRef.current = () => {
      const el = scrollRef.current
      if (!el) return
      if (Math.abs(velocityRef.current) < 0.5) {
        animRef.current = null
        return
      }
      el.scrollTop += velocityRef.current
      velocityRef.current *= 0.93
      animRef.current = requestAnimationFrame(applyInertiaRef.current)
    }
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const el = scrollRef.current
    if (!el) return
    const speed = Math.abs(e.deltaY)
    const multiplier = speed > 100 ? 2.5 : speed > 50 ? 1.6 : 1
    el.scrollTop += e.deltaY * multiplier
    velocityRef.current = e.deltaY * 0.3
    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(applyInertiaRef.current)
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    isDragging.current = true
    lastY.current = e.touches[0].clientY
    lastTime.current = Date.now()
    velocityRef.current = 0
    if (animRef.current) cancelAnimationFrame(animRef.current)
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current) return
    const el = scrollRef.current
    if (!el) return
    const now = Date.now()
    const dy = lastY.current - e.touches[0].clientY
    const dt = Math.max(now - lastTime.current, 1)
    velocityRef.current = (dy / dt) * 16
    el.scrollTop += dy
    lastY.current = e.touches[0].clientY
    lastTime.current = now
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    animRef.current = requestAnimationFrame(applyInertiaRef.current)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd])

  // ── Track scroll progress ─────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const pct = Math.min(100, (scrollTop / (scrollHeight - clientHeight)) * 100)
    setScrollPct(pct)
    setHasScrolledAtAll((prev) => prev || scrollTop > 0)
    if (pct >= 95) setHasScrolledToBottom(true)
  }, [])

  // ── Lock body scroll while modal is open ─────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // ── Refuerzo sutil del aviso si el usuario todavía no ha desplazado ─────
  useEffect(() => {
    if (hasScrolledAtAll) return
    const timeout = window.setTimeout(() => setNudge(true), 7000)
    return () => window.clearTimeout(timeout)
  }, [hasScrolledAtAll])

  const canAccept = hasScrolledToBottom && accepted

  return (
    <div
      className="legal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
    >
      {/* Backdrop */}
      <div className="legal-backdrop" />

      {/* Modal */}
      <div className="legal-modal">
        {/* Header */}
        <div className="legal-modal-header">
          <div>
            <div className="legal-modal-eyebrow">
              <span className="legal-badge">Requerido</span>
            </div>
            <h2 id="terms-modal-title" className="legal-modal-title">
              Términos de Servicio y Política de Privacidad
            </h2>
            <p className="legal-modal-subtitle">
              Léelos con calma — puedes bajar rápido si quieres, pero al aceptar confirmas que eres responsable de su contenido.
            </p>
          </div>

          {/* Progress bar */}
          <div className="legal-progress-wrap">
            <div className="legal-progress-bar" style={{ width: `${scrollPct}%` }} />
          </div>
          <div className="legal-progress-label" role="status">
            {scrollPct < 95 ? (
              <>
                <span className="legal-progress-pct">
                  <span aria-hidden="true">{Math.round(scrollPct)}% leído</span>
                </span>
                <span className="legal-progress-msg">Desplázate hasta el final para poder aceptar</span>
              </>
            ) : (
              <span className="legal-progress-done">✓ Has llegado al final</span>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="legal-modal-body"
        >
          <div
            className={`legal-scroll-hint${hasScrolledAtAll ? ' legal-scroll-hint-hidden' : ''}${nudge ? ' legal-scroll-hint-nudge' : ''}`}
            aria-hidden="true"
          >
            <span className="legal-scroll-hint-arrow" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
            <span>Desplázate hacia abajo para continuar</span>
          </div>
          <TermsContent />
        </div>

        {/* Footer */}
        <div className="legal-modal-footer">
          {/* Checkbox */}
          <label className={`legal-checkbox-label ${!hasScrolledToBottom ? 'legal-checkbox-disabled' : ''}`}>
            <div className="relative">
              <input
                id="accept-terms-checkbox"
                type="checkbox"
                checked={accepted}
                disabled={!hasScrolledToBottom}
                onChange={e => setAccepted(e.target.checked)}
                className="legal-checkbox-input"
              />
              <div className={`legal-checkbox-custom ${accepted ? 'legal-checkbox-checked' : ''} ${!hasScrolledToBottom ? 'opacity-40' : ''}`}>
                {accepted && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span>
              He leído y acepto los{' '}
              <Link href="/terms" className="text-[#0066cc] hover:underline" target="_blank">Términos de Servicio</Link>
              {' '}y la{' '}
              <Link href="/privacy" className="text-[#0066cc] hover:underline" target="_blank">Política de Privacidad</Link>
              , incluyendo el tratamiento de mis datos personales conforme a la Ley N.° 8968 de Costa Rica.
              {!hasScrolledToBottom && (
                <span className="block text-[11px] text-[#ff6b35] mt-1">
                  ↓ Desplázate hasta el final del documento para activar esta opción
                </span>
              )}
            </span>
          </label>

          {/* Buttons */}
          <div className="legal-modal-actions">
            <button
              onClick={onDecline}
              className="legal-btn-decline"
            >
              Cancelar
            </button>
            <button
              onClick={onAccept}
              disabled={!canAccept}
              className={`legal-btn-accept ${canAccept ? 'legal-btn-accept-active' : 'legal-btn-accept-disabled'}`}
            >
              {canAccept ? 'Acepto y Continúo →' : 'Desplázate hasta el final para aceptar'}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .legal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .legal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .legal-modal {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 680px;
          max-height: min(88vh, 840px);
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06);
          overflow: hidden;
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .legal-modal-header {
          flex-shrink: 0;
          padding: 24px 28px 16px;
          border-bottom: 1px solid #e2e2e5;
          background: #fff;
        }
        .legal-modal-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .legal-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 999px;
          background: #fff3e0;
          border: 1px solid #ffd599;
          font-size: 11px;
          font-weight: 700;
          color: #c85000;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .legal-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #1d1d1f;
          letter-spacing: -0.02em;
          line-height: 1.3;
          margin: 0 0 4px;
        }
        .legal-modal-subtitle {
          font-size: 13px;
          color: #707070;
          margin: 0 0 14px;
          line-height: 1.5;
        }

        .legal-progress-wrap {
          height: 5px;
          border-radius: 999px;
          background: #e2e2e5;
          overflow: hidden;
          margin-bottom: 6px;
        }
        .legal-progress-bar {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #0071e3, #34c759);
          transition: width 0.2s ease;
        }
        .legal-progress-label {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .legal-progress-pct {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.2;
          color: #1d1d1f;
        }
        .legal-progress-msg {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.4;
          color: #b34000;
        }
        .legal-progress-done {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.4;
          color: #1a7f37;
        }

        .legal-scroll-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin: 0 0 20px;
          padding: 10px 14px;
          border-radius: 12px;
          background: #fff7ed;
          border: 1px solid #ffd9b3;
          color: #b34000;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.4;
          pointer-events: none;
          transition: opacity 0.25s ease, transform 0.25s ease;
          animation: legalHintIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
          animation-delay: 0.1s;
        }
        .legal-scroll-hint-hidden {
          opacity: 0;
          transform: translateY(-6px);
        }
        .legal-scroll-hint-hidden .legal-scroll-hint-arrow,
        .legal-scroll-hint-hidden .legal-scroll-hint-arrow::before { animation: none; }
        @keyframes legalHintIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .legal-scroll-hint-arrow {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          flex-shrink: 0;
          border-radius: 999px;
          background: #fff;
          border: 1px solid #ffd9b3;
          color: #b34000;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9);
          filter: drop-shadow(0 0 3px rgba(255, 107, 53, 0.2));
          animation:
            legalChipIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.35s backwards,
            legalFloat 1.9s cubic-bezier(0.45, 0, 0.55, 1) 0.9s 2 backwards;
        }
        .legal-scroll-hint-arrow::before {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255, 107, 53, 0.35), rgba(255, 107, 53, 0) 70%);
          opacity: 0.15;
          z-index: -1;
          animation: legalGlowBreathe 1.9s cubic-bezier(0.45, 0, 0.55, 1) 0.9s 2 backwards;
        }
        .legal-scroll-hint-arrow svg { display: block; }
        .legal-scroll-hint-nudge .legal-scroll-hint-arrow {
          animation: legalFloat 1.9s cubic-bezier(0.45, 0, 0.55, 1) 1;
        }
        .legal-scroll-hint-nudge .legal-scroll-hint-arrow::before {
          animation: legalGlowBreathe 1.9s cubic-bezier(0.45, 0, 0.55, 1) 1;
        }
        @keyframes legalChipIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes legalFloat {
          0%, 100% { transform: translateY(0); filter: drop-shadow(0 0 3px rgba(255, 107, 53, 0.2)); }
          30%      { transform: translateY(3px); filter: drop-shadow(0 0 6px rgba(255, 107, 53, 0.4)); }
          55%      { transform: translateY(6px); filter: drop-shadow(0 0 9px rgba(255, 107, 53, 0.5)); }
          80%      { transform: translateY(3px); filter: drop-shadow(0 0 6px rgba(255, 107, 53, 0.4)); }
        }
        @keyframes legalGlowBreathe {
          0%, 100% { opacity: 0.12; }
          55%      { opacity: 0.3; }
        }

        @media (prefers-reduced-motion: reduce) {
          .legal-scroll-hint,
          .legal-scroll-hint-arrow,
          .legal-scroll-hint-arrow::before { animation: none; }
          .legal-scroll-hint { transition: none; }
        }

        .legal-modal-body {
          flex: 1;
          overflow-y: scroll;
          padding: 24px 28px;
          scroll-behavior: auto; /* manual inertia handles smoothness */
          -webkit-overflow-scrolling: touch;
        }
        .legal-modal-body::-webkit-scrollbar { width: 6px; }
        .legal-modal-body::-webkit-scrollbar-track { background: #f5f5f7; border-radius: 999px; }
        .legal-modal-body::-webkit-scrollbar-thumb { background: #c7c7cc; border-radius: 999px; }
        .legal-modal-body::-webkit-scrollbar-thumb:hover { background: #aeaeb2; }

        .legal-modal-content { display: flex; flex-direction: column; gap: 0; }
        .legal-section { padding-bottom: 20px; margin-bottom: 20px; border-bottom: 1px solid #f0f0f2; }
        .legal-section:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
        .legal-section h3 { font-size: 14px; font-weight: 700; color: #1d1d1f; margin: 0 0 8px; }
        .legal-section p { font-size: 13px; color: #474747; line-height: 1.7; margin: 0 0 8px; }
        .legal-section p:last-child { margin-bottom: 0; }
        .legal-section ul { margin: 6px 0 8px 16px; list-style: disc; }
        .legal-section li { font-size: 13px; color: #474747; line-height: 1.7; margin-bottom: 4px; }
        .legal-section strong { color: #1d1d1f; font-weight: 600; }
        .legal-section em { color: #707070; font-style: italic; }

        .legal-modal-footer {
          flex-shrink: 0;
          padding: 20px 28px;
          border-top: 1px solid #e2e2e5;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .legal-checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          font-size: 13px;
          color: #474747;
          line-height: 1.55;
          user-select: none;
        }
        .legal-checkbox-disabled { cursor: not-allowed; opacity: 0.8; }
        .legal-checkbox-input { position: absolute; opacity: 0; width: 0; height: 0; }
        .legal-checkbox-custom {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 2px solid #c7c7cc;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.15s, background 0.15s;
          margin-top: 2px;
        }
        .legal-checkbox-checked {
          border-color: #0071e3;
          background: #0071e3;
        }

        .legal-modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .legal-btn-decline {
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid #d2d2d7;
          background: white;
          font-size: 13px;
          font-weight: 500;
          color: #474747;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .legal-btn-decline:hover { border-color: #aeaeb2; color: #1d1d1f; }
        .legal-btn-accept {
          flex: 1;
          padding: 10px 20px;
          border-radius: 999px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          white-space: nowrap;
        }
        .legal-btn-accept-active {
          background: #0071e3;
          color: white;
          box-shadow: 0 2px 8px rgba(0,113,227,0.35);
        }
        .legal-btn-accept-active:hover { background: #0060c7; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,113,227,0.4); }
        .legal-btn-accept-disabled {
          background: #e2e2e5;
          color: #aeaeb2;
          cursor: not-allowed;
          font-size: 12px;
        }

        @media (max-width: 640px) {
          .legal-modal { border-radius: 14px; max-height: 95vh; }
          .legal-modal-header { padding: 18px 18px 12px; }
          .legal-modal-body { padding: 16px 18px; }
          .legal-modal-footer { padding: 14px 18px; }
          .legal-modal-actions { flex-direction: column-reverse; }
          .legal-btn-accept { flex: none; }
          .legal-progress-pct { font-size: 22px; }
          .legal-scroll-hint { font-size: 14px; padding: 12px 14px; margin-bottom: 16px; gap: 12px; }
          .legal-scroll-hint-arrow { width: 30px; height: 30px; }
          .legal-scroll-hint-arrow svg { width: 18px; height: 18px; }
          .legal-scroll-hint-arrow::before { inset: -6px; }
        }
      `}</style>
    </div>
  )
}
