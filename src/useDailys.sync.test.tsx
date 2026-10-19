import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDailys } from './useDailys';
import { updateDoc } from 'firebase/firestore';

const mock = vi.hoisted(() => ({
  uid: 'alice' as string | undefined,
  documents: new Map<string, Record<string, unknown>>(),
  listeners: new Map<string, (snapshot: unknown) => void>(),
}));
vi.mock('./useAuth', () => ({ useAuth: () => ({ user: mock.uid ? { uid: mock.uid } : null, loading: false }) }));
vi.mock('./firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...parts: string[]) => parts.join('/'),
  collection: (_db: unknown, ...parts: string[]) => parts.join('/'),
  onSnapshot: (path: string, next: (snapshot: unknown) => void) => {
    mock.listeners.set(path, next);
    next({ docs: [...mock.documents].filter(([key]) => key.startsWith(path + '/')).map(([key, value]) => ({ id: key.split('/').at(-1), data: () => value })) });
    return () => mock.listeners.delete(path);
  },
  runTransaction: async (_db: unknown, work: (transaction: unknown) => Promise<void>) => work({
    get: async (path: string) => ({ exists: () => mock.documents.has(path) }),
    set: (path: string, value: Record<string, unknown>) => mock.documents.set(path, value),
  }),
  setDoc: vi.fn(async (path: string, value: Record<string, unknown>) => { mock.documents.set(path, value); }),
  updateDoc: vi.fn(async () => {}),
  arrayUnion: (...values: string[]) => ({ union: values }),
  arrayRemove: (...values: string[]) => ({ remove: values }),
}));

const daily = { id: 'vitamin', title: 'Take vitamin', createdOn: '2026-01-01', removedOn: null, completedDates: [] };

describe('daily account sync', () => {
  beforeEach(() => { localStorage.clear(); mock.documents.clear(); mock.listeners.clear(); mock.uid = 'alice'; vi.clearAllMocks(); });
  afterEach(cleanup);

  it('imports local items even when cloud already has other dailys, without overwriting remote history', async () => {
    localStorage.setItem('taskly_dailys', JSON.stringify([daily, { ...daily, id: 'stretch', title: 'Stretch' }]));
    mock.documents.set('users/alice/dailys/vitamin', { ...daily, completedDates: ['2026-10-15'] });
    const { result } = renderHook(() => useDailys('2026-10-15'));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.dailys).toHaveLength(2);
    expect(result.current.dailys.find(item => item.id === 'vitamin')?.completedOn).toBe('2026-10-15');
  });

  it('receives remote changes and separates accounts', async () => {
    mock.documents.set('users/alice/dailys/vitamin', daily);
    const { result, rerender } = renderHook(() => useDailys('2026-10-15'));
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => mock.listeners.get('users/alice/dailys')?.({ docs: [{ id: 'vitamin', data: () => ({ ...daily, completedDates: ['2026-10-15'] }) }] }));
    expect(result.current.dailys[0].completedOn).toBe('2026-10-15');
    mock.uid = 'bob';
    rerender();
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.dailys).toEqual([]);
    expect(mock.listeners.has('users/alice/dailys')).toBe(false);
    expect(mock.documents.has('users/bob/dailys/vitamin')).toBe(false);
  });

  it('writes new dailys to the signed-in account', async () => {
    const { result } = renderHook(() => useDailys());
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.addDaily('Stretch'));
    expect([...mock.documents.keys()][0]).toMatch(/^users\/alice\/dailys\//);
    expect([...mock.documents.values()][0].title).toBe('Stretch');
  });

  it('updates only the selected completion date and archives without replacing history', async () => {
    mock.documents.set('users/alice/dailys/vitamin', daily);
    const { result } = renderHook(() => useDailys());
    await waitFor(() => expect(result.current.ready).toBe(true));
    const today = result.current.today;
    act(() => result.current.toggleDaily('vitamin'));
    expect(updateDoc).toHaveBeenLastCalledWith('users/alice/dailys/vitamin', { completedDates: { union: [today] } });
    act(() => result.current.toggleDaily('vitamin'));
    expect(updateDoc).toHaveBeenLastCalledWith('users/alice/dailys/vitamin', { completedDates: { remove: [today] } });
    act(() => result.current.removeDaily('vitamin'));
    expect(updateDoc).toHaveBeenLastCalledWith('users/alice/dailys/vitamin', { removedOn: today });
  });
});
