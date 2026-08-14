import type { Page } from '@playwright/test'
import {
  profileComplete,
  profileIncomplete,
  searchResponse,
  usageFree,
  rankedJobs,
  rankStart,
  rankJobRunning,
  rankJobCompleted,
  rankCounts,
  applyJobs,
  applyStart,
  applyStatusDone,
} from './data'

/**
 * Mocks de API para los flujos LLM (search / rank / apply).
 * Usan `page.route` → la UI se comporta igual pero sin llamadas reales a
 * proveedores de IA ni a los microservicios. El frontend no se toca: solo
 * interceptamos las respuestas HTTP en el navegador de prueba.
 */

/** Endpoints compartidos por las páginas autenticadas de la app. */
async function mockCommon(page: Page) {
  await page.route('**/api/v1/users/usage', (route) =>
    route.fulfill({ json: usageFree }),
  )
  // LLMControlCenter: sin proveedores ni cola activa
  await page.route('**/api/v1/orchestrator/providers', (route) =>
    route.fulfill({ json: { providers: [] } }),
  )
  await page.route('**/api/v1/orchestrator/queue', (route) =>
    route.fulfill({ json: { status: 'idle', queued: 0, running: 0 } }),
  )
  // No abrir un WebSocket real hacia el backend en tests
  await page.routeWebSocket('**/api/v1/orchestrator/ws**', (ws) => ws.close())
}

/** Flujo Search: perfil + búsqueda de jobs. */
export async function mockSearchApi(
  page: Page,
  options: { profile?: unknown; search?: unknown } = {},
) {
  await mockCommon(page)
  await page.route('**/api/v1/setup/profile', (route) =>
    route.fulfill({ json: options.profile ?? profileComplete }),
  )
  await page.route('**/api/v1/jobs/search', (route) =>
    route.fulfill({ json: options.search ?? searchResponse }),
  )
}

/** Perfil sin job_target → estado "incomplete" de la página de search. */
export function mockSearchApiIncomplete(page: Page) {
  return mockSearchApi(page, { profile: profileIncomplete })
}

/** Flujo Rank: jobs, arranque del job y poll del orquestador. */
export async function mockRankApi(
  page: Page,
  options: {
    /** GET /api/v1/rank/jobs inicial (por defecto []) */
    initialJobs?: unknown
    /** Estados que devuelve el poll de /orchestrator/jobs/:id */
    jobStates?: unknown[]
  } = {},
) {
  await mockCommon(page)

  // Devuelve [] hasta que se lance el POST /api/v1/rank/ (que marca started).
  // No se usa un contador de llamadas: con React StrictMode en dev el mount
  // dispara la petición dos veces y un contador rompía el estado inicial.
  let started = false
  await page.route('**/api/v1/rank/jobs', (route) =>
    route.fulfill({ json: started ? rankedJobs : (options.initialJobs ?? []) }),
  )
  await page.route('**/api/v1/rank/jobs/count', (route) =>
    route.fulfill({ json: rankCounts }),
  )
  await page.route('**/api/v1/rank/', (route) => {
    started = true
    return route.fulfill({ json: rankStart })
  })

  const states = options.jobStates ?? [rankJobRunning, rankJobCompleted]
  let poll = 0
  await page.route('**/api/v1/orchestrator/jobs/*', (route) => {
    const body = states[Math.min(poll, states.length - 1)]
    poll += 1
    return route.fulfill({ json: body })
  })
}

/** Flujo Apply: jobs disponibles, creación y status de la aplicación. */
export async function mockApplyApi(
  page: Page,
  options: { jobs?: unknown; status?: unknown } = {},
) {
  await mockCommon(page)
  await page.route('**/api/v1/apply/available-jobs*', (route) =>
    route.fulfill({ json: options.jobs ?? applyJobs }),
  )
  await page.route('**/api/v1/apply/', (route) =>
    route.fulfill({ json: applyStart }),
  )
  await page.route('**/api/v1/apply/*/status', (route) =>
    route.fulfill({ json: options.status ?? applyStatusDone }),
  )
}
