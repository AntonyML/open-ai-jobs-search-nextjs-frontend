'use client'

import Link from 'next/link'
import LegalStyles from '@/components/LegalStyles'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      {/* ── Hero ── */}
      <section className="border-b border-[#d2d2d7] bg-white">
        <div className="mx-auto max-w-[860px] px-5 md:px-8 py-14 md:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-3">Legal</p>
          <h1 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07]">
            Términos de Servicio
          </h1>
          <p className="mt-3 text-[15px] text-[#707070]">
            Última actualización: 15 de julio de 2025 · República de Costa Rica
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-4 py-1.5 text-[12px] font-medium text-[#474747] hover:border-[#0071e3]/40 hover:text-[#0071e3] transition-all"
            >
              Ver Política de Privacidad →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="mx-auto max-w-[860px] px-5 md:px-8 py-12 md:py-16">
        <div className="prose-legal">

          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al acceder, registrarse o utilizar la plataforma <strong>Open Ai Jobs Search</strong> (en adelante &quot;la Plataforma&quot;, &quot;el Servicio&quot; o &quot;nosotros&quot;), usted (en adelante &quot;el Usuario&quot;) declara haber leído, comprendido y aceptado en su totalidad los presentes Términos de Servicio, así como nuestra Política de Privacidad, que se incorpora por referencia.
          </p>
          <p>Si no está de acuerdo con alguna de estas condiciones, debe abstenerse de utilizar la Plataforma.</p>

          <h2>2. Descripción del Servicio</h2>
          <p>Open Ai Jobs Search es una plataforma de software como servicio (SaaS) que permite a personas físicas:</p>
          <ul>
            <li>Crear y gestionar un perfil profesional de candidato.</li>
            <li>Descubrir ofertas de empleo en portales públicos de internet mediante técnicas automatizadas de recopilación de datos (<em>web scraping</em>).</li>
            <li>Evaluar y priorizar ofertas de empleo mediante algoritmos deterministas e inteligencia artificial generativa.</li>
            <li>Generar documentos de postulación (currículum vítae y cartas de presentación) mediante modelos de lenguaje de terceros.</li>
            <li>Prepararse para entrevistas de trabajo mediante contenido generado por inteligencia artificial.</li>
            <li>Registrar y hacer seguimiento de postulaciones y resultados.</li>
          </ul>
          <p>El Servicio actúa como intermediario tecnológico y <strong>no</strong> es una bolsa de empleo, agencia de colocación ni empleador.</p>

          <h2>3. Elegibilidad y Registro</h2>
          <h3>3.1 Edad mínima</h3>
          <p>Para utilizar la Plataforma, el Usuario debe tener al menos <strong>18 años de edad</strong> o la mayoría de edad legal en su jurisdicción de residencia.</p>
          <h3>3.2 Veracidad de la información</h3>
          <p>El Usuario se compromete a proporcionar información veraz, completa y actualizada durante el registro y en todo momento posterior. El suministro de información falsa constituye motivo de cancelación inmediata de la cuenta.</p>
          <h3>3.3 Seguridad de la cuenta</h3>
          <p>El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. Cualquier actividad realizada desde su cuenta se presume realizada por el Usuario. Ante sospechas de acceso no autorizado, debe notificarnos de inmediato.</p>

          <h2>4. Uso Aceptable</h2>
          <h3>4.1 Usos permitidos</h3>
          <p>El Usuario puede utilizar la Plataforma exclusivamente para:</p>
          <ul>
            <li>Fines personales y no comerciales relacionados con su búsqueda de empleo.</li>
            <li>Generar documentos de postulación destinados a ser enviados a empleadores reales.</li>
            <li>Explorar y filtrar ofertas de empleo legítimas.</li>
          </ul>
          <h3>4.2 Usos prohibidos</h3>
          <p>Queda estrictamente prohibido:</p>
          <ul>
            <li>Utilizar la Plataforma para actividades ilegales, fraudulentas o engañosas.</li>
            <li>Acceder a datos de terceros sin autorización.</li>
            <li>Realizar ingeniería inversa, descompilar o desensamblar cualquier componente del software.</li>
            <li>Transmitir malware, virus o código dañino.</li>
            <li>Sobrecargar los sistemas mediante ataques de denegación de servicio o peticiones masivas automatizadas.</li>
            <li>Revender, sublicenciar o ceder el acceso a la Plataforma a terceros.</li>
            <li>Utilizar la Plataforma para crear productos competidores.</li>
            <li>Eludir o intentar eludir medidas de seguridad, autenticación o limitación de uso.</li>
          </ul>

          <h2>5. Datos del Usuario y Propiedad Intelectual</h2>
          <h3>5.1 Datos del Usuario</h3>
          <p>Usted conserva todos los derechos sobre los datos que ingresa en la Plataforma. Al ingresar estos datos, nos otorga una licencia limitada, no exclusiva, para procesarlos con el único fin de prestarle el Servicio.</p>
          <h3>5.2 Propiedad de la Plataforma</h3>
          <p>Todo el código fuente, diseño, marcas, logotipos, textos y demás elementos de la Plataforma son propiedad de Open Ai Jobs Search o sus licenciantes, y están protegidos por las leyes de propiedad intelectual de Costa Rica y tratados internacionales aplicables.</p>
          <h3>5.3 Contenido generado por IA</h3>
          <p>Los documentos generados son producidos mediante modelos de lenguaje de terceros. El Usuario es responsable de revisar, verificar y decidir sobre el uso de dicho contenido antes de enviarlo a empleadores.</p>

          <h2>6. Servicios de Terceros y API Keys</h2>
          <p>La Plataforma integra modelos de lenguaje de terceros (OpenAI, Anthropic, NVIDIA NIM, OpenRouter, entre otros). El uso de dichos servicios está sujeto a los términos y condiciones de cada proveedor.</p>
          <p>El Usuario es responsable de mantener la validez y seguridad de sus propias API keys y cumplir los términos de uso de cada proveedor de IA que conecte.</p>
          <p><strong>Open Ai Jobs Search no almacena sus API keys en texto claro.</strong> Estas son cifradas antes de ser guardadas en base de datos.</p>

          <h2>7. Planes, Pagos y Cancelación</h2>
          <p>La Plataforma puede ofrecer planes gratuitos y de pago. Los planes de pago se facturan de forma mensual o anual. Las tarifas están expresadas en dólares estadounidenses (USD) e incluyen los impuestos aplicables conforme a la legislación costarricense vigente.</p>
          <p>El Usuario puede cancelar su suscripción en cualquier momento. La cancelación tendrá efecto al final del período de facturación vigente. No se realizan reembolsos prorrateados por períodos no utilizados, salvo disposición contraria de la ley.</p>

          <h2>8. Limitación de Responsabilidad</h2>
          <p>En la máxima medida permitida por la ley costarricense:</p>
          <ul>
            <li>La Plataforma se proporciona <strong>&quot;tal cual&quot;</strong> y <strong>&quot;según disponibilidad&quot;</strong>, sin garantías de ningún tipo.</li>
            <li>No garantizamos que el Servicio sea ininterrumpido, libre de errores ni que los resultados obtenidos sean precisos o confiables.</li>
            <li><strong>No somos responsables por resultados de procesos de selección, rechazos de empleadores, inexactitudes en el contenido generado por IA, ni por el uso que el Usuario haga de dicho contenido.</strong></li>
            <li>Nuestra responsabilidad total ante el Usuario no excederá el monto pagado por el Servicio en los tres (3) meses anteriores al evento generador de la reclamación.</li>
          </ul>

          <h2>9. Indemnización</h2>
          <p>El Usuario acepta indemnizar y mantener indemne a Open Ai Jobs Search frente a cualquier reclamación, daño, pérdida, costo o gasto que surja de su uso indebido de la Plataforma, violación de estos Términos o de derechos de terceros, o inexactitudes en la información proporcionada.</p>

          <h2>10. Modificaciones al Servicio y a los Términos</h2>
          <p>Nos reservamos el derecho de modificar, suspender o descontinuar el Servicio en cualquier momento. Podemos actualizar estos Términos periódicamente y le notificaremos los cambios mediante publicación en la Plataforma y notificación por correo electrónico. El uso continuado de la Plataforma tras la publicación de los cambios constituye aceptación de los nuevos Términos.</p>

          <h2>11. Suspensión y Cancelación de Cuenta</h2>
          <p>Nos reservamos el derecho de suspender o cancelar su cuenta, con o sin previo aviso, por incumplimiento de estos Términos, actividad fraudulenta o ilegal, falta de pago (planes de pago) o solicitud del propio Usuario.</p>

          <h2>12. Ley Aplicable y Resolución de Disputas</h2>
          <p>Estos Términos se rigen por las leyes de la <strong>República de Costa Rica</strong>, incluyendo la Ley N.° 8968 (Protección de Datos Personales), la Ley N.° 7472 (Defensa del Consumidor), el Código Civil y el Código de Comercio.</p>
          <p>Cualquier disputa que no pueda resolverse amigablemente será sometida a la jurisdicción de los <strong>Tribunales de Justicia del Primer Circuito Judicial de San José, Costa Rica</strong>.</p>

          <h2>13. Disposiciones Generales</h2>
          <p>Si alguna disposición de estos Términos es declarada inválida, el resto permanecerá en plena vigencia. La falta de exigencia de cualquier derecho no constituye renuncia al mismo. Estos Términos, junto con la Política de Privacidad, constituyen el acuerdo completo entre las partes respecto al Servicio.</p>

          <h2>14. Contacto</h2>
          <p>
            <strong>Open Ai Jobs Search</strong><br />
            Correo electrónico: <a href="mailto:legal@openai-jobs-search.com">legal@openai-jobs-search.com</a><br />
            República de Costa Rica
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-[#d2d2d7] flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#0068d2] transition-all"
          >
            Ver Política de Privacidad →
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-5 py-2.5 text-[13px] font-medium text-[#474747] hover:border-[#0071e3]/40 transition-all"
          >
            Crear cuenta
          </Link>
        </div>
      </section>

      <LegalStyles />
    </main>
  )
}
