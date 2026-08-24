import { AppError, newId } from '@lab/shared';
import type { CreateInput, Entity, ListOptions, Repository, UpdateInput } from './types.js';

/**
 * In-process store used when DB_MODE=memory.
 *
 * It is not a toy: it enforces exactly the same ownership rules as the
 * Firestore adapter, so a test that passes here catches the same authorization
 * bugs it would catch against the real database. What it does not give you is
 * durability, concurrency or query planning — which is why the Firestore
 * adapter exists and why the trade-off is documented rather than hidden.
 *
 * Data is held in a module-level registry so that Next.js hot reloads and
 * multiple route handlers in one process see the same rows.
 */

type Row = Record<string, unknown> & Entity;

const registry = new Map<string, Map<string, Row>>();

function tableFor(collection: string): Map<string, Row> {
  let table = registry.get(collection);
  if (!table) {
    table = new Map<string, Row>();
    registry.set(collection, table);
  }
  return table;
}

/** Wipes every collection. Used between test cases. */
export function resetMemoryDatabase(): void {
  registry.clear();
}

export class MemoryRepository<T extends Entity> implements Repository<T> {
  constructor(readonly collection: string) {}

  private get table(): Map<string, Row> {
    return tableFor(this.collection);
  }

  async create(input: CreateInput<T>): Promise<T> {
    if (!input.ownerId) {
      throw new AppError('INTERNAL', `Refusing to write an unowned row to ${this.collection}`);
    }
    const now = new Date().toISOString();
    const id = input.id ?? newId(this.collection.slice(0, 3));
    if (this.table.has(id)) {
      throw new AppError('CONFLICT', `Row ${id} already exists in ${this.collection}`);
    }
    const row = { ...(input as object), id, createdAt: now, updatedAt: now } as Row;
    this.table.set(id, structuredClone(row));
    return structuredClone(row) as T;
  }

  async get(id: string, ownerId: string): Promise<T | null> {
    const row = this.table.get(id);
    // Owner mismatch returns null, not FORBIDDEN: telling an attacker that a
    // row exists but belongs to someone else leaks the existence of the row.
    if (!row || row.ownerId !== ownerId) return null;
    return structuredClone(row) as T;
  }

  async list(ownerId: string, options: ListOptions = {}): Promise<T[]> {
    const { orderBy = 'createdAt', direction = 'desc', limit } = options;
    const rows = [...this.table.values()]
      .filter((row) => row.ownerId === ownerId)
      .sort((a, b) => {
        const left = String(a[orderBy] ?? '');
        const right = String(b[orderBy] ?? '');
        return direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
      });
    return (limit ? rows.slice(0, limit) : rows).map((row) => structuredClone(row)) as T[];
  }

  async update(id: string, ownerId: string, patch: UpdateInput<T>): Promise<T> {
    const existing = this.table.get(id);
    if (!existing || existing.ownerId !== ownerId) {
      throw new AppError('NOT_FOUND', `No row ${id} in ${this.collection} for this owner`);
    }
    // ownerId and createdAt are stripped by the type, but a caller can still
    // pass them at runtime through an untyped object. Rebuild explicitly.
    const next: Row = {
      ...existing,
      ...(patch as object),
      id: existing.id,
      ownerId: existing.ownerId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.table.set(id, structuredClone(next));
    return structuredClone(next) as T;
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const existing = this.table.get(id);
    if (!existing || existing.ownerId !== ownerId) {
      throw new AppError('NOT_FOUND', `No row ${id} in ${this.collection} for this owner`);
    }
    this.table.delete(id);
  }

  async count(ownerId: string): Promise<number> {
    let total = 0;
    for (const row of this.table.values()) if (row.ownerId === ownerId) total += 1;
    return total;
  }

  async clear(ownerId?: string): Promise<void> {
    if (!ownerId) {
      this.table.clear();
      return;
    }
    for (const [id, row] of this.table) if (row.ownerId === ownerId) this.table.delete(id);
  }
}
