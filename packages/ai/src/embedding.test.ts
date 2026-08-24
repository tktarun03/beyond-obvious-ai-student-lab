import { describe, expect, it } from 'vitest';
import { cosineSimilarity, hashingEmbedding, tokenise } from './embedding.js';

describe('hashingEmbedding', () => {
  it('is deterministic across calls, which is what makes mock evals reproducible', () => {
    expect(hashingEmbedding('annual leave policy')).toEqual(
      hashingEmbedding('annual leave policy'),
    );
  });

  it('produces unit vectors', () => {
    const v = hashingEmbedding('the quick brown fox jumps');
    const magnitude = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(magnitude).toBeCloseTo(1, 5);
  });

  it('ranks a lexically related passage above an unrelated one', () => {
    const query = hashingEmbedding('how many days of annual leave do I get');
    const related = hashingEmbedding(
      'Employees receive 24 days of annual leave each calendar year.',
    );
    const unrelated = hashingEmbedding('The office coffee machine is serviced every quarter.');
    expect(cosineSimilarity(query, related)).toBeGreaterThan(cosineSimilarity(query, unrelated));
  });

  it('returns a zero vector for empty input rather than throwing', () => {
    expect(hashingEmbedding('')).toHaveLength(256);
    expect(cosineSimilarity(hashingEmbedding(''), hashingEmbedding('anything'))).toBe(0);
  });
});

describe('tokenise', () => {
  it('drops stopwords and punctuation', () => {
    expect(tokenise('The invoice, and the total!')).toEqual(['invoice', 'total']);
  });
});
