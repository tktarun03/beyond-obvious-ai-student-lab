'use client';

import Link from 'next/link';
import { Pill } from '@lab/ui';
import type { ProjectEntry } from '../lib/catalogue';

export function ProjectCard({ project }: { project: ProjectEntry }) {
  return (
    <Link href={`http://localhost:${project.port}`} target="_blank" rel="noopener noreferrer">
      <article className="lab-card flex flex-col justify-between gap-8 transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <p className="lab-eyebrow">
                <i>{project.number}</i>
                {project.difficulty}
              </p>
              <Pill tone="info" dot>
                :{project.port}
              </Pill>
            </div>
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
        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
          Open Project →
        </div>
      </article>
    </Link>
  );
}
