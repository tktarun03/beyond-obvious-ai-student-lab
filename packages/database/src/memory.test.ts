import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRepository, resetMemoryDatabase } from './memory.js';
import type { Entity } from './types.js';

interface Note extends Entity {
  title: string;
  body: string;
}

const ALICE = 'user_alice';
const MALLORY = 'user_mallory';

describe('MemoryRepository', () => {
  let repo: MemoryRepository<Note>;

  beforeEach(() => {
    resetMemoryDatabase();
    repo = new MemoryRepository<Note>('notes');
  });

  it('round-trips a row for its owner', async () => {
    const created = await repo.create({ ownerId: ALICE, title: 'Plan', body: 'Ship it' });
    expect(created.id).toBeTruthy();
    const fetched = await repo.get(created.id, ALICE);
    expect(fetched?.title).toBe('Plan');
  });

  // These four tests are the reason this package exists. If any of them regress,
  // one user can read or destroy another user's data.
  describe('tenant isolation', () => {
    it('hides another user row on get, and does not reveal that it exists', async () => {
      const note = await repo.create({ ownerId: ALICE, title: 'Private', body: 'secret' });
      expect(await repo.get(note.id, MALLORY)).toBeNull();
    });

    it('excludes other users rows from list', async () => {
      await repo.create({ ownerId: ALICE, title: 'A', body: '' });
      await repo.create({ ownerId: MALLORY, title: 'M', body: '' });
      const mine = await repo.list(ALICE);
      expect(mine).toHaveLength(1);
      expect(mine[0]?.title).toBe('A');
    });

    it('refuses to update another user row', async () => {
      const note = await repo.create({ ownerId: ALICE, title: 'A', body: '' });
      await expect(repo.update(note.id, MALLORY, { title: 'owned now' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
      expect((await repo.get(note.id, ALICE))?.title).toBe('A');
    });

    it('refuses to delete another user row', async () => {
      const note = await repo.create({ ownerId: ALICE, title: 'A', body: '' });
      await expect(repo.delete(note.id, MALLORY)).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(await repo.get(note.id, ALICE)).not.toBeNull();
    });
  });

  it('cannot be tricked into reassigning ownership through a patch', async () => {
    const note = await repo.create({ ownerId: ALICE, title: 'A', body: '' });
    await repo.update(note.id, ALICE, { ownerId: MALLORY } as never);
    expect((await repo.get(note.id, ALICE))?.ownerId).toBe(ALICE);
    expect(await repo.get(note.id, MALLORY)).toBeNull();
  });

  it('refuses to store a row with no owner', async () => {
    await expect(repo.create({ ownerId: '', title: 'orphan', body: '' })).rejects.toMatchObject({
      code: 'INTERNAL',
    });
  });

  it('returns copies, so a caller cannot mutate stored state by reference', async () => {
    const note = await repo.create({ ownerId: ALICE, title: 'A', body: '' });
    const fetched = await repo.get(note.id, ALICE);
    fetched!.title = 'mutated in place';
    expect((await repo.get(note.id, ALICE))?.title).toBe('A');
  });

  it('lists newest first by default and honours a limit', async () => {
    await repo.create({ ownerId: ALICE, id: 'n1', title: 'first', body: '' });
    await new Promise((r) => setTimeout(r, 2));
    await repo.create({ ownerId: ALICE, id: 'n2', title: 'second', body: '' });
    const rows = await repo.list(ALICE, { limit: 1 });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe('n2');
  });

  it('counts only the caller rows', async () => {
    await repo.create({ ownerId: ALICE, title: 'A', body: '' });
    await repo.create({ ownerId: MALLORY, title: 'M', body: '' });
    expect(await repo.count(ALICE)).toBe(1);
  });
});
