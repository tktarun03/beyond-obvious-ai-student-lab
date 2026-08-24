/**
 * The repository seam.
 *
 * The single most important design decision in this package is that EVERY
 * read and write takes an ownerId. Not "usually", not "when it matters" — the
 * type system will not let you call `get(id)` without saying whose data you
 * expect it to be.
 *
 * WHY: broken object-level authorization (IDOR) is the most common serious bug
 * in student and junior production code, and it is almost always written the
 * same way — a handler reads `params.id`, fetches the row, and returns it. If
 * the signature makes the owner mandatory, that bug requires deliberate effort.
 */

export interface Entity {
  readonly id: string;
  /** The user this row belongs to. Never derived from the request body. */
  readonly ownerId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ListOptions {
  readonly limit?: number;
  readonly orderBy?: 'createdAt' | 'updatedAt';
  readonly direction?: 'asc' | 'desc';
}

export type CreateInput<T extends Entity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> & {
  readonly id?: string;
};

export type UpdateInput<T extends Entity> = Partial<Omit<T, 'id' | 'ownerId' | 'createdAt'>>;

export interface Repository<T extends Entity> {
  readonly collection: string;

  create(input: CreateInput<T>): Promise<T>;

  /** Returns null when the row does not exist OR belongs to someone else. */
  get(id: string, ownerId: string): Promise<T | null>;

  list(ownerId: string, options?: ListOptions): Promise<T[]>;

  /** Throws NOT_FOUND when the row is missing or owned by another user. */
  update(id: string, ownerId: string, patch: UpdateInput<T>): Promise<T>;

  delete(id: string, ownerId: string): Promise<void>;

  count(ownerId: string): Promise<number>;

  /** Test and seed helper. Not part of the request path. */
  clear(ownerId?: string): Promise<void>;
}
