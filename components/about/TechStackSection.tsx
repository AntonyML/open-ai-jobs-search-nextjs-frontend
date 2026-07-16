'use client'

const TECH_STACK_KEYS = [
  { categoryKey: 'techFrontend', items: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'shadcn/ui'] },
  { categoryKey: 'techBackend', items: ['FastAPI', 'Python 3.12+', 'SQLAlchemy', 'Alembic', 'Pydantic'] },
  { categoryKey: 'techAI', items: ['LiteLLM', 'OpenAI API', 'Anthropic API', 'NVIDIA NIM', 'OpenRouter'] },
  { categoryKey: 'techInfra', items: ['PostgreSQL', 'Docker', 'Fly.io', 'JWT Auth', 'Encrypted Credentials'] },
]

function TechTag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#e2e2e5] bg-[#f5f5f7] px-2.5 py-1 text-[12px] font-medium text-[#474747]">
      {label}
    </span>
  )
}

export function TechStackSection({ t }: { t: (key: string) => string }) {
  return (
    <section className="border-b border-[#d2d2d7] bg-[#f5f5f7]">
      <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-[28px] font-semibold tracking-tight text-[#1d1d1f] md:text-[36px]">
            {t('techHeading')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {TECH_STACK_KEYS.map((category) => (
              <div
                key={category.categoryKey}
                className="rounded-xl border border-[#d2d2d7] bg-white p-5 transition-all duration-300 hover:border-[#0071e3]/30"
              >
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#0071e3]">
                  {t(category.categoryKey)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.items.map((item) => (
                    <TechTag key={item} label={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
