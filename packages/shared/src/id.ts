import { randomUUID, createHash } from 'node:crypto';

export const newId = (prefix: string): string => `${prefix}_${randomUUID().replace(/-/g, '')}`;

/**
 * Stable content hash. Used to key the embedding cache and the mock-provider
 * fixtures, which is what makes both deterministic across runs.
 */
export const contentHash = (input: string): string =>
  createHash('sha256').update(input).digest('hex');

export const shortHash = (input: string): string => contentHash(input).slice(0, 12);
