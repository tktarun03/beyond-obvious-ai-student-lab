'use client';

import { useMemo, useRef, useState } from 'react';
import { SCENARIOS, buildScenarioPrompt } from '../../../../examples/gpt-6-astra/scenarios';
import { recommendWorkflow } from '../../../../examples/gpt-6-astra/astra-prompt-router';

export function PromptLab() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('All');
  const [selectedId, setSelectedId] = useState(SCENARIOS[0]!.id);
  const [copyStatus, setCopyStatus] = useState('');
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const copyAttempt = useRef(0);
  const filtered = useMemo(
    () =>
      SCENARIOS.filter(
        (demo) =>
          (region === 'All' || demo.region === region) &&
          `${demo.id} ${demo.title} ${demo.fixture}`
            .toLowerCase()
            .includes(query.toLowerCase().trim()),
      ),
    [query, region],
  );
  const selected = SCENARIOS.find((demo) => demo.id === selectedId)!;
  const prompt = buildScenarioPrompt(selected);
  const recommendation = recommendWorkflow(selected.profile);

  async function copyPrompt() {
    const attempt = ++copyAttempt.current;
    try {
      await navigator.clipboard.writeText(prompt);
      if (attempt === copyAttempt.current) setCopyStatus('Prompt copied.');
    } catch {
      if (attempt !== copyAttempt.current) return;
      promptRef.current?.focus();
      promptRef.current?.select();
      setCopyStatus(
        'Clipboard unavailable. The prompt is selected; use your device’s copy command.',
      );
    }
  }

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_180px]">
        <div className="grid gap-2 text-sm">
          <label htmlFor="exercise-search">Search exercises</label>
          <input
            id="exercise-search"
            className="rounded-lg border border-[var(--hairline)] bg-white px-4 py-3 text-[var(--text-primary)]"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try payment, accessibility or latency"
          />
        </div>
        <div className="grid gap-2 text-sm">
          <label htmlFor="context-filter">Context</label>
          <select
            id="context-filter"
            className="rounded-lg border border-[var(--hairline)] bg-white px-4 py-3 text-[var(--text-primary)]"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            <option>All</option>
            <option>India</option>
            <option>Global</option>
          </select>
        </div>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[280px_1fr]">
        <nav aria-label="Prompt exercises">
          <p className="mb-3 text-sm text-[var(--text-secondary)]" role="status">
            {filtered.length} exercises found
          </p>
          <ul className="grid gap-2">
            {filtered.map((demo) => (
              <li key={demo.id}>
                <button
                  type="button"
                  aria-pressed={selectedId === demo.id}
                  onClick={() => {
                    copyAttempt.current++;
                    setSelectedId(demo.id);
                    setCopyStatus('');
                  }}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${selectedId === demo.id ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-white' : 'border-[var(--hairline)] bg-white text-[var(--text-primary)] hover:bg-stone-100'}`}
                >
                  <span className="block text-xs">
                    {demo.region} · {demo.minutes} min
                  </span>
                  <span className="mt-1 block font-semibold">{demo.title}</span>
                </button>
              </li>
            ))}
          </ul>
          {filtered.length === 0 && (
            <p className="rounded-lg border border-[var(--hairline)] p-4">
              No matches. Clear the search or select All. Your open exercise stays available.
            </p>
          )}
        </nav>
        <article
          aria-labelledby="exercise-title"
          className="min-w-0 rounded-xl border border-[var(--hairline)] bg-white p-5 md:p-8"
        >
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
            {selected.id} · Synthetic exercise
          </p>
          <h2 id="exercise-title" className="mt-2 text-3xl">
            {selected.title}
          </h2>
          <p className="mt-3 text-sm">
            <strong>Suggested starting effort:</strong> {recommendation.effort}. Local heuristic;
            validate with your own results.
            {recommendation.humanReview && ' Human review required before real-world use.'}
          </p>
          <details className="mt-5 rounded-lg bg-stone-50 p-4">
            <summary className="cursor-pointer font-semibold">Inspect the sample evidence</summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-sm">
              {selected.fixture}
            </pre>
          </details>
          <p className="mt-5 text-sm">
            <strong>Weak prompt:</strong> “{selected.weakPrompt}”
          </p>
          <label htmlFor="complete-prompt" className="mt-5 block font-semibold">
            Complete prompt — ready to copy
          </label>
          <textarea
            id="complete-prompt"
            ref={promptRef}
            readOnly
            value={prompt}
            rows={14}
            className="mt-2 w-full rounded-lg border border-[var(--hairline)] bg-stone-50 p-4 font-mono text-sm"
          />
          <button
            type="button"
            onClick={copyPrompt}
            className="mt-3 rounded-lg bg-[var(--text-primary)] px-5 py-3 font-semibold text-white"
          >
            Copy complete prompt
          </button>
          <p role="status" className="mt-2 min-h-6 text-sm">
            {copyStatus}
          </p>
          <h3 className="mt-5 text-xl">Check the answer</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            These are human review criteria, not measured AI results. A convincing answer can still
            fail.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {selected.expectedChecks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
          <p className="mt-5 rounded-lg bg-stone-50 p-4 text-sm">
            <strong>Go further:</strong> {selected.stretchGoal}
          </p>
        </article>
      </div>
    </div>
  );
}
