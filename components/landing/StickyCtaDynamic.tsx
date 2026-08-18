'use client'

import dynamic from 'next/dynamic'

// Wrapper browser-only: StickyCta se carga como chunk lazy del cliente,
// fuera del RSC payload (sin module id de StickyCta en el flight data →
// imposible el mismatch servidor/cliente "Cannot read properties of
// undefined (reading 'call')"). El wrapper en sí es trivial y no usa
// APIs del browser; el componente real se carga solo en el cliente.
// `ssr: false` dentro de Server Components no está permitido en
// próxima versión -> por eso este archivo es 'use client'.
const StickyCta = dynamic(
  () => import('./StickyCta').then((m) => m.StickyCta),
  { ssr: false },
)

export function StickyCtaDynamic() {
  return <StickyCta />
}