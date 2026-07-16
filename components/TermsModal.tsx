'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface TermsModalProps {
  onAccept: () => void
  onDecline: () => void
}

// ── Términos de Servicio completos (en JSX para el modal) ────────────────────
function TermsContent() {
  return (
    <div className="legal-modal-content">
      <div className="legal-section">
        <h3>1. Aceptación de los Términos</h3>
        <p>
          Al acceder, registrarse o utilizar la plataforma <strong>Open Ai Jobs Search</strong>, usted declara haber leído, comprendido y aceptado en su totalidad los presentes Términos de Servicio y nuestra Política de Privacidad. Si no está de acuerdo con alguna de estas condiciones, debe abstenerse de utilizar la Plataforma.
        </p>
      </div>

      <div className="legal-section">
        <h3>2. Descripción del Servicio</h3>
        <p>Open Ai Jobs Search es una plataforma SaaS que permite a personas físicas:</p>
        <ul>
          <li>Crear y gestionar un perfil profesional de candidato.</li>
          <li>Descubrir ofertas de empleo en portales públicos mediante técnicas automatizadas (<em>web scraping</em>).</li>
          <li>Evaluar y priorizar ofertas de empleo mediante algoritmos deterministas e inteligencia artificial generativa.</li>
          <li>Generar documentos de postulación (CV y cartas de presentación) mediante modelos de lenguaje de terceros.</li>
          <li>Prepararse para entrevistas de trabajo mediante contenido generado por IA.</li>
          <li>Registrar y hacer seguimiento de postulaciones y resultados.</li>
        </ul>
        <p>El Servicio actúa como intermediario tecnológico y <strong>no</strong> es una bolsa de empleo, agencia de colocación ni empleador.</p>
      </div>

      <div className="legal-section">
        <h3>3. Elegibilidad y Registro</h3>
        <p><strong>Edad mínima:</strong> Para utilizar la Plataforma, el Usuario debe tener al menos <strong>18 años de edad</strong>.</p>
        <p><strong>Veracidad:</strong> El Usuario se compromete a proporcionar información veraz, completa y actualizada. El suministro de información falsa constituye motivo de cancelación inmediata de la cuenta.</p>
        <p><strong>Seguridad:</strong> El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.</p>
      </div>

      <div className="legal-section">
        <h3>4. Uso Aceptable</h3>
        <p>Queda estrictamente prohibido:</p>
        <ul>
          <li>Utilizar la Plataforma para actividades ilegales, fraudulentas o engañosas.</li>
          <li>Realizar ingeniería inversa o descompilar cualquier componente del software.</li>
          <li>Transmitir malware, virus o código dañino.</li>
          <li>Sobrecargar los sistemas mediante ataques de denegación de servicio.</li>
          <li>Revender, sublicenciar o ceder el acceso a la Plataforma a terceros.</li>
          <li>Utilizar la Plataforma para crear productos competidores.</li>
        </ul>
      </div>

      <div className="legal-section">
        <h3>5. Datos del Usuario y Propiedad Intelectual</h3>
        <p>Usted conserva todos los derechos sobre los datos que ingresa en la Plataforma. Al ingresar estos datos, nos otorga una licencia limitada y no exclusiva para procesarlos con el único fin de prestarle el Servicio.</p>
        <p>Los documentos generados por IA son producidos mediante modelos de lenguaje de terceros. El Usuario es <strong>responsable de revisar y verificar</strong> dicho contenido antes de enviarlo a empleadores.</p>
      </div>

      <div className="legal-section">
        <h3>6. Servicios de Terceros y API Keys</h3>
        <p>La Plataforma integra modelos de lenguaje de terceros (OpenAI, Anthropic, NVIDIA NIM, OpenRouter, entre otros). <strong>Open Ai Jobs Search no almacena sus API keys en texto claro.</strong> Estas son cifradas antes de ser guardadas en base de datos. El Usuario es responsable de cumplir los términos de uso de cada proveedor de IA que conecte.</p>
      </div>

      <div className="legal-section">
        <h3>7. Limitación de Responsabilidad</h3>
        <p>En la máxima medida permitida por la ley costarricense, la Plataforma se proporciona <strong>"tal cual"</strong> y <strong>"según disponibilidad"</strong>, sin garantías de ningún tipo. No somos responsables por resultados de procesos de selección, rechazos de empleadores, inexactitudes en el contenido generado por IA, ni por el uso que el Usuario haga de dicho contenido. Nuestra responsabilidad total no excederá el monto pagado por el Servicio en los tres (3) meses anteriores al evento generador de la reclamación.</p>
      </div>

      <div className="legal-section">
        <h3>8. Indemnización</h3>
        <p>El Usuario acepta indemnizar y mantener indemne a Open Ai Jobs Search frente a cualquier reclamación, daño, pérdida, costo o gasto que surja de su uso indebido de la Plataforma, violación de estos Términos o de derechos de terceros.</p>
      </div>

      <div className="legal-section">
        <h3>9. Modificaciones al Servicio y a los Términos</h3>
        <p>Nos reservamos el derecho de modificar, suspender o descontinuar el Servicio en cualquier momento. Podemos actualizar estos Términos y le notificaremos los cambios mediante publicación en la Plataforma y notificación por correo electrónico.</p>
      </div>

      <div className="legal-section">
        <h3>10. Política de Privacidad y Datos Sensibles</h3>
        <p>Al registrarse, usted autoriza el tratamiento de sus datos personales de conformidad con nuestra <strong>Política de Privacidad</strong> y la <strong>Ley N.° 8968</strong> de Costa Rica. En particular:</p>
        <ul>
          <li><strong>Datos recopilados:</strong> nombre completo, correo electrónico, perfil profesional, habilidades, experiencia laboral, educación, proyectos, preferencias laborales, API keys (cifradas), documentos generados y datos de uso.</li>
          <li><strong>Datos sensibles:</strong> Su perfil profesional puede contener información sensible (salud, orientación, creencias). Usted decide qué incluir y asume la responsabilidad de esa decisión.</li>
          <li><strong>Cifrado:</strong> Las contraseñas se almacenan como hash irreversible (bcrypt). Las API keys se cifran en reposo. La comunicación usa TLS (HTTPS).</li>
          <li><strong>Compartición con terceros:</strong> Fragmentos de su perfil son enviados a proveedores de IA únicamente para completar las tareas que usted solicita. <strong>No vendemos sus datos.</strong></li>
          <li><strong>No entrenamiento:</strong> Sus datos nunca son usados para entrenar modelos de inteligencia artificial.</li>
          <li><strong>Retención:</strong> Sus datos son eliminados o anonimizados en máximo 90 días tras cerrar su cuenta.</li>
          <li><strong>Sus derechos (Ley 8968):</strong> acceso, rectificación, cancelación, oposición, portabilidad y revocación del consentimiento. Ejecútelos escribiendo a privacy@openai-jobs-search.com.</li>
        </ul>
      </div>

      <div className="legal-section">
        <h3>11. Ley Aplicable y Resolución de Disputas</h3>
        <p>Estos Términos se rigen por las leyes de la <strong>República de Costa Rica</strong> (Ley N.° 8968, Ley N.° 7472, Código Civil y Código de Comercio). Cualquier disputa será sometida a la jurisdicción de los <strong>Tribunales de Justicia del Primer Circuito Judicial de San José, Costa Rica</strong>.</p>
      </div>

      <div className="legal-section">
        <h3>12. Contacto Legal</h3>
        <p>
          <strong>Open Ai Jobs Search</strong><br />
          legal@openai-jobs-search.com · privacy@openai-jobs-search.com<br />
          República de Costa Rica
        </p>
        <p>
          <span style={{ fontSize: '12px', color: '#858585' }}>
            Puede consultar los documentos completos en:{' '}
            <Link href="/terms" className="text-[#0066cc] hover:underline" target="_blank">Términos de Servicio</Link>
            {' '}y{' '}
            <Link href="/privacy" className="text-[#0066cc] hover:underline" target="_blank">Política de Privacidad</Link>.
          </span>
        </p>
      </div>
    </div>
  )
}

