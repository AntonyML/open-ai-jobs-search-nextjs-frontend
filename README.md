# Open Ai Jobs Search — Frontend

> **Open Ai Jobs Search** es una estación de trabajo para tu búsqueda de empleo: desde tu perfil genera CVs listos para ATS, rankea ofertas por fit, adapta CV y carta a cada postulación, prepara entrevistas y sugiere aprendizaje — con créditos y planes (Free / Pro / Max).

Este repositorio es **el frontend** (Next.js 15 + React 19 + Tailwind CSS v4). Toda la lógica de negocio vive en un backend FastAPI separado al que este cliente llama vía REST y WebSocket.

**Diseño:** Inspirado en Apple — blanco, tipografía SF Pro, azul `#0071e3` como único color de acción, superficies diferenciadas por color en vez de elevación. La landing usa escenas **Three.js (React Three Fiber)** con reveal on scroll, pausables fuera de viewport y con respeto a `prefers-reduced-motion`.

**i18n:** Soporte completo multi-idioma (inglés y español) con detección automática, routing basado en locale (`/[locale]/...`), y +550 claves de traducción por idioma.

---

## Repositorios del ecosistema

Open Ai Jobs Search es un **sistema multi-repositorio**: el proyecto completo
está compuesto por 4 repositorios que comparten la base de datos (Supabase).

