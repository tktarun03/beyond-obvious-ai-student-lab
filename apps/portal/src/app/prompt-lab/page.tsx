import type { Metadata } from 'next';
import Link from 'next/link';
import { PromptLab } from '../../components/PromptLab';

export const metadata: Metadata = {
  title: 'Prompt Lab — Beyond the Obvious',
  description:
    'Ten free engineering exercises with synthetic evidence, reusable prompts and answer review criteria.',
};

export default function PromptLabPage() {
  return (
    <main id="main" className="ledger mx-auto min-h-screen max-w-6xl px-6 py-10 md:px-10">
      <Link href="/" className="underline underline-offset-4">
        ← Back to the student lab
      </Link>
      <header className="my-8 border-b border-[var(--hairline)] pb-8">
        <p className="text-sm uppercase tracking-widest text-[var(--text-secondary)]">
          Beyond the Obvious · Learn by checking
        </p>
        <h1 className="mt-3 text-5xl md:text-6xl">The engineering prompt lab</h1>
        <p className="mt-4 max-w-3xl text-lg text-[var(--text-secondary)]">
          Ten complete exercises from India and around the world. Inspect the evidence, copy a
          prompt, and review the answer against concrete checks.
        </p>
        <p className="mt-3 text-sm">
          Free local tools · Synthetic data · No API key · This page does not call a model
        </p>
      </header>
      <PromptLab />
      <footer className="mt-10 border-t border-[var(--hairline)] pt-6 text-sm text-[var(--text-secondary)]">
        Created by{' '}
        <a className="underline" href="https://github.com/tktarun03">
          Arunkumar Thamilarasu
        </a>{' '}
        for{' '}
        <a className="underline" href="https://www.youtube.com/@BeyondObviousArun">
          Beyond the Obvious
        </a>
        . Thank you to every learner who tests, corrects and contributes.
      </footer>
    </main>
  );
}
