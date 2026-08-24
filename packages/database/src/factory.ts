import { loadEnv, type Env } from '@lab/validation';
import { FirestoreRepository } from './firestore.js';
import { MemoryRepository } from './memory.js';
import type { Entity, Repository } from './types.js';

const cache = new Map<string, Repository<never>>();

/**
 * One repository instance per collection per process.
 *
 * The cache matters for the memory adapter: a new MemoryRepository per request
 * would still share the module-level registry, but caching keeps object
 * identity stable, which makes debugging in a REPL far less confusing.
 */
export function createRepository<T extends Entity>(
  collection: string,
  env: Env = loadEnv(),
): Repository<T> {
  const key = `${env.DB_MODE}:${collection}`;
  const existing = cache.get(key);
  if (existing) return existing as unknown as Repository<T>;

  const repository: Repository<T> =
    env.DB_MODE === 'firebase'
      ? new FirestoreRepository<T>(collection, {
          projectId: env.FIREBASE_PROJECT_ID!,
          clientEmail: env.FIREBASE_CLIENT_EMAIL!,
          privateKey: env.FIREBASE_PRIVATE_KEY!,
        })
      : new MemoryRepository<T>(collection);

  cache.set(key, repository as unknown as Repository<never>);
  return repository;
}

/** Test helper: drops cached repositories so DB_MODE changes take effect. */
export function resetRepositoryCache(): void {
  cache.clear();
}