export default function TermsModal({ onAccept, onDecline }: TermsModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)

  // ── Inertia scroll effect ─────────────────────────────────────────────────
  const velocityRef = useRef(0)
  const animRef = useRef<number | null>(null)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const isDragging = useRef(false)

  const applyInertia = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    if (Math.abs(velocityRef.current) < 0.5) {
      animRef.current = null
      return
    }
    el.scrollTop += velocityRef.current
    velocityRef.current *= 0.93 // friction
    animRef.current = requestAnimationFrame(applyInertia)
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const el = scrollRef.current
    if (!el) return
    // Boost speed when scrolling fast (deltaY large = user scrolls fast)
    const speed = Math.abs(e.deltaY)
    const multiplier = speed > 100 ? 2.5 : speed > 50 ? 1.6 : 1
    el.scrollTop += e.deltaY * multiplier
    velocityRef.current = e.deltaY * 0.3
    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(applyInertia)
  }, [applyInertia])

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
    animRef.current = requestAnimationFrame(applyInertia)
  }, [applyInertia])

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
    if (pct >= 95) setHasScrolledToBottom(true)
  }, [])

  // ── Lock body scroll while modal is open ─────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

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
          <div className="legal-progress-label">
            {scrollPct < 95
              ? `${Math.round(scrollPct)}% leído — desplázate hasta el final para aceptar`
              : '✓ Has llegado al final'}
          </div>
        </div>

        {/* Scrollable body */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="legal-modal-body"
        >
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
          font-size: 11px;
          color: #858585;
          font-weight: 500;
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
        }
      `}</style>
    </div>
  )
}
