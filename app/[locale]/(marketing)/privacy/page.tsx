'use client'

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      {/* ── Hero ── */}
      <section className="border-b border-[#d2d2d7] bg-white">
        <div className="mx-auto max-w-[860px] px-5 md:px-8 py-14 md:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0071e3] mb-3">Legal</p>
          <h1 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#1d1d1f] leading-[1.07]">
            Política de Privacidad
          </h1>
          <p className="mt-3 text-[15px] text-[#707070]">
            Última actualización: 15 de julio de 2025 · República de Costa Rica · Ley N.° 8968
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/terms"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-4 py-1.5 text-[12px] font-medium text-[#474747] hover:border-[#0071e3]/40 hover:text-[#0071e3] transition-all"
            >
              Ver Términos de Servicio →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="mx-auto max-w-[860px] px-5 md:px-8 py-12 md:py-16">
        <div className="prose-legal">

          <h2>1. Introducción</h2>
          <p>
            Open Ai Jobs Search se compromete a proteger su privacidad. La presente Política de Privacidad describe qué datos personales recopilamos, cómo los usamos, con quién los compartimos y cuáles son sus derechos como titular de esos datos.
          </p>
          <p>
            Esta política está redactada en cumplimiento de la <strong>Ley N.° 8968 — Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales</strong> de la República de Costa Rica y sus reglamentos, así como las mejores prácticas internacionales en materia de privacidad.
          </p>

          <h2>2. Responsable del Tratamiento</h2>
          <div className="data-table">
            <table>
              <tbody>
                <tr><td><strong>Nombre</strong></td><td>Open Ai Jobs Search</td></tr>
                <tr><td><strong>País</strong></td><td>República de Costa Rica</td></tr>
                <tr><td><strong>Correo de contacto</strong></td><td>privacy.ai-jobs@tonyml.com</td></tr>
                <tr><td><strong>Categoría</strong></td><td>Plataforma SaaS de búsqueda de empleo</td></tr>
              </tbody>
            </table>
          </div>

          <h2>3. Datos Personales que Recopilamos</h2>
          <h3>3.1 Datos que usted nos proporciona directamente</h3>
          <div className="data-table">
            <table>
              <thead><tr><th>Categoría</th><th>Ejemplos</th></tr></thead>
              <tbody>
                <tr><td><strong>Datos de identificación</strong></td><td>Nombre completo, correo electrónico, contraseña (cifrada)</td></tr>
                <tr><td><strong>Datos profesionales</strong></td><td>Perfil profesional, habilidades, experiencia laboral, educación, proyectos</td></tr>
                <tr><td><strong>Preferencias laborales</strong></td><td>Áreas de interés, ubicaciones, tipo de empleo, pretensión salarial</td></tr>
                <tr><td><strong>API keys de terceros</strong></td><td>Claves de proveedores de IA (almacenadas cifradas)</td></tr>
                <tr><td><strong>Documentos generados</strong></td><td>CVs, cartas de presentación</td></tr>
                <tr><td><strong>Datos de resultados</strong></td><td>Estado de postulaciones, entrevistas, ofertas recibidas</td></tr>
              </tbody>
            </table>
          </div>

          <h3>3.2 Datos recopilados automáticamente</h3>
          <div className="data-table">
            <table>
              <thead><tr><th>Categoría</th><th>Ejemplos</th></tr></thead>
              <tbody>
                <tr><td><strong>Datos de uso</strong></td><td>Páginas visitadas, funciones utilizadas, fecha y hora de acceso</td></tr>
                <tr><td><strong>Datos técnicos</strong></td><td>Dirección IP, tipo de navegador, sistema operativo</td></tr>
                <tr><td><strong>Cookies y tecnologías similares</strong></td><td>Tokens de sesión, preferencias de interfaz</td></tr>
              </tbody>
            </table>
          </div>

          <h3>3.3 Datos de terceros</h3>
          <p>Recopilamos datos de portales de empleo públicos (LinkedIn, Jobbank, Jobindex, etc.) en nombre del Usuario para prestar el Servicio de descubrimiento de empleos. Estos datos se procesan como parte del servicio contratado y <strong>no se venden a terceros</strong>.</p>

          <h2>4. Finalidades del Tratamiento</h2>
          <div className="data-table">
            <table>
              <thead><tr><th>Finalidad</th><th>Base legal</th></tr></thead>
              <tbody>
                <tr><td>Crear y gestionar su cuenta</td><td>Ejecución de contrato</td></tr>
                <tr><td>Prestar los servicios contratados</td><td>Ejecución de contrato</td></tr>
                <tr><td>Autenticar su identidad y garantizar la seguridad</td><td>Interés legítimo / obligación legal</td></tr>
                <tr><td>Enviar comunicaciones transaccionales</td><td>Ejecución de contrato</td></tr>
                <tr><td>Mejorar y desarrollar la Plataforma</td><td>Interés legítimo</td></tr>
                <tr><td>Cumplir obligaciones legales y regulatorias</td><td>Obligación legal</td></tr>
                <tr><td>Enviar comunicaciones de marketing</td><td>Consentimiento</td></tr>
              </tbody>
            </table>
          </div>
          <p><strong>No utilizamos sus datos para entrenar modelos de inteligencia artificial propios ni de terceros.</strong></p>

          <h2>5. Almacenamiento y Seguridad de los Datos</h2>
          <h3>5.1 Cifrado</h3>
          <ul>
            <li>Las contraseñas se almacenan como hash irreversible (bcrypt).</li>
            <li>Las API keys de proveedores de IA se cifran en reposo mediante cifrado simétrico antes de ser guardadas.</li>
            <li>La comunicación entre su navegador y nuestros servidores utiliza TLS (HTTPS).</li>
          </ul>
          <h3>5.2 Medidas de seguridad</h3>
          <ul>
            <li>Control de acceso basado en roles.</li>
            <li>Registros de auditoría (<em>audit logs</em>).</li>
            <li>Monitoreo continuo de anomalías.</li>
            <li>Procedimientos de respuesta ante incidentes de seguridad.</li>
          </ul>
          <h3>5.3 Retención</h3>
          <p>Conservamos sus datos mientras su cuenta esté activa y durante el período necesario para cumplir obligaciones legales. Tras la eliminación de su cuenta, sus datos son eliminados o anonimizados en un plazo máximo de <strong>90 días</strong>, salvo que la ley requiera una retención mayor.</p>

          <h2>6. Compartición de Datos con Terceros</h2>
          <p>No vendemos, alquilamos ni compartimos sus datos personales con terceros para fines comerciales ajenos al Servicio. Podemos compartir datos en las siguientes circunstancias limitadas:</p>
          <div className="data-table">
            <table>
              <thead><tr><th>Tercero</th><th>Propósito</th><th>Datos compartidos</th></tr></thead>
              <tbody>
                <tr><td>Proveedores de IA (OpenAI, Anthropic, NVIDIA, OpenRouter)</td><td>Generación de contenido</td><td>Fragmentos de perfil y descripciones de empleo</td></tr>
                <tr><td>Infraestructura cloud (Fly.io)</td><td>Hospedaje y almacenamiento</td><td>Datos cifrados</td></tr>
                <tr><td>Autoridades competentes</td><td>Cumplimiento de órdenes judiciales</td><td>Solo lo estrictamente requerido</td></tr>
              </tbody>
            </table>
          </div>

          <h2>7. Cookies y Tecnologías Similares</h2>
          <div className="data-table">
            <table>
              <thead><tr><th>Tipo</th><th>Finalidad</th><th>¿Se pueden desactivar?</th></tr></thead>
              <tbody>
                <tr><td><strong>Esenciales</strong></td><td>Autenticación, seguridad de sesión</td><td>No (necesarias para el Servicio)</td></tr>
                <tr><td><strong>Funcionales</strong></td><td>Preferencias de idioma e interfaz</td><td>No aplica (almacenadas localmente)</td></tr>
                <tr><td><strong>Analíticas</strong></td><td>Entender el uso de la Plataforma</td><td>Sí, mediante configuración del navegador</td></tr>
              </tbody>
            </table>
          </div>
          <p>No utilizamos cookies de publicidad o seguimiento de comportamiento entre sitios.</p>

          <h2>8. Derechos del Titular de los Datos</h2>
          <p>Conforme a la Ley N.° 8968 de Costa Rica, usted tiene derecho a:</p>
          <div className="data-table">
            <table>
              <thead><tr><th>Derecho</th><th>Descripción</th></tr></thead>
              <tbody>
                <tr><td><strong>Acceso</strong></td><td>Solicitar una copia de los datos personales que tenemos sobre usted</td></tr>
                <tr><td><strong>Rectificación</strong></td><td>Corregir datos inexactos o incompletos</td></tr>
                <tr><td><strong>Cancelación (eliminación)</strong></td><td>Solicitar la eliminación de sus datos cuando ya no sean necesarios</td></tr>
                <tr><td><strong>Oposición</strong></td><td>Oponerse al tratamiento de sus datos para fines específicos</td></tr>
                <tr><td><strong>Portabilidad</strong></td><td>Recibir sus datos en formato estructurado y legible por máquina</td></tr>
                <tr><td><strong>Revocación del consentimiento</strong></td><td>Retirar su consentimiento en cualquier momento</td></tr>
              </tbody>
            </table>
          </div>
          <p>Para ejercer cualquiera de estos derechos, escriba a: <a href="mailto:privacy.ai-jobs@tonyml.com">privacy.ai-jobs@tonyml.com</a>. Responderemos su solicitud en un plazo máximo de <strong>10 días hábiles</strong>.</p>

          <h2>9. Menores de Edad</h2>
          <p>La Plataforma no está dirigida a personas menores de 18 años. No recopilamos intencionalmente datos de menores de edad.</p>

          <h2>10. Transferencias Internacionales de Datos</h2>
          <p>Al utilizar proveedores de IA internacionales (como OpenAI, Anthropic, NVIDIA — todos con sede en EE. UU.), parte de sus datos pueden ser procesados fuera de Costa Rica. Cuando esto ocurre, mantenemos acuerdos contractuales con dichos proveedores que exigen estándares de protección equiparables a los de la legislación costarricense.</p>

          <h2>11. Notificación de Brechas de Seguridad</h2>
          <p>En caso de una brecha de seguridad que afecte sus datos personales, le notificaremos a través del correo electrónico registrado en su cuenta, en el menor tiempo posible y dentro de los plazos establecidos por la legislación costarricense.</p>

          <h2>12. Cambios a esta Política</h2>
          <p>Podemos actualizar esta Política periódicamente. Le notificaremos los cambios materiales mediante publicación en la Plataforma y notificación por correo electrónico. El uso continuado de la Plataforma tras la publicación de cambios constituye aceptación de la nueva Política.</p>

          <h2>13. Autoridad de Control</h2>
          <p>
            La entidad competente para la protección de datos personales en Costa Rica es la <strong>Agencia de Protección de Datos de los Habitantes (Prodhab)</strong>.
          </p>
          <ul>
            <li>Sitio web: <a href="https://www.prodhab.go.cr" target="_blank" rel="noopener noreferrer">www.prodhab.go.cr</a></li>
            <li>Teléfono: (506) 2539-6240</li>
            <li>Dirección: San José, Costa Rica</li>
          </ul>

          <h2>14. Contacto</h2>
          <p>
            <strong>Open Ai Jobs Search — Oficial de Protección de Datos</strong><br />
            Correo electrónico: <a href="mailto:privacy.ai-jobs@tonyml.com">privacy.ai-jobs@tonyml.com</a><br />
            República de Costa Rica
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-[#d2d2d7] flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            href="/terms"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#0068d2] transition-all"
          >
            Ver Términos de Servicio →
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] px-5 py-2.5 text-[13px] font-medium text-[#474747] hover:border-[#0071e3]/40 transition-all"
          >
            Crear cuenta
          </Link>
        </div>
      </section>

      <style jsx global>{`
        .prose-legal h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1d1d1f;
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e2e2e5;
        }
        .prose-legal h3 {
          font-size: 15px;
          font-weight: 600;
          color: #1d1d1f;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .prose-legal p {
          font-size: 15px;
          color: #474747;
          line-height: 1.75;
          margin-bottom: 1rem;
        }
        .prose-legal ul {
          margin: 0.75rem 0 1rem 1.25rem;
          list-style: disc;
        }
        .prose-legal li {
          font-size: 15px;
          color: #474747;
          line-height: 1.75;
          margin-bottom: 0.25rem;
        }
        .prose-legal strong { color: #1d1d1f; font-weight: 600; }
        .prose-legal em { color: #707070; font-style: italic; }
        .prose-legal a { color: #0066cc; text-decoration: underline; }
        .prose-legal a:hover { color: #004499; }
        .data-table { overflow-x: auto; margin: 1rem 0 1.5rem; border-radius: 10px; border: 1px solid #e2e2e5; }
        .data-table table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .data-table th { background: #f5f5f7; padding: 10px 14px; text-align: left; font-weight: 600; color: #1d1d1f; border-bottom: 1px solid #e2e2e5; }
        .data-table td { padding: 9px 14px; color: #474747; border-bottom: 1px solid #f0f0f2; }
        .data-table tr:last-child td { border-bottom: none; }
      `}</style>
    </main>
  )
}