| Repositorio | Rol | Puerto |
|---|---|---|
| [**Frontend (Next.js)**](https://github.com/AntonyML/open-ai-jobs-search-nextjs-frontend) | UI de usuario — **este repo** | `:3000` |
| [**Backend FastAPI**](https://github.com/AntonyML/open-ai-jobs-search-FastAPI-backend) | API principal + LLM Orchestrator + billing/créditos | `:8000` |
| [**Microservicio de Ingesta**](https://github.com/AntonyML/open-ai-jobs-search-microservice-searchjobs-backend) | Telegram → `ingested_jobs` (sin LLM) | `:8001` |
| [**Microservicio de Ranking**](https://github.com/AntonyML/open-ai-jobs-search-microservice-rankjobs-backend) | Cola de ranking con LLM (LOAD/RANK/SAVE) | `:8002` |

---

## Tabla de contenidos

- [Repositorios del ecosistema](#repositorios-del-ecosistema)
- [Planes y créditos](#planes-y-créditos)
- [Stack técnico](#stack-técnico)
- [Páginas y rutas](#páginas-y-rutas)
- [Flujo del usuario](#flujo-del-usuario)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Landing 3D](#landing-3d)
- [LLM Control Center](#llm-control-center)
- [Sistema de diseño](#sistema-de-diseño)
- [i18n — Internacionalización](#i18n--internacionalización)
- [Accesibilidad](#accesibilidad)
- [Puesta en marcha](#puesta-en-marcha)
- [Conexión con el backend](#conexión-con-el-backend)
- [Testing](#testing)
- [Deployment](#deployment)
- [Decisiones de diseño](#decisiones-de-diseño)

---

## Planes y créditos

El producto usa un modelo de **créditos + planes** (no suscripciones de pago únicas):

| Plan | Precio | Créditos | Acceso |
|---|---|---|---|
| **Free** | $0 | 2 por semana (renuevan cada 7 días, no acumulan) | CV base + CV adaptado |
| **Pro** | $19.99/mes o $199/año | 100 por mes | CV builder completo (base + adaptado + match score + PDFs ATS) |
| **Max** | $59.99/mes o $599/año | 500 por mes | Todo Pro + todas las funciones de búsqueda (ofertas, ranking, postulaciones, entrevistas, expand, upskill) |

- **Costo por acción:** 1 crédito por CV base, 1 por CV adaptado, 1 por acción de búsqueda (configurable por admin).
- **Cuotas de uso Max:** 20 acciones al día · 80 por semana (nada es ilimitado).
- **Detalle público:** página `/limits` con la tabla completa, enlazada desde el pricing y el footer.
- **Flujo de pago:** manual (SINPE / WhatsApp) — `POST /billing/purchase` notifica al admin, que activa la suscripción desde el panel.

---

## Stack técnico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Framework** | Next.js (App Router) | ^15.5 |
| **UI** | React | ^19.2 |
| **Lenguaje** | TypeScript (strict) | ^5 |
| **Estilos** | Tailwind CSS v4 + tw-animate-css | ^4 |
| **3D** | three + @react-three/fiber + @react-three/drei | ^0.17x / ^9 / ^10 |
| **Componentes** | shadcn/ui (base-nova) + @base-ui/react | ^4.13 / ^1.6 |
| **Iconos** | lucide-react | ^1.24 |
| **Gráficos** | recharts | ^3.8 |
| **i18n** | next-intl | ^4.13 |
| **Notificaciones** | react-hot-toast | ^2.6 |
| **Markdown** | react-markdown + remark-gfm | ^10 / ^4 |
| **Sonido** | cuelume (2KB, sin archivos de audio) | ^0.1 |
| **Fechas** | date-fns | ^4.4 |
| **Utilidades** | clsx + tailwind-merge + class-variance-authority | latest |
| **Linting** | ESLint v9 + eslint-config-next | ^16 |
| **Deploy** | @opennextjs/cloudflare + wrangler | ^1.20 / ^4.110 |
| **Gestor** | pnpm | — |

---

## Páginas y rutas

### Públicas (marketing)

| Ruta | Página |
|------|--------|
| `/` | Landing page (Hero 3D, Stats, Features, Pricing, CTA 3D) |
| `/about` | Sobre el proyecto (historia, solución, stack) |
| `/limits` | Límites de uso y comparativa de planes |
| `/privacy` | Política de privacidad (Ley 8968 de Costa Rica) |
| `/terms` | Términos de servicio |
| `/login` | Inicio de sesión |
| `/register` | Registro con modal de términos |

### Autenticadas

| Ruta | Página |
|------|--------|
| `/dashboard` | Dashboard principal (stats, funnel chart, progreso) |
| `/analytics` | Analíticas (funnel, tasas de conversión, distribución) |
| `/admin` | Administración de usuarios (CRUD, roles, tiers) |
| `/admin/providers` | Catálogo global de proveedores IA |
| `/admin/plans` | Catálogo de planes (precios, créditos, cuotas) |
| `/admin/credits` | Ajuste manual de créditos y costos por acción |
| `/profile` | Perfil de usuario + configuración de accesibilidad |
| `/settings` | Configuración completa (5 tabs: apariencia, notificaciones, idioma, proveedores, seguridad) |

### Flujo de búsqueda (plan Max)

| Ruta | Descripción |
|------|-------------|
| `/candidate` | Perfil candidato + conductual (DISC) + ejemplos STAR |
| `/cv-builder` | **CV Builder**: CV base + adaptado por oferta, match score, PDFs ATS |
| `/search` | Búsqueda de empleos — jobs de `ingested_jobs`, alimentada por el microservicio de ingesta |
| `/rank` | Evaluación y ranking de ofertas con orquestación multi-proveedor |
| `/apply` | Generación CV + cover letter por oferta (flujo drafter-reviewer-revise, PDF con Typst) |
| `/interview` | Prep pack + mock interview (chat interactivo) |
| `/outcome` | Tracker de resultados + calibración de fit |
| `/expand` | Expansión de competencias desde fuentes públicas |
| `/upskill` | Análisis de gaps + plan de aprendizaje |
| `/scrape` | **Legacy** — página antigua de búsqueda (redirige a `/search`) |

---

## Flujo del usuario

```mermaid
flowchart LR
  A[Landing / About / Pricing] --> B[Login / Register]
  B --> C[Setup]
  C --> D[CV Builder: base + adaptado]
  D --> E[Search]
  E --> F[Rank]
  F --> G[Apply: CV + carta]
  G --> H[Interview]
  H --> I[Outcome]
  C --> J[Perfil conductual + STAR]
  F --> K[Upskill]
  F --> L[Expand]
```

1. **Landing**: el usuario llega a `/`, ve la propuesta (3D + pricing honesto).
2. **Login/Register**: crea cuenta o inicia sesión. JWT se guarda en `localStorage`.
3. **Setup**: construye su perfil (datos personales, experiencia, skills, perfil conductual DISC, ejemplos STAR).
4. **CV Builder**: genera su CV base listo para ATS y lo adapta a cada oferta con match score.
5. **Search**: busca empleos en `ingested_jobs` (alimentada por el microservicio de ingesta desde Telegram), con polling del estado.
6. **Rank**: la IA + analizador determinista evalúan y ordenan las ofertas.
7. **Apply**: genera CV + cover letter por oferta (JSON) con el flujo drafter-reviewer-revise, compilados a PDF con **Typst**.
8. **Interview**: preparación personalizada + mock interview (chat interactivo).
9. **Outcome**: registra resultados (entrevista, oferta, rechazo) y calibra el fit.
10. **Upskill** (opcional): análisis de gaps de skills + plan de aprendizaje.
11. **Expand** (opcional): enriquece perfil desde fuentes públicas.

---

## Estructura del proyecto

```
app/
├── [locale]/                        # Dynamic locale segment
│   ├── layout.tsx                   # NextIntlClientProvider, AccessibilityProvider, SoundProvider
│   ├── (marketing)/                 # Páginas públicas
│   │   ├── layout.tsx               # Navbar + Footer
│   │   ├── page.tsx                 # Landing (Hero → Features → Pricing → CTA)
│   │   ├── about/page.tsx           # Sobre el proyecto
│   │   ├── limits/page.tsx          # Límites de uso (tabla de planes)
│   │   ├── privacy/page.tsx         # Política de privacidad
│   │   └── terms/page.tsx           # Términos de servicio
│   ├── (auth)/                      # Autenticación
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (app)/                       # Rutas autenticadas
│       ├── layout.tsx               # Auth guard + AppSidebar + LLMControlCenter
│       ├── dashboard/page.tsx
│       ├── analytics/page.tsx
│       ├── admin/                   # Users + providers + plans + credits
│       ├── profile/page.tsx
│       ├── settings/page.tsx        # 5 tabs
│       └── setup/ search/ rank/ apply/ interview/ outcome/ expand/ upskill/
├── globals.css                      # Apple design tokens + a11y overrides
└── layout.tsx                       # Layout raíz

components/
├── LLMControlCenter.tsx             # Sidebar derecha sticky (proveedores, modelos, cola, métricas)
├── AppSidebar.tsx                   # Menú lateral (compone navigation/)
├── navigation/                      # Config + estado + ítems del sidebar
├── Navbar.tsx                       # Barra superior (links de marketing en rutas públicas)
├── Footer.tsx                       # Footer de 3 columnas (Producto / Recursos / Legal)
├── LegalStyles.tsx                  # Estilos compartidos de páginas legales
├── LanguageSwitcher.tsx             # Toggle EN/ES
├── AccessibilityProvider.tsx        # Aplica settings de accesibilidad al mount
├── AccessibilitySettings.tsx        # Controles UI de accesibilidad
├── SoundProvider.tsx                # Inicializa sonidos cuelume
├── NotificationBell.tsx             # Campana con historial de notificaciones
├── TermsModal.tsx                   # Modal de términos (registro)
├── UpgradeModal.tsx                 # Modal de upgrade/compra
├── UpgradeListener.tsx              # Escucha eventos 402
├── landing/                         # Secciones de la landing (Hero, Stats, Features, Pricing, CTA)
├── about/                           # Secciones de about
├── three/                           # Infraestructura 3D (SceneCanvas, SceneDynamic, escenas)
├── ui/                              # Componentes base (button, card, input, chart, sidebar, etc.)

hooks/
├── use-in-view.ts                   # Reveal on scroll (IntersectionObserver, one-shot)
├── use-mobile.ts                    # Detección de breakpoint móvil (768px)
└── useUsageLimits.ts                # Límites de uso free/premium

lib/
├── api.ts                           # Cliente HTTP con auth automática + manejo 402
├── auth.ts                          # Helpers de JWT (localStorage, decode, features)
├── billing.ts                       # Cliente del catálogo de planes/créditos
├── orchestrator.ts                  # WebSocket + HTTP polling para LLM Control Center
├── accessibility.ts                 # Settings de accesibilidad
├── notifications.ts                 # Historial de notificaciones
└── ...
```

---

## Landing 3D

La landing pública usa **React Three Fiber** como capa visual, con reglas estrictas:

- **Un solo canvas activo por sección** (`SceneCanvas` + `SceneDynamic`), montado bajo demanda y congelado (`frameloop='never'`) cuando sale del viewport, la pestaña se oculta o el usuario prefiere `prefers-reduced-motion`.
- **Escenas claras sobre fondo blanco**: blending NORMAL (el aditivo desaparece sobre blanco), partículas azules `#0071e3`/cyan, sin tocar la paleta.
- **Fallback sin WebGL**: placeholder transparente — nunca un gradiente intrusivo.
- **Densidades calibradas**: Hero ≤800 partículas, Pricing ≤280, CTA ≤220, con `dpr` adaptativo (PerformanceMonitor).
- **Secciones con reveal**: fade + rise + blur con stagger (animation-delay + fill-mode), via `hooks/use-in-view.ts`.

Escenas: `HeroParticles` (constelación del hero), `PricingGlow` (núcleo + doble anillo + polvo), `CtaAurora` (cierre).

---

## LLM Control Center

El **LLM Control Center** es una sidebar derecha sticky, siempre visible durante el flujo de búsqueda. Muestra en tiempo real:

### Estado general
- Proveedor activo actual + modelo
- Salud del proveedor (healthy / degraded / down)
- Estado de la cola (running / paused / idle)
- Workers activos

### Sección de proveedores
- Todos los proveedores configurados con estado, latencia, tasa de éxito, contador de 429s, cooldown
- Botón toggle para habilitar/deshabilitar

### Sección de modelos
- Modelos dinámicos por proveedor
- Estado de cada modelo (READY / BUSY / COOLDOWN / DISABLED)

### Vista de cola
- Jobs en cola con estados (queued, running, completed, failed, retrying, rate_limited)
- Click para ver detalle de cada job

### Controles
- Pausar / Reanudar cola
- Cancelar job específico
- Reintentar jobs fallidos
- Limpiar cola

### Métricas
- Latencia promedio, requests/minuto, jobs completados, tiempo restante estimado

### Polling adaptativo
- Running: 1 segundo · Waiting: 5 segundos · Idle: 15 segundos · Completed: se detiene

---

## Sistema de diseño

Sistema de diseño inspirado en Apple:

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-apple-blue` | `#0071e3` | Único color de acción (botones filled) |
| `--color-link-blue` | `#0066cc` | Bordes outlined, links |
| `--color-signal-blue` | `#2997ff` | Decorativo, iconos |
| `--color-carbon` | `#1d1d1f` | Texto primario |
| `--color-frost` | `#f5f5f7` | Canvas de página |
| `--font-sf-pro-display` | SF Pro Display | Headlines (40px+) |
| `--font-sf-pro-text` | SF Pro Text | Body, nav, botones |
| `--radius-buttons` | `980px` | Botones completamente redondeados |
| `--radius-cards` | `8px` | Todas las cards |

El diseño escala según la configuración de accesibilidad del usuario (tamaño de fuente, alto contraste, animaciones reducidas, fuente legible, densidad).

---

## i18n — Internacionalización

- **Idiomas**: inglés (`en`) y español (`es`)
- **Detección**: automática vía navegador, `as-needed` prefix (se omite `/en/`)
- **Routing**: middleware next-intl en todas las rutas no-API y no-static
- **Claves**: +550 por idioma en `messages/{locale}.json` (namespaces: common, nav, auth, marketing, about, features, providers, dashboard, settings, accessibility, billing, limits, footer, …)
- **Paridad**: `node scripts/audit-i18n.cjs` valida que en/es tengan las mismas claves

---

## Accesibilidad

Configuración persistente en `localStorage`:

- **Tamaño de letra**: pequeño / mediano / grande / extra grande
- **Alto contraste**: activa modo de alto contraste
- **Animaciones reducidas**: respeta `prefers-reduced-motion` (+ las escenas 3D se congelan)
- **Fuente legible**: fuente opcional para dislexia
- **Densidad**: cómoda / compacta

---

## Puesta en marcha

### Requisitos previos

- Node.js 20+
- [pnpm](https://pnpm.io) (`npm i -g pnpm`)
- Backend de Open Ai Jobs Search corriendo (por defecto en `http://localhost:8000`)

### Instalación

```bash
pnpm install
```

### Variables de entorno

Crea `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Desarrollo

```bash
pnpm dev
# → http://localhost:3000
```

### Build y producción

```bash
pnpm build
pnpm start
```

### Lint + TypeScript

```bash
pnpm lint
npx tsc --noEmit     # 0 errors esperados
```

---

## Conexión con el backend

El frontend consume la API REST de Open Ai Jobs Search (FastAPI backend).

- **URL base:** `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- **Autenticación:** JWT en `localStorage` (`access_token`), inyectado en cada request por `apiFetch()`
- **HTTP 402:** dispara evento `purchase:required` → muestra UpgradeModal
- **Polling adaptativo:** el LLM Control Center usa hooks de `lib/orchestrator.ts` con frecuencias variables según el estado
- **Progreso:** se guarda en `localStorage` por usuario (`completed_steps:<hash>`)

### Endpoints consumidos

| Sección | Endpoints |
|---------|-----------|
| Auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/password`, `DELETE /auth/account` |
| Billing | `GET /billing/status`, `GET /billing/catalog`, `GET /billing/transactions`, `POST /billing/purchase` |
| Providers | `GET /providers/`, `POST /providers/`, `GET /providers/me`, `PUT /providers/active`, `POST /providers/test` |
| Setup | `POST /setup/profile`, `GET /setup/profile`, `PUT /setup/behavioral-profile`, `POST /setup/star-examples` |
| CV Builder | CV base + adaptado (créditos, match score, PDFs ATS) |
| Jobs (ingesta) | `POST /jobs/search`, `GET /jobs/search/{id}/status` |
| Rank | `POST /rank/`, `GET /rank/jobs`, `GET /rank/jobs/{id}/evaluation` |
| Apply | `POST /apply/`, `GET /apply/`, `GET /apply/{id}`, `GET /apply/{id}/status` |
| Interview | `POST /interview/`, `GET /interview/{id}`, `POST /interview/{id}/mock` |
| Outcome | `POST /outcome/`, `PATCH /outcome/{id}`, `GET /outcome/tracker/rows` |
| Upskill | `POST /upskill/`, `GET /upskill/{id}`, `GET /upskill/` |
| Expand | `POST /expand/`, `GET /expand/{id}` |
| Salary | `POST /profile/salary-data`, `GET /profile/salary-data`, `DELETE /profile/salary-data` |
| Dashboard | `GET /dashboard/stats`, `GET /analytics/funnel` |
| Orchestrator | `GET /orchestrator/queue`, `POST /orchestrator/queue/control`, `GET /orchestrator/providers`, `GET /orchestrator/models`, WS `/orchestrator/ws?token=` |
| Admin | `GET /admin/users`, `PATCH /admin/users/{id}`, `DELETE /admin/users/{id}`, `GET/PUT/DELETE /admin/plans/{key}`, `POST /admin/credits/adjust`, `GET/PUT /admin/credit-costs` |

---

## Testing

```bash
pnpm lint          # ESLint
npx tsc --noEmit   # TypeScript (0 errors)
pnpm build         # Build check
node scripts/audit-i18n.cjs  # Paridad en/es
npx playwright test          # E2E (dev server en :3000)
```

---

## Deployment

El frontend deploya en **Cloudflare Workers** via OpenNext.

```bash
pnpm preview       # Build & preview local
pnpm deploy        # Build & deploy a Cloudflare
```

Configuración en `wrangler.jsonc` y `open-next.config.ts`. Variables de entorno se configuran como secrets de Cloudflare Workers.

---

## Decisiones de diseño

- **Estado en el cliente.** El progreso se guarda en `localStorage` (`completed_steps:<hash>`). Sobrevive a recargas sin backend extra.
- **Landing honesta.** El copy de marketing se audita contra el producto real (planes, créditos, cuotas) — nada de "ilimitado" ni "sin suscripciones".
- **3D como capa visual.** Three.js solo en rutas de marketing, un canvas por sección, congelado fuera de viewport, con fallback sin WebGL y respeto a `prefers-reduced-motion`.
- **Reveal on scroll con animation-delay.** `hooks/use-in-view.ts` + `fill-mode: backwards` (nunca transition-delay, que retrasaría los hovers).
- **LLM Control Center como sidebar independiente.** No interfiere con el contenido principal. Polling adaptativo con fallback a WebSocket.
- **Mensajes de error amigables.** Los errores del orquestador se convierten automáticamente a mensajes legibles.
- **Sonidos UI opcionales.** Feedback auditivo con `cuelume`, respeta `prefers-reduced-motion`.
- **i18n first.** next-intl con routing basado en locale, 550+ claves por idioma y auditoría de paridad.
- **Accesibilidad integrada.** Font scaling, contraste, animaciones reducidas, fuente legible, densidad.
- **Tema claro.** Diseño Apple con fondos blancos/grises y azul como único color de acento.
- **shadcn/ui base-nova.** Estilo base-nova con personalización Apple.
- **recharts para analíticas.** Dashboard y analytics con gráficos de funnel, barras y pie.
