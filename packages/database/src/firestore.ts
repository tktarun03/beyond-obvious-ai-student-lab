import { AppError, newId } from '@lab/shared';
import type { CreateInput, Entity, ListOptions, Repository, UpdateInput } from './types.js';

/**
 * Cloud Firestore adapter, used when DB_MODE=firebase.
 *
 * Two things worth noticing:
 *
 * 1. It uses the ADMIN SDK, server-side only. The client SDK would put trust in
 *    security rules written by a student; the admin SDK bypasses rules entirely,
 *    which is safe precisely because it never reaches a browser. Every query
 *    below still filters by ownerId — defence in depth, because "the admin SDK
 *    can read everything" is exactly why the application layer must not.
 *
 * 2. The SDK is imported dynamically, so a contributor running DB_MODE=memory
 *    never has to install it.
 */

interface FirestoreLike {
  collection(path: string): {
    doc(id: string): {
      get(): Promise<{ exists: boolean; id: string; data(): Record<string, unknown> | undefined }>;
      set(data: Record<string, unknown>): Promise<unknown>;
      update(data: Record<string, unknown>): Promise<unknown>;
      delete(): Promise<unknown>;
    };
    where(
      field: string,
      op: string,
      value: unknown,
    ): {
      orderBy(field: string, direction: string): { limit(n: number): QueryLike } & QueryLike;
      get(): Promise<QuerySnapshot>;
      count(): { get(): Promise<{ data(): { count: number } }> };
    };
  };
}

interface QueryLike {
  get(): Promise<QuerySnapshot>;
}

interface QuerySnapshot {
  docs: { id: string; data(): Record<string, unknown> }[];
}

export interface FirestoreConfig {
  readonly projectId: string;
  readonly clientEmail: string;
  readonly privateKey: string;
}

let cachedDb: FirestoreLike | null = null;

async function getFirestore(config: FirestoreConfig): Promise<FirestoreLike> {
  if (cachedDb) return cachedDb;
  try {
    const appModule = 'firebase-admin/app';
    const storeModule = 'firebase-admin/firestore';
    const { initializeApp, getApps, cert } = (await import(appModule)) as {
      initializeApp: (options: unknown) => unknown;
      getApps: () => unknown[];
      cert: (options: unknown) => unknown;
    };
    const { getFirestore: getStore } = (await import(storeModule)) as {
      getFirestore: () => FirestoreLike;
    };

    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: config.privateKey,
        }),
      });
    }
    cachedDb = getStore();
    return cachedDb;
  } catch (cause) {
    throw new AppError('DEPENDENCY_FAILED', 'firebase-admin is not installed or failed to start', {
      cause,
      userMessage:
        'The database is not reachable. Run "npm install firebase-admin", or set DB_MODE=memory.',
    });
  }
}

export class FirestoreRepository<T extends Entity> implements Repository<T> {
  constructor(
    readonly collection: string,
    private readonly config: FirestoreConfig,
  ) {}

  async create(input: CreateInput<T>): Promise<T> {
    if (!input.ownerId) {
      throw new AppError('INTERNAL', `Refusing to write an unowned row to ${this.collection}`);
    }
    const db = await getFirestore(this.config);
    const now = new Date().toISOString();
    const id = input.id ?? newId(this.collection.slice(0, 3));
    const row = { ...(input as object), id, createdAt: now, updatedAt: now } as T;
    await db
      .collection(this.collection)
      .doc(id)
      .set(row as unknown as Record<string, unknown>);
    return row;
  }

  async get(id: string, ownerId: string): Promise<T | null> {
    const db = await getFirestore(this.config);
    const snapshot = await db.collection(this.collection).doc(id).get();
    if (!snapshot.exists) return null;
    const data = snapshot.data() as T | undefined;
    // The ownership check happens here, in application code, and not only in
    // security rules — the admin SDK does not evaluate rules at all.
    if (!data || data.ownerId !== ownerId) return null;
    return data;
  }

  async list(ownerId: string, options: ListOptions = {}): Promise<T[]> {
    const db = await getFirestore(this.config);
    const { orderBy = 'createdAt', direction = 'desc', limit = 100 } = options;
    const snapshot = await db
      .collection(this.collection)
      .where('ownerId', '==', ownerId)
      .orderBy(orderBy, direction)
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => doc.data() as T);
  }

  async update(id: string, ownerId: string, patch: UpdateInput<T>): Promise<T> {
    const existing = await this.get(id, ownerId);
    if (!existing) {
      throw new AppError('NOT_FOUND', `No row ${id} in ${this.collection} for this owner`);
    }
    const db = await getFirestore(this.config);
    const next = {
      ...existing,
      ...(patch as object),
      id: existing.id,
      ownerId: existing.ownerId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    } as T;
    await db
      .collection(this.collection)
      .doc(id)
      .set(next as unknown as Record<string, unknown>);
    return next;
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const existing = await this.get(id, ownerId);
    if (!existing) {
      throw new AppError('NOT_FOUND', `No row ${id} in ${this.collection} for this owner`);
    }
    const db = await getFirestore(this.config);
    await db.collection(this.collection).doc(id).delete();
  }

  async count(ownerId: string): Promise<number> {
    const db = await getFirestore(this.config);
    const result = await db
      .collection(this.collection)
      .where('ownerId', '==', ownerId)
      .count()
      .get();
    return result.data().count;
  }

  async clear(ownerId?: string): Promise<void> {
    if (!ownerId) {
      // Deleting a whole collection needs a batched recursive delete, which is
      // deliberately not implemented: an accidental call in production would be
      // unrecoverable. Seed and reset scripts should target a test project.
      throw new AppError('FORBIDDEN', 'Refusing to clear an entire Firestore collection', {
        userMessage: 'Bulk delete is disabled against a cloud database.',
      });
    }
    const rows = await this.list(ownerId, { limit: 500 });
    await Promise.all(rows.map((row) => this.delete(row.id, ownerId)));
  }
}
