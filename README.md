# CVMeld — Frontend

Frontend web de CVMeld: crea un CV base, adáptalo a cada oferta y acompaña el proceso con búsqueda, compatibilidad, postulaciones, entrevistas y desarrollo de habilidades.

## Stack

- Next.js App Router 15.5, React 19.2 y TypeScript
- Tailwind CSS 4, `next-intl` (`en`/`es`), React Query y Recharts
- Three.js/React Three Fiber para la landing
- OpenNext + Wrangler para Cloudflare Workers
- Playwright para E2E

## Desarrollo

Requisitos: Node.js 20+ y pnpm.

```bash
pnpm install
pnpm dev
```

La aplicación queda en `http://localhost:3000`. Crea `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

## Comandos

```bash
pnpm lint
npx tsc --noEmit
pnpm build
pnpm test:e2e
pnpm preview
pnpm deploy
```

## Rutas principales

- `/en` y `/es`: landing
- `/en/about`, `/en/limits`, `/en/privacy`, `/en/terms`: páginas públicas
- `/en/blog` y `/es/blog`: contenido SEO
- `/cv-builder`: creación y adaptación de CV
- `/search`: búsqueda de ofertas
- `/rank`: compatibilidad con ofertas
- `/apply`: postulaciones y documentos
- `/interview`: preparación y simulaciones
- `/expand` y `/upskill`: habilidades y aprendizaje
- `/dashboard`, `/profile`, `/settings` y `/admin`

## Configuración pública

`wrangler.jsonc` define actualmente:

- `NEXT_PUBLIC_APP_URL=https://cvmeld.tonyml.com`
- `NEXT_PUBLIC_API_URL`: URL pública del backend
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`: código real de Search Console cuando exista

El dominio temporal es [cvmeld.tonyml.com](https://cvmeld.tonyml.com). La metadata, canonical, `hreflang`, sitemap y robots se centralizan en `lib/seo.ts`, `app/sitemap.ts` y `app/robots.ts`. La imagen OG está en `public/og/cvmeld-og.svg`.

## Estructura útil

```text
app/                    rutas Next.js
components/             UI y secciones de producto
content/blog/            artículos por idioma
hooks/                   hooks reutilizables
lib/api.ts              cliente REST autenticado
lib/seo.ts              metadata y SEO
messages/               traducciones en/es
public/                 assets y documentos legales
wrangler.jsonc          configuración Cloudflare
```

El backend separado se ejecuta en `http://localhost:8000`; consulta su README para instalarlo.
