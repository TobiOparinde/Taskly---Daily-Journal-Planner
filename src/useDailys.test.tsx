import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDailys } from './useDailys';
vi.mock('./useAuth', () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock('./firebase', () => ({ db: {} }));

describe('recurring dailys', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 15, 23, 59, 59));
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('keeps the checklist but clears checks at midnight, including after reload', () => {
    const { result, unmount } = renderHook(() => useDailys());
    act(() => result.current.addDaily('Take vitamin'));
    const id = result.current.dailys[0].id;
    act(() => result.current.toggleDaily(id));
    expect(result.current.dailys[0].completedOn).toBe(result.current.today);
    act(() => vi.advanceTimersByTime(1100));
    expect(result.current.today).toBe('2026-10-16');
    expect(result.current.dailys[0].title).toBe('Take vitamin');
    expect(result.current.dailys[0].completedOn).toBeNull();
    expect(result.current.dailys[0].completedOn).not.toBe(result.current.today);
    unmount();
    const reloaded = renderHook(() => useDailys());
    expect(reloaded.result.current.dailys).toHaveLength(1);
    expect(reloaded.result.current.dailys[0].completedOn).not.toBe(reloaded.result.current.today);
  });

  it('clears stored checkmarks when reopened several days later', () => {
    const first = renderHook(() => useDailys());
    act(() => first.result.current.addDaily('Take vitamin'));
    act(() => first.result.current.toggleDaily(first.result.current.dailys[0].id));
    first.unmount();
    vi.setSystemTime(new Date(2026, 9, 20, 9));
    const later = renderHook(() => useDailys());
    expect(later.result.current.dailys[0].completedOn).toBeNull();
    expect(later.result.current.dailys[0].title).toBe('Take vitamin');
    expect(JSON.parse(localStorage.getItem('taskly_dailys')!)[0].completedDates).toEqual(['2026-10-15']);
  });

  it('resets when returning to a sleeping tab on a later day', () => {
    const { result } = renderHook(() => useDailys());
    act(() => result.current.addDaily('Take vitamin'));
    act(() => result.current.toggleDaily(result.current.dailys[0].id));
    vi.setSystemTime(new Date(2026, 9, 18, 10));
    act(() => window.dispatchEvent(new Event('focus')));
    expect(result.current.today).toBe('2026-10-18');
    expect(result.current.dailys[0].completedOn).toBeNull();
  });

  it('persists checks, allows unchecking, and permanently removes a daily', () => {
    const first = renderHook(() => useDailys());
    act(() => first.result.current.addDaily('Take vitamin'));
    const id = first.result.current.dailys[0].id;
    act(() => first.result.current.toggleDaily(id));
    first.unmount();
    const next = renderHook(() => useDailys());
    expect(next.result.current.dailys[0].completedOn).toBe(next.result.current.today);
    act(() => next.result.current.toggleDaily(id));
    expect(next.result.current.dailys[0].completedOn).toBeNull();
    act(() => next.result.current.removeDaily(id));
    next.unmount();
    expect(renderHook(() => useDailys()).result.current.dailys).toEqual([]);
  });

  it('preserves separate daily history and never backdates new items', () => {
    const { result, rerender } = renderHook(({ date }) => useDailys(date), { initialProps: { date: '2026-10-15' } });
    act(() => result.current.addDaily('Take vitamin'));
    const id = result.current.dailys[0].id;
    act(() => result.current.toggleDaily(id));
    vi.setSystemTime(new Date(2026, 9, 16, 10));
    rerender({ date: '2026-10-16' });
    expect(result.current.dailys[0].completedOn).toBeNull();
    act(() => result.current.addDaily('Stretch'));
    expect(result.current.dailys).toHaveLength(2);
    rerender({ date: '2026-10-15' });
    expect(result.current.dailys).toHaveLength(1);
    expect(result.current.dailys[0].completedOn).toBe('2026-10-15');
    act(() => result.current.toggleDaily(id));
    expect(result.current.dailys[0].completedOn).toBe('2026-10-15');
    rerender({ date: '2026-10-14' });
    expect(result.current.dailys).toEqual([]);
    rerender({ date: '2026-10-20' });
    expect(result.current.dailys).toHaveLength(2);
    expect(result.current.dailys.every(item => item.completedOn === null)).toBe(true);
  });

  it('removing a daily preserves earlier days across reloads', () => {
    const first = renderHook(() => useDailys());
    act(() => first.result.current.addDaily('Take vitamin'));
    const id = first.result.current.dailys[0].id;
    act(() => first.result.current.toggleDaily(id));
    vi.setSystemTime(new Date(2026, 9, 16, 10));
    act(() => first.result.current.removeDaily(id));
    first.unmount();
    const { result, rerender } = renderHook(({ date }) => useDailys(date), { initialProps: { date: '2026-10-15' } });
    expect(result.current.dailys[0].completedOn).toBe('2026-10-15');
    rerender({ date: '2026-10-16' });
    expect(result.current.dailys).toEqual([]);
    rerender({ date: '2026-10-20' });
    expect(result.current.dailys).toEqual([]);
  });

  it('migrates existing dailys without discarding their known completion', () => {
    localStorage.setItem('taskly_dailys', JSON.stringify([{ id: 'old', title: 'Take vitamin', completedOn: '2026-10-14' }]));
    const { result, rerender } = renderHook(({ date }) => useDailys(date), { initialProps: { date: '2026-10-15' } });
    expect(result.current.dailys[0].completedOn).toBeNull();
    rerender({ date: '2026-10-14' });
    expect(result.current.dailys[0].completedOn).toBe('2026-10-14');
  });
});
