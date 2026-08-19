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
            Última actualización: 19 de agosto de 2026 · República de Costa Rica
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
            Al acceder, registrarse o utilizar la plataforma <strong>CVMeld</strong> (en adelante &quot;la Plataforma&quot;, &quot;el Servicio&quot; o &quot;nosotros&quot;), usted (en adelante &quot;el Usuario&quot;) declara haber leído, comprendido y aceptado en su totalidad los presentes Términos de Servicio, así como nuestra Política de Privacidad, que se incorpora por referencia. Si el Usuario es una persona jurídica, declara contar con las facultades para aceptar estos Términos en nombre de dicha entidad.
          </p>
          <p>Si no está de acuerdo con alguna de estas condiciones, debe abstenerse de utilizar la Plataforma.</p>

          <h2>2. Descripción del Servicio</h2>
          <p>CVMeld es una plataforma de software como servicio (SaaS) que permite a personas físicas:</p>
          <ul>
            <li>Crear y gestionar un perfil profesional de candidato.</li>
            <li>Descubrir ofertas de empleo publicadas en fuentes públicas de internet mediante técnicas automatizadas de recopilación de datos.</li>
            <li>Evaluar y priorizar ofertas de empleo mediante algoritmos deterministas e inteligencia artificial generativa.</li>
            <li>Generar documentos de postulación (currículum vítae y cartas de presentación) mediante modelos de lenguaje de terceros.</li>
            <li>Prepararse para entrevistas de trabajo mediante contenido generado por inteligencia artificial.</li>
            <li>Registrar y hacer seguimiento de postulaciones y resultados.</li>
          </ul>
          <p>El Servicio actúa como intermediario tecnológico y <strong>no</strong> es una bolsa de empleo, agencia de colocación, empleador, asesor legal, financiero ni de recursos humanos. <strong>Nada de lo contenido en la Plataforma constituye asesoría profesional de ningún tipo.</strong></p>

          <h2>3. Elegibilidad y Registro</h2>
          <h3>3.1 Edad mínima</h3>
          <p>Para utilizar la Plataforma, el Usuario debe tener al menos <strong>18 años de edad</strong> o la mayoría de edad legal en su jurisdicción de residencia.</p>
          <h3>3.2 Veracidad de la información</h3>
          <p>El Usuario se compromete a proporcionar información veraz, completa y actualizada durante el registro y en todo momento posterior. El suministro de información falsa o engañosa constituye motivo de cancelación inmediata de la cuenta.</p>
          <h3>3.3 Seguridad de la cuenta</h3>
          <p>El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades realizadas desde su cuenta. No debe compartir su cuenta con terceros ni cederla. Ante sospechas de acceso no autorizado, debe notificarnos de inmediato. Se permite <strong>una cuenta por persona</strong>; la creación de cuentas múltiples para eludir límites o promociones podrá dar lugar a la cancelación de todas las cuentas relacionadas.</p>

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
            <li>Transmitir malware, virus o cualquier código dañino.</li>
            <li>Sobrecargar los sistemas mediante ataques de denegación de servicio, extracción masiva de datos (<em>scraping</em> de la Plataforma) o peticiones automatizadas.</li>
            <li>Revender, sublicenciar, alquilar o ceder el acceso a la Plataforma a terceros.</li>
            <li>Utilizar la Plataforma para crear productos o servicios competidores.</li>
            <li>Eludir o intentar eludir medidas de seguridad, autenticación, límites de uso o controles de acceso.</li>
            <li>Cargar, transmitir o generar contenido difamatorio, discriminatorio, de odio, sexualmente explícito o que viole los derechos de terceros.</li>
            <li>Suplantar la identidad de otras personas o entidades.</li>
            <li>Enviar comunicaciones no solicitadas (<em>spam</em>) o acosar a terceros.</li>
            <li>Utilizar el contenido generado para fines ilegales, incluida la falsificación de documentos o la suplantación de candidatos.</li>
          </ul>
          <p>El incumplimiento de estas prohibiciones puede resultar en la suspensión inmediata de la cuenta y en acciones legales, sin perjuicio de los daños y perjuicios que correspondan.</p>

          <h2>5. Datos del Usuario y Propiedad Intelectual</h2>
          <h3>5.1 Datos del Usuario</h3>
          <p>Usted conserva todos los derechos sobre los datos que ingresa en la Plataforma (perfil, currículum, información de empleo, etc.). Al ingresar estos datos, nos otorga una licencia limitada, no exclusiva, mundial y libre de regalías para procesarlos, almacenarlos y transmitirlos con el único fin de prestarle el Servicio. El Usuario declara ser el titular de dicha información o contar con la autorización correspondiente, y es el único responsable de su contenido y veracidad.</p>
          <h3>5.2 Propiedad de la Plataforma</h3>
          <p>Todo el código fuente, diseño, marcas, logotipos, textos y demás elementos de la Plataforma son propiedad de <strong>CVMeld</strong> o sus licenciantes, y están protegidos por las leyes de propiedad intelectual de Costa Rica y los tratados internacionales aplicables. El nombre &quot;CVMeld&quot; y sus logotipos son marcas de propiedad de CVMeld; su uso no autorizado está prohibido.</p>
          <h3>5.3 Retroalimentación</h3>
          <p>Si el Usuario nos envía sugerencias, ideas o comentarios (&quot;Retroalimentación&quot;), nos otorga una licencia mundial, irrevocable y libre de regalías para usarlos, modificarlos y explotarlos sin ninguna obligación de atribución o compensación.</p>
          <h3>5.4 Contenido generado por IA</h3>
          <p>Los documentos y contenidos generados por la Plataforma se producen mediante modelos de lenguaje de terceros y <strong>no constituyen asesoría profesional</strong>. El Usuario es el único responsable de revisar, verificar, corregir y decidir sobre el uso de dicho contenido antes de enviarlo a empleadores. La Plataforma no garantiza la exactitud, completitud ni idoneidad del contenido generado para un proceso de selección determinado.</p>

          <h2>6. Contenido Generado por Inteligencia Artificial</h2>
          <ul>
            <li>El contenido generado se proporciona <strong>&quot;tal cual&quot;</strong> y puede contener errores, omisiones o inexactitudes.</li>
            <li>La decisión de utilizar, modificar o descartar el contenido generado es exclusiva del Usuario.</li>
            <li>La Plataforma no participa en el proceso de selección del empleador y no tiene control sobre sus resultados.</li>
            <li>Los modelos de IA pueden evolucionar o cambiar sin previo aviso, por lo que los resultados pueden variar con el tiempo.</li>
          </ul>

          <h2>7. Servicios de Terceros y API Keys</h2>
          <p>La Plataforma integra modelos de lenguaje de terceros (OpenAI, Anthropic, NVIDIA NIM, OpenRouter, entre otros). El uso de dichos servicios está sujeto a los términos y condiciones de cada proveedor. CVMeld no es responsable por el funcionamiento, disponibilidad, políticas o prácticas de dichos proveedores.</p>
          <p>El Usuario es responsable de:</p>
          <ul>
            <li>Mantener la validez y seguridad de sus propias API keys.</li>
            <li>Cumplir los términos de uso de cada proveedor de IA que conecte.</li>
            <li>Todos los costos de uso de APIs de terceros que se generen a través de sus llaves.</li>
            <li>Cualquier uso indebido que un tercero haga de sus credenciales.</li>
          </ul>
          <p><strong>CVMeld no almacena sus API keys en texto claro.</strong> Estas son cifradas antes de ser guardadas en la base de datos.</p>

          <h2>8. Ofertas de Empleo de Terceros</h2>
          <p>La Plataforma agrega y muestra ofertas de empleo provenientes de fuentes públicas de terceros (portales de empleo, canales de Telegram, redes sociales, entre otros). CVMeld:</p>
          <ul>
            <li><strong>No</strong> es la fuente de dichas ofertas ni participa en su publicación.</li>
            <li><strong>No</strong> garantiza la vigencia, exactitud, legalidad ni veracidad de las ofertas mostradas.</li>
            <li><strong>No</strong> es responsable por las prácticas de contratación, políticas o contenidos de los empleadores o portales de origen.</li>
            <li>Recomienda al Usuario verificar cada oferta directamente en la fuente antes de postularse y abstenerse de compartir información sensible con fuentes no verificadas.</li>
          </ul>

          <h2>9. Planes, Pagos y Cancelación</h2>
          <h3>9.1 Planes disponibles</h3>
          <p>La Plataforma puede ofrecer planes gratuitos y de pago. Las características específicas de cada plan se describen en la página de precios vigente al momento de la suscripción. CVMeld se reserva el derecho de modificar sus planes, precios o características en cualquier momento, con notificación previa razonable a los usuarios afectados.</p>
          <h3>9.2 Facturación</h3>
          <p>Los planes de pago se facturan de forma mensual o anual según lo seleccionado. Las tarifas están expresadas en dólares estadounidenses (USD) e incluyen los impuestos aplicables conforme a la legislación costarricense vigente. Los cargos se efectuarán mediante el método de pago que el Usuario haya registrado. El Usuario es responsable de mantener actualizados sus datos de pago.</p>
          <h3>9.3 Cancelación y reembolsos</h3>
          <p>El Usuario puede cancelar su suscripción en cualquier momento. La cancelación tendrá efecto al final del período de facturación vigente. No se realizan reembolsos prorrateados por períodos no utilizados, salvo disposición contraria de la ley. Las disputas de pago o contracargos injustificados podrán resultar en la suspensión de la cuenta.</p>

          <h2>10. Sin Garantías</h2>
          <p>En la máxima medida permitida por la ley costarricense, la Plataforma se proporciona <strong>&quot;tal cual&quot;</strong> y <strong>&quot;según disponibilidad&quot;</strong>, sin garantías de ningún tipo, expresas o implícitas, incluidas, sin limitación, las garantías de comerciabilidad, idoneidad para un fin particular, titularidad y no infracción. No garantizamos que el Servicio sea ininterrumpido, libre de errores, seguro ni que los resultados obtenidos sean precisos, confiables o conduzcan a la obtención de empleo.</p>

          <h2>11. Limitación de Responsabilidad</h2>
          <p>En la máxima medida permitida por la ley costarricense:</p>
          <ul>
            <li>CVMeld <strong>no</strong> será responsable por resultados de procesos de selección, rechazos de empleadores, inexactitudes en el contenido generado por IA, ni por el uso que el Usuario haga de dicho contenido.</li>
            <li>CVMeld <strong>no</strong> será responsable por daños indirectos, incidentales, especiales, consecuentes, punitivos o por lucro cesante, aun si se le hubiera informado de la posibilidad de dichos daños.</li>
            <li>Nuestra responsabilidad total ante el Usuario, por cualquier causa y bajo cualquier teoría de responsabilidad, <strong>no excederá el monto pagado por el Servicio en los doce (12) meses anteriores</strong> al evento generador de la reclamación, o de cien dólares (USD 100) si el Usuario es usuario del plan gratuito.</li>
            <li>Las limitaciones anteriores se aplican incluso si la solución ofrecida no cumple su finalidad esencial.</li>
          </ul>

          <h2>12. Indemnización</h2>
          <p>El Usuario acepta indemnizar, defender y mantener indemne a CVMeld, sus afiliados, directivos, empleados, agentes y licenciantes frente a cualquier reclamación, demanda, daño, pérdida, costo o gasto (incluidos honorarios legales razonables) que surjan de:</p>
          <ul>
            <li>Su uso indebido de la Plataforma.</li>
            <li>La violación de estos Términos o de derechos de terceros (incluidos empleadores, portales de empleo, proveedores de IA u otros usuarios).</li>
            <li>Inexactitudes en la información o el contenido que el Usuario proporcione o genere con la Plataforma.</li>
            <li>Su incumplimiento de leyes o regulaciones aplicables.</li>
          </ul>

          <h2>13. Renuncia a Acción de Clase y Arbitraje</h2>
          <h3>13.1 Renuncia a acción de clase</h3>
          <p>El Usuario y CVMeld renuncian expresamente a la posibilidad de participar en acciones colectivas o de clase, consolidaciones de reclamos o representación colectiva en cualquier disputa relacionada con la Plataforma.</p>
          <h3>13.2 Resolución amigable</h3>
          <p>Antes de iniciar cualquier procedimiento, las partes se comprometen a intentar resolver la disputa de buena fe mediante negociación directa durante un plazo de treinta (30) días contados desde la notificación escrita de la reclamación.</p>
          <h3>13.3 Arbitraje</h3>
          <p>Si la disputa no se resuelve de forma amigable, el Usuario acepta que toda controversia se someterá a arbitraje de derecho administrado por un tribunal arbitral único en San José, Costa Rica, de conformidad con la Ley N.° 8937 (Ley sobre Resolución Alterna de Conflictos) o la normativa aplicable. La decisión arbitral será definitiva y vinculante. Cada parte asumirá sus propios costos de arbitraje, salvo que el árbitro disponga otra cosa conforme a derecho.</p>

          <h2>14. Fuerza Mayor</h2>
          <p>Ninguna de las partes será responsable por el incumplimiento o retraso en el cumplimiento de sus obligaciones cuando dicho incumplimiento sea causado por eventos fuera de su control razonable, incluidos, sin limitación: desastres naturales, pandemias, fallas de infraestructura de terceros, cortes de energía o telecomunicaciones, conflictos laborales, disturbios, actos de gobierno, ciberataques o interrupciones de los proveedores de servicios.</p>

          <h2>15. Suspensión y Cancelación de Cuenta</h2>
          <p>Nos reservamos el derecho de suspender o cancelar su cuenta, con o sin previo aviso, por:</p>
          <ul>
            <li>Incumplimiento de estos Términos.</li>
            <li>Actividad fraudulenta, ilegal o que ponga en riesgo la Plataforma o a otros usuarios.</li>
            <li>Falta de pago (planes de pago).</li>
            <li>Solicitud del propio Usuario.</li>
          </ul>
          <p>Ante la cancelación, sus datos podrán ser eliminados o anonimizados conforme a nuestra Política de Privacidad y la legislación aplicable. Las disposiciones de estos Términos que por su naturaleza deban sobrevivir (incluidas las secciones sobre limitación de responsabilidad, indemnización, propiedad intelectual, ley aplicable y disputas) continuarán vigentes después de la cancelación.</p>

          <h2>16. Modificaciones al Servicio y a los Términos</h2>
          <p>Nos reservamos el derecho de modificar, suspender o descontinuar el Servicio (o cualquier parte del mismo) en cualquier momento, con o sin previo aviso.</p>
          <p>Podemos actualizar estos Términos periódicamente. Le notificaremos los cambios mediante:</p>
          <ul>
            <li>Publicación de la nueva versión en la Plataforma con fecha de vigencia actualizada.</li>
            <li>Notificación por correo electrónico al correo registrado, cuando los cambios sean materiales.</li>
          </ul>
          <p>El uso continuado de la Plataforma tras la publicación de los cambios constituye aceptación de los nuevos Términos. Si el Usuario no acepta los cambios, debe dejar de utilizar la Plataforma y cancelar su cuenta.</p>

          <h2>17. Ley Aplicable y Resolución de Disputas</h2>
          <p>Estos Términos se rigen por las leyes de la <strong>República de Costa Rica</strong>, incluyendo pero no limitado a:</p>
          <ul>
            <li>Ley N.° 8968 — Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales.</li>
            <li>Ley N.° 7472 — Ley de Promoción de la Competencia y Defensa Efectiva del Consumidor.</li>
            <li>Código Civil y Código de Comercio de Costa Rica.</li>
          </ul>
          <p>Cualquier disputa que no pueda resolverse amigablemente será sometida a la jurisdicción de los <strong>Tribunales de Justicia del Primer Circuito Judicial de San José, Costa Rica</strong>, sin perjuicio de lo dispuesto en la cláusula de arbitraje del punto 13.</p>

          <h2>18. Disposiciones Generales</h2>
          <ul>
            <li><strong>Divisibilidad:</strong> Si alguna disposición de estos Términos es declarada inválida o inejecutable, el resto permanecerá en plena vigencia y la disposición se sustituirá por una válida que refleje la intención de las partes.</li>
            <li><strong>Renuncia:</strong> La falta de exigencia de cualquier derecho no constituye renuncia al mismo, y una renuncia no constituye renuncia de ningún otro derecho ni de la misma disposición en el futuro.</li>
            <li><strong>Cese:</strong> El Usuario no podrá ceder o transferir sus derechos u obligaciones derivados de estos Términos sin nuestro consentimiento previo por escrito. CVMeld podrá ceder sus derechos y obligaciones libremente.</li>
            <li><strong>Acuerdo completo:</strong> Estos Términos, junto con la Política de Privacidad, constituyen el acuerdo completo entre las partes respecto al Servicio y sustituyen cualquier acuerdo o entendimiento previo.</li>
            <li><strong>Sin terceros beneficiarios:</strong> Estos Términos no crean derechos a favor de terceros que no sean parte de ellos.</li>
          </ul>

          <h2>19. Contacto</h2>
          <p>
            <strong>CVMeld</strong><br />
            Correo electrónico: <a href="mailto:legal@cvmeld.tonyml.com">legal@cvmeld.tonyml.com</a><br />
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