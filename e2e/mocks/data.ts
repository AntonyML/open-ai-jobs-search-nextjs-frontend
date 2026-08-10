/**
 * Datos de prueba para los mocks de flujos LLM (search / rank / apply).
 * Separados de la lógica de rutas (mocks/api.ts) para que sean fáciles de
 * ajustar sin tocar la implementación del mock.
 */

/** GET /api/v1/setup/profile — perfil completo (estado "briefing"). */
export const profileComplete = {
  full_name: 'Demo User',
  job_target: {
    target_titles: ['Software Engineer', 'Backend Engineer'],
    seniority: 'senior',
    work_mode: ['remote'],
    search_locations: ['Remote', 'San José'],
    keywords: ['python', 'fastapi'],
  },
  skills: {
    programming_ml: [{ name: 'Python' }, { name: 'TypeScript' }],
    domain_expertise: ['Fintech'],
    software_tools: ['Docker', 'FastAPI'],
  },
}

/** GET /api/v1/setup/profile — perfil incompleto (estado "incomplete"). */
export const profileIncomplete = {
  full_name: 'Demo User',
  job_target: null,
  skills: {},
}

const now = Date.now()

/** POST /api/v1/jobs/search — respuesta `fresh: true` con 2 jobs. */
export const searchResponse = {
  jobs: [
    {
      id: 'job-1',
      title: 'Senior Frontend Engineer',
      company: 'Acme Corp',
      location: 'Remote',
      url: 'https://example.com/job-1',
      salary: '$120k–$150k',
      portal: 'LinkedIn',
      description: 'React + TypeScript, design systems.',
      ingested_at: new Date(now - 3_600_000).toISOString(),
    },
    {
      id: 'job-2',
      title: 'Backend Engineer (Python)',
      company: 'Globex',
      location: 'Hybrid · San José',
      url: 'https://example.com/job-2',
      salary: null,
      portal: 'Workable',
      description: 'FastAPI, PostgreSQL, async systems.',
      ingested_at: new Date(now - 7_200_000).toISOString(),
    },
  ],
  count: 2,
  fresh: true,
  ingest_job_id: null,
  message: null,
}

/** GET /api/v1/users/usage — plan free con límites sin consumir. */
export const usageFree = {
  tier: 'free',
  limits: {
    max_apply_count: 5,
    max_prepare_count: 5,
    max_rank_iterations: 3,
    max_track_count: 20,
  },
  usage: {
    applications: 0,
    interview_preps: 0,
    rank_iterations: 0,
    outcomes: 0,
  },
}

/** GET /api/v1/rank/jobs — jobs ya rankeados (respuesta tras completar). */
export const rankedJobs = [
  {
    id: 'job-1',
    title: 'Senior Frontend Engineer',
    company: 'Acme Corp',
    location: 'Remote',
    rank_score: 92,
    rank_verdict: 'Excellent match',
  },
  {
    id: 'job-2',
    title: 'Backend Engineer (Python)',
    company: 'Globex',
    location: 'Hybrid · San José',
    rank_score: 84,
    rank_verdict: 'Strong match',
  },
]

/** POST /api/v1/rank/ — arranca el job en cola. */
export const rankStart = {
  job_id: 'job-run-1',
  accepted_jobs: 2,
  status: 'queued',
  total_jobs: 2,
  message: null,
}

/** GET /api/v1/orchestrator/jobs/job-run-1 — estados de la cola (running → completed). */
export const rankJobRunning = {
  id: 'job-run-1',
  status: 'running',
  provider: 'openai',
  model: 'gpt-4o-mini',
  description: 'Evaluating job 1/2',
}

export const rankJobCompleted = {
  id: 'job-run-1',
  status: 'completed',
  provider: 'openai',
  model: 'gpt-4o-mini',
  description: 'Evaluating job 2/2',
  result: {
    ranked_count: 2,
    below_threshold: 0,
    message: 'Evaluation complete',
    salary_data_available: false,
    shortlist: [
      { job: { id: 'job-1', title: 'Senior Frontend Engineer' }, score: 92, salary: null },
      { job: { id: 'job-2', title: 'Backend Engineer (Python)' }, score: 84, salary: null },
    ],
  },
}

/** GET /api/v1/rank/jobs/count — contadores durante el ranking. */
export const rankCounts = { total: 2, ranked: 0, unranked: 2 }

/** GET /api/v1/apply/available-jobs — jobs rankeados disponibles para aplicar. */
export const applyJobs = [
  {
    id: 'job-1',
    title: 'Senior Frontend Engineer',
    company: 'Acme Corp',
    location: 'Remote',
    rank_score: 92,
    rank_verdict: 'Excellent match',
  },
  {
    id: 'job-2',
    title: 'Backend Engineer (Python)',
    company: 'Globex',
    location: 'Hybrid · San José',
    rank_score: 84,
    rank_verdict: 'Strong match',
  },
]

/** POST /api/v1/apply/ — crea la aplicación. */
export const applyStart = {
  application_id: 'app-1',
  job_posting_id: 'job-1',
  status: 'queued',
}

/** GET /api/v1/apply/app-1/status — completada al primer poll. */
export const applyStatusDone = {
  application_id: 'app-1',
  job_posting_id: 'job-1',
  progress_pct: 100,
  pipeline_stage: 'complete',
  current_action: 'Done',
}
