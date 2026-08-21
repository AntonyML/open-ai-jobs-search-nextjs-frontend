import type { ReactNode } from 'react'

type FaqItem = { question: string; answer: string }

const es: FaqItem[] = [
  ['¿Qué es un CV listo para ATS y por qué importa?', 'Un CV listo para ATS está formateado para pasar los filtros automáticos que usan las empresas antes de que un humano lo lea.'],
  ['¿Cómo adapta la IA mi CV a cada oferta de trabajo?', 'La IA analiza la descripción del puesto, extrae los requisitos clave y reorganiza lo que ya tienes para que coincida con la oferta.'],
  ['¿Cuántos créditos necesito para postularme a un trabajo?', 'Generar un CV base cuesta 1 crédito y adaptarlo a una oferta cuesta 1 crédito. Free ofrece 2 por semana, Pro 80 por mes y Max 350 por mes.'],
  ['¿Los créditos se acumulan de un mes a otro?', 'No. Los créditos no usados expiran al renovar el período.'],
  ['¿Puedo comprar créditos extra si se me acaban?', 'Sí. Hay packs de 50 créditos por $9.99 y 120 créditos por $19.99 para Pro y Max.'],
  ['¿Qué pasa con mi suscripción si cancelo?', 'Sigue activa hasta el final del período pagado. No pierdes los días que ya pagaste.'],
  ['¿Ofrecen reembolsos?', 'Los reembolsos mensuales aplican si usaste menos de 16 créditos. Los planes anuales tienen 14 días de garantía.'],
  ['¿Mis datos se usan para entrenar modelos de IA?', 'No. Tus datos personales, CVs y cartas no se usan para entrenar modelos de IA.'],
  ['¿Qué es el match score y cómo se calcula?', 'Es una puntuación que indica qué tan bien encaja tu perfil con una oferta específica.'],
  ['¿Qué diferencia hay entre los planes Pro y Max?', 'Pro se enfoca en generar y adaptar CVs. Max añade ranking, postulaciones, preparación de entrevistas, Expand y Upskill.'],
  ['¿Funciona para buscar trabajo en Costa Rica y LATAM?', 'Sí. Funciona con ofertas de cualquier país y genera CVs en español e inglés.'],
  ['¿Qué pasa si la IA falla al generar mi CV?', 'Usamos múltiples proveedores. Si todos fallan, el crédito se devuelve a tu balance.'],
].map(([question, answer]) => ({ question, answer }))

const en: FaqItem[] = es.map((item) => item)

export function getFaqItems(locale: string): FaqItem[] {
  return locale === 'en' ? en : es
}

export function FAQ({ locale = 'es' }: { locale?: string }): ReactNode {
  const items = getFaqItems(locale)
  return (
    <section id="faq" aria-labelledby="faq-heading" className="border-t border-[#d2d2d7] bg-white px-4 py-10 sm:px-6 sm:py-14 md:py-24">
      <div className="mx-auto max-w-[720px]">
        <h2 id="faq-heading" className="text-balance text-center text-[22px] font-semibold leading-tight tracking-tight text-[#1d1d1f] sm:text-[28px] md:text-[34px]">
          {locale === 'en' ? 'Frequently asked questions' : 'Preguntas frecuentes'}
        </h2>
        <div className="mt-5 divide-y divide-[#d2d2d7] sm:mt-8">
          {items.map((item) => (
            <details key={item.question} className="group py-3 sm:py-4 md:py-5">
              <summary className="cursor-pointer list-none pr-6 text-[14px] font-medium text-[#1d1d1f] transition-colors hover:text-[#0071e3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0071e3] sm:pr-8 sm:text-[15px]">
                {item.question}
              </summary>
              <p className="mt-2 text-pretty text-[13px] leading-relaxed text-[#707070] sm:mt-3 sm:text-[14px] sm:leading-6">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
