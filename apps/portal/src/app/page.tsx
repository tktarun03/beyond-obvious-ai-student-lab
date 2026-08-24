import { Eyebrow, Pill, StatTile } from '@lab/ui';
import { PROJECTS } from '../lib/catalogue';

export default function PortalPage() {
  return (
    <main id="main" className="mx-auto min-h-screen max-w-6xl px-6 py-10 md:px-10 md:py-16">
      <header className="mb-12 grid gap-8 border-b border-[var(--line)] pb-10 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <Eyebrow index="LAB / 2026">Beyond the Obvious</Eyebrow>
          <h1 className="mt-5 max-w-3xl text-5xl leading-[0.95] md:text-7xl">
            Build AI systems you can explain.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--ink-muted)]">
            Five practical projects for learning the engineering around AI: evidence, validation,
            ownership, observability, and evaluation.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatTile value={PROJECTS.length} label="projects" />
          <StatTile value="mock" label="default AI" />
          <StatTile value="free" label="local run" />
        </div>
      </header>

      <section aria-labelledby="projects-heading">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Choose a problem</Eyebrow>
            <h2 id="projects-heading" className="mt-2 text-3xl">
              The project catalogue
            </h2>
          </div>
          <Pill tone="verified" dot>
            Foundation verified
          </Pill>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {PROJECTS.map((project) => (
            <article key={project.slug} className="lab-card flex flex-col justify-between gap-8">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <Eyebrow index={project.number}>{project.difficulty}</Eyebrow>
                  <span className="font-mono text-xs text-[var(--ink-muted)]">:{project.port}</span>
                </div>
                <h3 className="mt-5 text-2xl">{project.name}</h3>
                <p className="mt-3 text-[var(--ink-muted)]">{project.problem}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-5">
                <div className="flex flex-wrap gap-2">
                  {project.technologies.slice(0, 3).map((technology) => (
                    <Pill key={technology} tone="neutral">
                      {technology}
                    </Pill>
                  ))}
                </div>
                <span className="font-mono text-xs text-[var(--ink-muted)]">
                  {project.estimatedHours}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-6 text-sm text-[var(--ink-muted)]">
        <span>Learn. Build. Prove.</span>
        <span>TypeScript monorepo · deterministic mock mode</span>
      </footer>
    </main>
  );
}
