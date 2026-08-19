# CVMeld — Frontend

> Crea tu CV una vez. Adáptalo a cada oferta. Con IA.

Interfaz web de CVMeld: búsqueda de empleo, CV base y adaptado, compatibilidad con ofertas, postulaciones, entrevistas y desarrollo de habilidades en un flujo guiado.

**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · next-intl · React Query · Three.js · OpenNext (Cloudflare Workers).

## Quick start

```bash
pnpm install
pnpm dev
```

Requiere Node 20+ y pnpm. La app queda en `http://localhost:3000`.

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Comandos

```bash
pnpm lint       # ESLint
npx tsc --noEmit # Typecheck
pnpm build      # Build de producción
pnpm test:e2e   # Playwright
pnpm deploy     # OpenNext → Cloudflare Workers
```

## Estructura

```
app/        rutas y páginas (marketing, app, admin, auth)
components/ UI y secciones de producto
messages/   traducciones en/es
lib/        cliente API y SEO
content/    blog por idioma
public/     assets y documentos legales
```

Producción: [cvmeld.tonyml.com](https://cvmeld.tonyml.com) · Backend: [api.cvmeld.tonyml.com](https://api.cvmeld.tonyml.com)