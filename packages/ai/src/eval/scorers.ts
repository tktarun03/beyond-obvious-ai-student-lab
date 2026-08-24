import { tokenise } from '../embedding.js';
import type { Scorer } from './types.js';

/** The sentence every grounded feature in this repo must be able to say. */
export const INSUFFICIENT_INFO = "I don't have enough information in the provided documents.";

const normalise = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

export function exactMatch<E extends string>(name = 'exact_match'): Scorer<string, E> {
  return {
    name,
    description: 'Output string equals the expected string, ignoring case and spacing.',
    score: (output, expected) => ({
      score: normalise(output) === normalise(expected) ? 1 : 0,
      detail:
        normalise(output) === normalise(expected) ? undefined : `got "${output.slice(0, 80)}"`,
    }),
  };
}

/**
 * Fraction of required phrases that appear in the output.
 *
 * A blunt instrument, and honest about it: it measures whether the right facts
 * are present, not whether the answer reads well. That is the correct trade for
 * a regression check that must run in CI in under a second.
 */
export function containsAll(
  getPhrases: (expected: never) => readonly string[],
  name = 'contains_required_facts',
): Scorer<string, never> {
  return {
    name,
    description: 'Share of required facts present in the answer.',
    score: (output, expected) => {
      const phrases = getPhrases(expected);
      if (phrases.length === 0) return { score: 1 };
      const haystack = normalise(output);
      const hits = phrases.filter((p) => haystack.includes(normalise(p)));
      return {
        score: hits.length / phrases.length,
        detail:
          hits.length === phrases.length
            ? undefined
            : `missing: ${phrases.filter((p) => !haystack.includes(normalise(p))).join(', ')}`,
      };
    },
  };
}

/**
 * Rewards abstention when the sources cannot answer, and punishes it when they can.
 *
 * This is the single most important scorer in the repository. A system that
 * never says "I don't know" is not more capable — it is less trustworthy, and
 * the metric has to make that trade visible.
 */
export function abstentionCorrectness<E extends { shouldAbstain: boolean }>(
  name = 'abstention',
): Scorer<string, E> {
  return {
    name,
    description: 'Abstains when the sources do not support an answer, and answers when they do.',
    score: (output, expected) => {
      const abstained = normalise(output).includes(normalise(INSUFFICIENT_INFO));
      if (expected.shouldAbstain) {
        return {
          score: abstained ? 1 : 0,
          detail: abstained ? undefined : 'answered a question the sources cannot support',
        };
      }
      return {
        score: abstained ? 0 : 1,
        detail: abstained ? 'refused a question the sources do answer' : undefined,
      };
    },
  };
}

/**
 * Every citation must point at a source that was actually retrieved.
 * A fabricated citation is worse than none: it manufactures the appearance of
 * verifiability, which is exactly the trust signal a reader relies on.
 */
export function citationValidity<E extends { allowedIds: readonly string[] }>(
  name = 'citation_validity',
): Scorer<{ answer: string; citations: readonly string[] }, E> {
  return {
    name,
    description: 'Share of citations that refer to a genuinely retrieved source.',
    score: (output, expected) => {
      if (output.citations.length === 0) {
        return { score: 1, detail: 'no citations offered' };
      }
      const allowed = new Set(expected.allowedIds);
      const valid = output.citations.filter((c) => allowed.has(c));
      return {
        score: valid.length / output.citations.length,
        detail:
          valid.length === output.citations.length
            ? undefined
            : `fabricated: ${output.citations.filter((c) => !allowed.has(c)).join(', ')}`,
      };
    },
  };
}

/** Did retrieval put at least one genuinely relevant chunk in the context? */
export function retrievalRecall<E extends { relevantIds: readonly string[] }>(
  name = 'retrieval_recall',
): Scorer<{ retrievedIds: readonly string[] }, E> {
  return {
    name,
    description: 'Share of known-relevant sources that retrieval actually returned.',
    score: (output, expected) => {
      if (expected.relevantIds.length === 0) return { score: 1 };
      const got = new Set(output.retrievedIds);
      const found = expected.relevantIds.filter((id) => got.has(id));
      return {
        score: found.length / expected.relevantIds.length,
        detail:
          found.length === expected.relevantIds.length
            ? undefined
            : `missed: ${expected.relevantIds.filter((id) => !got.has(id)).join(', ')}`,
      };
    },
  };
}

/** Exact-match over a set of structured fields, with per-field partial credit. */
export function fieldAccuracy<O extends Record<string, unknown>, E extends Record<string, unknown>>(
  fields: readonly string[],
  name = 'field_accuracy',
): Scorer<O, E> {
  return {
    name,
    description: 'Share of extracted fields that match the ground truth exactly.',
    score: (output, expected) => {
      const wrong: string[] = [];
      for (const field of fields) {
        const a = output[field];
        const b = expected[field];
        const same =
          typeof a === 'string' && typeof b === 'string'
            ? normalise(a) === normalise(b)
            : JSON.stringify(a) === JSON.stringify(b);
        if (!same) wrong.push(`${field}(got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
      }
      return {
        score: (fields.length - wrong.length) / fields.length,
        detail: wrong.length ? wrong.join('; ') : undefined,
      };
    },
  };
}

/** Did the model pick the tool a human would have picked? */
export function toolSelectionAccuracy<E extends { toolName: string | null }>(
  name = 'tool_selection',
): Scorer<{ toolName: string | null }, E> {
  return {
    name,
    description: 'Chose the correct tool, including correctly choosing no tool.',
    score: (output, expected) => ({
      score: output.toolName === expected.toolName ? 1 : 0,
      detail:
        output.toolName === expected.toolName
          ? undefined
          : `chose ${output.toolName ?? 'none'}, expected ${expected.toolName ?? 'none'}`,
    }),
  };
}

/**
 * Penalises confidently wrong answers more than uncertainly wrong ones.
 * Calibration is the difference between a system a reviewer can triage and one
 * where every output must be checked by hand.
 */
export function confidenceCalibration<E>(
  isCorrect: (output: { confidence: number }, expected: E) => boolean,
  name = 'calibration',
): Scorer<{ confidence: number }, E> {
  return {
    name,
    description: 'Confidence tracks correctness (1 - Brier score).',
    score: (output, expected) => {
      const truth = isCorrect(output, expected) ? 1 : 0;
      const brier = (output.confidence - truth) ** 2;
      return {
        score: 1 - brier,
        detail: brier > 0.25 ? `confidence ${output.confidence} vs truth ${truth}` : undefined,
      };
    },
  };
}

/** Lexical overlap with a reference answer. A weak signal — use it as a tiebreak. */
export function tokenOverlap<E extends { reference: string }>(
  name = 'token_overlap',
): Scorer<string, E> {
  return {
    name,
    description: 'Jaccard overlap of content words with a reference answer.',
    score: (output, expected) => {
      const a = new Set(tokenise(output));
      const b = new Set(tokenise(expected.reference));
      if (b.size === 0) return { score: 1 };
      const intersection = [...b].filter((t) => a.has(t)).length;
      const union = new Set([...a, ...b]).size;
      return { score: union === 0 ? 0 : intersection / union };
    },
  };
}
