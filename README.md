# 🚀 Career OS — Frontend

> **Career OS** es una estación de trabajo para automatizar tu búsqueda de empleo de principio a fin: desde conectar tu proveedor de IA hasta generar CV/cover letter optimizados para ATS, preparar entrevistas y trackear resultados.

Este repositorio es **el frontend** (Next.js 15 + React 19 + Tailwind CSS v4). Toda la lógica de negocio vive en un backend FastAPI separado al que este cliente llama vía REST y WebSocket.

**Diseño:** Inspirado en Apple — blanco, tipografía SF Pro, azul `#0071e3` como único color de acción, sin sombras, con superficies diferenciadas por color en vez de elevación.

**i18n:** Soporte completo multi-idioma (inglés y español) con detección automática, routing basado en locale (`/[locale]/...`), y 492 claves de traducción por idioma.

---

## Tabla de contenidos

- [¿Qué es Career OS?](#qué-es-career-os)
- [Nuevas secciones](#nuevas-secciones)
- [i18n — Internacionalización](#i18n--internacionalización)
- [Sistema de notificaciones](#sistema-de-notificaciones)
- [Accesibilidad](#accesibilidad)
- [LLM Control Center](#llm-control-center)
- [Dashboard y Analytics](#dashboard-y-analytics)
- [Flujo del usuario](#flujo-del-usuario)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Stack técnico](#stack-técnico)
- [Puesta en marcha](#puesta-en-marcha)
- [Conexión con el backend](#conexión-con-el-backend)
- [Decisiones de diseño](#decisiones-de-diseño)

---

## ¿Qué es Career OS?

Career OS convierte la búsqueda de trabajo en un **pipeline guiado de 7 pasos**. Una barra lateral (StepSidebar) muestra el progreso y desbloquea los siguientes pasos de forma natural.

Además del pipeline, la app incluye:
- **Landing page** con pricing planes y CTA
- **Sobre el proyecto** — descripción del servicio
- **Perfil de usuario** con configuración de accesibilidad (tamaño de letra, alto contraste, animaciones reducidas, fuente legible, densidad)
- **LLM Control Center** — sidebar derecha sticky con monitoreo en tiempo real de proveedores, modelos, cola y métricas

### Página principal (Landing)

```
/ → Hero con tagline + CTA → Pricing → Features → Footer
```

La landing page presenta Career OS como un servicio SaaS con planes en USD:
- **Free**: 10 evaluaciones/mes, modelo estándar
- **Pro**: $29/mes, evaluaciones ilimitadas, modelos premium (Claude, GPT)
- **Enterprise**: $99/mes, APIs dedicadas, soporte prioritario

### Pricing

Los planes están diseñados para cubrir costos de API (OpenRouter para modelos Claude/GPT) y ser competitivos con herramientas como Simplify.jobs, TealHQ y Jobscan.

---

## LLM Control Center

El **LLM Control Center** es una sidebar derecha sticky, siempre visible durante el uso del pipeline. Muestra en tiempo real:

### Estado general
- Proveedor activo actual + modelo
- Salud del proveedor (healthy / degraded / down)
- Estado de la cola (running / paused / idle)
- Workers activos

### Sección de proveedores
- Todos los proveedores configurados con:
  - Estado (🟢 healthy / 🟡 degraded / 🔴 down / ⚪ disabled)
  - Latencia (ms)
  - Tasa de éxito (%)
  - Contador de 429s
  - Cooldown restante
- Botón toggle para habilitar/deshabilitar

### Sección de modelos
- Modelos dinámicos por proveedor
- Modelo activo destacado
- Estado de cada modelo (READY / BUSY / COOLDOWN / DISABLED)

### Vista de cola
- Jobs en cola con estados:
  - ⏳ Queued
  - ▶️ Running
  - ✅ Completed
  - ❌ Failed
  - ⏸ Retrying
  - ⛔ RateLimited
- Click para ver detalle de cada job

### Controles
- Pausar / Reanudar cola
- Cancelar job específico
- Reintentar jobs fallidos
- Limpiar cola

### Métricas
- Latencia promedio
- Requests/minuto
- Jobs completados
- Tiempo restante estimado

### UX de errores
Los errores se muestran como mensajes amigables, nunca stack traces:
> "GLM-5.2 alcanzó rate limit. Enfriando 60s. Cambiando automáticamente a GLM-4.5."

### Polling adaptativo
- Running: 1 segundo
- Waiting: 5 segundos
- Idle: 15 segundos
- Completed: polling se detiene inmediatamente

---

## Flujo del usuario

```mermaid
flowchart LR
  A[Landing / About / Pricing] --> B[Login / Register]
  B --> C[Providers]
  C --> D[Setup]
  D --> E[Scrape]
  E --> F[Rank]
  F --> G[Apply]
  G --> H[Interview]
  H --> I[Outcome]
  D --> J[Perfil conductual + STAR]
  F --> K[Upskill]
  F --> L[Expand]
```

1. **Landing**: el usuario llega a `/`, ve la propuesta de valor y los planes de pricing.
2. **Login/Register**: crea cuenta o inicia sesión. JWT se guarda en `localStorage`.
3. **Providers**: conecta su proveedor de IA (Anthropic, OpenAI, NVIDIA, Groq, OpenRouter, LM Studio…).
4. **Setup**: construye su perfil (datos personales, experiencia, skills, **perfil conductual DISC**, **ejemplos STAR**).
5. **Scrape**: lanza búsquedas en portales de empleo.
6. **Rank**: la IA + analizador determinista evalúan y ordenan las ofertas.
7. **Apply**: genera CV + cover letter en LaTeX con el pipeline drafter-reviewer-revise.
8. **Interview**: preparación personalizada + **mock interview** (chat interactivo con IA como entrevistador).
9. **Outcome**: registra resultados (entrevista, oferta, rechazo).
10. **Upskill** (opcional): análisis de gaps de skills + plan de aprendizaje.
11. **Expand** (opcional): enriquece perfil desde fuentes públicas.

---

## Nuevas secciones

### Landing Page (`/`)
- Hero con tagline + demostración visual
- Pricing cards en USD (Free / Pro / Enterprise)
- Features grid

### Sobre el proyecto (`/about`)
- Descripción del servicio (privado, de paga)
- Tecnologías usadas
- Roadmap

### Perfil de usuario (`/profile`)
- Datos de la cuenta
- **Configuración de accesibilidad**:
  - Tamaño de letra (pequeño / mediano / grande / extra grande)
  - Alto contraste
  - Animaciones reducidas
  - Fuente legible (opcional)
  - Densidad de interfaz (cómoda / compacta)

### Pricing (`/pricing`)
- Plan Free: funcionalidad básica, 10 evaluaciones/mes
- Plan Pro ($29/mes): evaluaciones ilimitadas, modelos premium (Claude Sonnet, GPT-4o via OpenRouter)
- Plan Enterprise ($99/mes): APIs dedicadas, soporte prioritario, modelos exclusivos

---

## Estructura del proyecto

```
app/
├── layout.tsx                     # Layout raíz (metadata + globals.css)
├── page.tsx                        # Landing page (hero + pricing + features + footer)
├── globals.css                     # Tokens CSS Apple + Tailwind v4 @theme
├── (app)/                          # Rutas autenticadas (con StepSidebar + LLM Control Center)
│   ├── layout.tsx                  # Guard de auth + StepSidebar + LLMControlCenter
│   ├── about/page.tsx              # Sobre el proyecto
│   ├── pricing/page.tsx            # Planes y precios
│   ├── profile/page.tsx            # Perfil de usuario + accesibilidad
│   ├── providers/page.tsx          # Paso 1: configuración de proveedor IA
│   ├── setup/page.tsx              # Paso 2: perfil candidato + conductual + STAR
│   ├── scrape/page.tsx             # Paso 3: búsqueda de ofertas
│   ├── rank/page.tsx               # Paso 4: ranking con LLM Control Center integrado
│   ├── apply/page.tsx              # Paso 5: generación de CV + carta
│   ├── interview/page.tsx          # Paso 6: prep + mock interview (chat interactivo)
│   └── outcome/page.tsx            # Paso 7: tracker de resultados
└── (auth)/                         # Rutas públicas
    ├── login/page.tsx
    └── register/page.tsx

components/
├── LLMControlCenter.tsx            # Sidebar derecha sticky (proveedores, modelos, cola, métricas)
├── PipelinePage.tsx                # Formulario reutilizable para pasos del pipeline
├── StepSidebar.tsx                 # Navegación lateral con progreso del pipeline
└── ui/
    ├── button.tsx                  # Componente botón (shadcn/ui + estilos Apple)
    ├── card.tsx                    # Componente card
    └── ...

lib/
├── api.ts                          # Cliente HTTP con auth automática + manejo de errores
├── auth.ts                         # Helpers de JWT (localStorage)
├── orchestrator.ts                 # Hooks + polling adaptativo para LLM Control Center
├── toasts.ts                       # Notificaciones toast (react-hot-toast)
├── sounds.ts                       # Sonidos UI (cuelume — 2KB)
└── utils.ts                        # Utilidades (cn, etc.)
```

---

## Stack técnico

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** estricto
- **Tailwind CSS v4** + Apple design tokens (`@theme`)
- **shadcn/ui** para componentes base
- **lucide-react** para iconos
- **react-hot-toast** para notificaciones
- **cuelume** — 10 sonidos UI (2KB)
- **pnpm** como gestor de paquetes

### Design System

Sistema de diseño inspirado en Apple (ver `DESIGN.md` para referencia completa):

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-apple-blue` | `#0071e3` | Único color de acción (botones filled) |
| `--color-link-blue` | `#0066cc` | Bordes outlined, links |
| `--color-signal-blue` | `#2997ff` | Decorativo, iconos |
| `--color-carbon` | `#1d1d1f` | Texto primario |
| `--color-frost` | `#f5f5f7` | Canvas de página |
| `--font-sf-pro-display` | SF Pro Display | Headlines (40px+) |
| `--font-sf-pro-text` | SF Pro Text | Body, nav, botones |
| `--radius-buttons` | `980px` | Todos los botones: completamente redondeados |
| `--radius-cards` | `8px` | Todas las cards |

---

## Puesta en marcha

### Requisitos previos

- Node.js 20+
- [pnpm](https://pnpm.io) (`npm i -g pnpm`)
- Backend de Career OS corriendo (por defecto en `http://localhost:8000`)

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

El frontend consume la API REST de Career OS (FastAPI backend).

- **URL base:** `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- **Autenticación:** JWT en `localStorage` (`access_token`), inyectado en cada request por `apiFetch()`
- **Polling adaptativo:** el LLM Control Center usa hooks de `lib/orchestrator.ts` con frecuencias variables según el estado

### Endpoints consumidos

| Sección | Endpoints |
|---------|-----------|
| Auth | `POST /api/v1/auth/login`, `POST /api/v1/auth/register` |
| Providers | `GET /providers/`, `POST /providers/`, `GET /providers/me`, `PUT /providers/active` |
| Setup | `POST /setup/profile`, `GET /setup/profile`, `PUT /setup/behavioral-profile`, `POST /setup/star-examples` |
| Scrape | `POST /scrape/`, `GET /scrape/runs`, `GET /scrape/jobs` |
| Rank | `POST /rank/`, `GET /rank/jobs`, `GET /rank/jobs/{id}/evaluation` |
| Apply | `POST /apply/`, `GET /apply/`, `GET /apply/{id}` |
| Interview | `POST /interview/`, `GET /interview/{id}`, `POST /interview/{id}/mock` |
| Outcome | `POST /outcome/`, `PATCH /outcome/{id}`, `GET /outcome/tracker/rows` |
| Upskill | `POST /upskill/`, `GET /upskill/{id}`, `GET /upskill/` |
| Expand | `POST /expand/`, `GET /expand/{id}` |
| Orchestrator | `GET /orchestrator/status`, `GET /orchestrator/providers`, `GET /orchestrator/queue`, `POST /orchestrator/pause`, `POST /orchestrator/resume`, `POST /orchestrator/cancel/{id}`, `POST /orchestrator/retry/{id}` |
| Pipeline | `DELETE /pipeline-reset` |

---

## Decisiones de diseño

- **Estado en el cliente.** El progreso del pipeline se guarda en `localStorage` (`completed_steps`). Sobrevive a recargas sin backend extra.
- **LLM Control Center como sidebar independiente.** No interfiere con el contenido principal del pipeline. Tiene su propio polling adaptativo.
- **Mensajes de error amigables.** Los errores del orquestador se convierten automáticamente a mensajes legibles (ej: "NVIDIA alcanzó rate limit. Cambiando a Groq…").
- **Resultados progresivos.** Los resultados de ranking aparecen a medida que se completan, no al final.
- **Sonidos UI opcionales.** Feedback auditivo con `cuelume` para acciones importantes (completado, error, notificación).
- **Tema claro.** Diseño Apple con fondos blancos/grises y azul como único color de acento.

### Pipeline Reset

El botón "Reiniciar pipeline" en el StepSidebar llama a `DELETE /pipeline-reset` que borra:
- Jobs scrapeados, rankeados, aplicaciones, entrevistas, outcomes
- Runs de scraping
- Jobs del orquestador
- Datos de salario
- Métricas de salud de proveedores/modelos
- Archivo `job_search_tracker.csv`

**Preserva**: perfil de candidato, credenciales de proveedores, perfil conductual, ejemplos STAR, configuración de usuario.

---

## Testing

```bash
pnpm lint          # ESLint
npx tsc --noEmit   # TypeScript (0 errors)
pnpm build         # Build check
```

No hay tests unitarios de frontend aún. El proyecto depende de los tests del backend (367 tests, 99.5% pass rate) para validación de lógica de negocio.

---

## Dependencias principales

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| next | 15.x | Framework React |
| react | 19.x | UI |
| tailwindcss | 4.x | Estilos |
| shadcn/ui | latest | Componentes base |
| lucide-react | latest | Iconos |
| react-hot-toast | latest | Notificaciones toast |
| cuelume | latest | Sonidos UI (2KB) |
| class-variance-authority | latest | Variantes de componentes |
| clsx + tailwind-merge | latest | Utilidad `cn()` |

---

Hecho con ☕, mucho Tailwind y un toque de Apple.
