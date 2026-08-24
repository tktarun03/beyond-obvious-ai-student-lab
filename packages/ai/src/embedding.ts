/**
 * Deterministic lexical embeddings for AI_MODE=mock.
 *
 * WHY this is more than a stub: a mock that returns random vectors makes
 * retrieval meaningless, so students could not develop or evaluate project 01
 * without paying for a key. This uses the hashing trick (feature hashing) over
 * unigrams and bigrams, so vectors are stable across runs AND cosine similarity
 * genuinely reflects lexical overlap. Retrieval, reranking and grounding evals
 * all behave sensibly offline.
 *
 * What it does NOT do is capture meaning: "car" and "automobile" are unrelated
 * here. That gap is the point of the eval suite — swap AI_MODE=live and the
 * multilingual and synonym cases start passing.
 */

export const MOCK_EMBEDDING_DIMENSIONS = 256;

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'from',
  'has',
  'have',
  'he',
  'her',
  'his',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'she',
  'that',
  'the',
  'their',
  'them',
  'there',
  'they',
  'this',
  'to',
  'was',
  'were',
  'will',
  'with',
  'you',
  'your',
]);

export function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

/** FNV-1a: small, fast, well-distributed, and identical on every machine. */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function hashingEmbedding(text: string, dimensions = MOCK_EMBEDDING_DIMENSIONS): number[] {
  const vector = new Array<number>(dimensions).fill(0);
  const tokens = tokenise(text);
  if (tokens.length === 0) return vector;

  const counts = new Map<string, number>();
  const add = (feature: string) => counts.set(feature, (counts.get(feature) ?? 0) + 1);

  for (let i = 0; i < tokens.length; i += 1) {
    add(tokens[i]!);
    // Bigrams give word order a little weight, which meaningfully improves
    // retrieval on phrase queries such as "annual leave policy".
    if (i + 1 < tokens.length) add(`${tokens[i]}_${tokens[i + 1]}`);
  }

  for (const [feature, count] of counts) {
    const h = hash32(feature);
    const index = h % dimensions;
    // Signed hashing keeps collisions from systematically inflating similarity.
    const sign = (h >>> 31) % 2 === 0 ? 1 : -1;
    const weight = 1 + Math.log(count);
    vector[index] = (vector[index] ?? 0) + sign * weight;
  }

  return l2Normalise(vector);
}

export function l2Normalise(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return magnitude === 0 ? vector : vector.map((v) => v / magnitude);
}

export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < length; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    magA += x * x;
    magB += y * y;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
