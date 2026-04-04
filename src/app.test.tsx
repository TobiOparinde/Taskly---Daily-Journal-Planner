import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Task, Rank } from './types';
import { getTasks, saveTasks, generateId } from './storage';
import { TaskCard } from './TaskCard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: overrides.id ?? generateId(),
  title: overrides.title ?? 'Test task',
  completed: overrides.completed ?? false,
  date: overrides.date ?? '2026-04-04',
  createdAt: overrides.createdAt ?? new Date().toISOString(),
  ...overrides,
});

// Re-implement `clean` locally so we can unit-test the logic
const clean = (obj: Task): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
};

// Re-implement sort used in TodayPage
const sortTasks = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const rankA = typeof a.rank === 'string' ? a.rank : 'Z9';
    const rankB = typeof b.rank === 'string' ? b.rank : 'Z9';
    return rankA.localeCompare(rankB);
  });

// Re-implement the TodayPage filter
const filterTodayTasks = (tasks: Task[], dateStr: string): Task[] =>
  tasks.filter(t => t.date === dateStr && t.source !== 'calendar');

// ---------------------------------------------------------------------------
// 1. Storage: localStorage round-trip
// ---------------------------------------------------------------------------

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('returns empty array when nothing stored', () => {
    expect(getTasks()).toEqual([]);
  });

  it('round-trips tasks through localStorage', () => {
    const tasks = [makeTask({ title: 'A' }), makeTask({ title: 'B' })];
    saveTasks(tasks);
    const loaded = getTasks();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].title).toBe('A');
    expect(loaded[1].title).toBe('B');
  });

  it('returns empty array on corrupted JSON', () => {
    localStorage.setItem('ranked_tasks', '{broken');
    expect(getTasks()).toEqual([]);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// 2. clean(): strips undefined, keeps everything else
// ---------------------------------------------------------------------------

describe('clean()', () => {
  it('strips undefined fields', () => {
    const task = makeTask({ description: undefined, rank: undefined, source: undefined });
    const cleaned = clean(task);
    expect(cleaned).not.toHaveProperty('description');
    expect(cleaned).not.toHaveProperty('rank');
    expect(cleaned).not.toHaveProperty('source');
  });

  it('keeps all defined fields including falsy ones', () => {
    const task = makeTask({ completed: false, description: '' });
    const cleaned = clean(task);
    expect(cleaned).toHaveProperty('completed', false);
    expect(cleaned).toHaveProperty('description', '');
    expect(cleaned).toHaveProperty('id');
    expect(cleaned).toHaveProperty('title');
    expect(cleaned).toHaveProperty('date');
  });

  it('preserves rank A1 through clean', () => {
    const task = makeTask({ rank: 'A1' });
    const cleaned = clean(task);
    expect(cleaned.rank).toBe('A1');
  });
});

// ---------------------------------------------------------------------------
// 3. Sorting: completed sink to bottom, A1 stays on top
// ---------------------------------------------------------------------------

describe('task sorting', () => {
  it('puts incomplete tasks before completed', () => {
    const tasks = [
      makeTask({ id: '1', completed: true, rank: 'A1' }),
      makeTask({ id: '2', completed: false, rank: 'C3' }),
    ];
    const sorted = sortTasks(tasks);
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('1');
  });

  it('orders by rank among incomplete tasks: A1 < B2 < C3', () => {
    const tasks = [
      makeTask({ id: 'c3', rank: 'C3' }),
      makeTask({ id: 'a1', rank: 'A1' }),
      makeTask({ id: 'b2', rank: 'B2' }),
    ];
    const sorted = sortTasks(tasks);
    expect(sorted.map(t => t.id)).toEqual(['a1', 'b2', 'c3']);
  });

  it('treats missing rank as lowest priority', () => {
    const tasks = [
      makeTask({ id: 'none' }),
      makeTask({ id: 'a1', rank: 'A1' }),
    ];
    const sorted = sortTasks(tasks);
    expect(sorted[0].id).toBe('a1');
    expect(sorted[1].id).toBe('none');
  });

  it('A1 completed moves to bottom, does not crash', () => {
    const tasks = [
      makeTask({ id: 'a1', rank: 'A1', completed: true }),
      makeTask({ id: 'b1', rank: 'B1', completed: false }),
      makeTask({ id: 'c1', rank: 'C1', completed: false }),
    ];
    const sorted = sortTasks(tasks);
    expect(sorted[0].id).toBe('b1');
    expect(sorted[1].id).toBe('c1');
    expect(sorted[2].id).toBe('a1');
  });

  it('handles all 9 ranks in correct order', () => {
    const ranks: Rank[] = ['C3', 'A1', 'B3', 'A2', 'C1', 'B1', 'A3', 'B2', 'C2'];
    const tasks = ranks.map(r => makeTask({ id: r, rank: r }));
    const sorted = sortTasks(tasks);
    expect(sorted.map(t => t.id)).toEqual(['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']);
  });

  it('does not crash with null/number rank values', () => {
    const tasks = [
      makeTask({ id: 'ok', rank: 'A1' }),
      { ...makeTask({ id: 'bad1' }), rank: null } as unknown as Task,
      { ...makeTask({ id: 'bad2' }), rank: 42 } as unknown as Task,
    ];
    expect(() => sortTasks(tasks)).not.toThrow();
    // A1 still comes first
    expect(sortTasks(tasks)[0].id).toBe('ok');
  });
});

// ---------------------------------------------------------------------------
// 4. Source filtering: calendar tasks excluded from Today
// ---------------------------------------------------------------------------

describe('source filtering', () => {
  const date = '2026-04-04';

  it('includes today tasks (no source)', () => {
    const tasks = [makeTask({ date })];
    expect(filterTodayTasks(tasks, date)).toHaveLength(1);
  });

  it('includes tasks with source="today"', () => {
    const tasks = [makeTask({ date, source: 'today' })];
    expect(filterTodayTasks(tasks, date)).toHaveLength(1);
  });

  it('excludes tasks with source="calendar"', () => {
    const tasks = [makeTask({ date, source: 'calendar' })];
    expect(filterTodayTasks(tasks, date)).toHaveLength(0);
  });

  it('filters correctly with mixed sources', () => {
    const tasks = [
      makeTask({ id: '1', date, source: 'calendar' }),
      makeTask({ id: '2', date }),
      makeTask({ id: '3', date, source: 'today' }),
      makeTask({ id: '4', date: '2026-04-05' }),
    ];
    const filtered = filterTodayTasks(tasks, date);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.id).sort()).toEqual(['2', '3']);
  });
});

// ---------------------------------------------------------------------------
// 5. TaskCard rendering: every rank, toggle, no crashes
// ---------------------------------------------------------------------------

describe('TaskCard', () => {
  const noop = () => {};

  it('renders title and rank badge for A1', () => {
    const task = makeTask({ rank: 'A1', title: 'Important task' });
    render(<TaskCard task={task} onToggle={noop} onDelete={noop} onEdit={noop} />);
    expect(screen.getByText('Important task')).toBeInTheDocument();
    expect(screen.getByText('A1')).toBeInTheDocument();
  });

  it('renders every valid rank without crashing', () => {
    const ranks: Rank[] = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
    ranks.forEach(rank => {
      const { unmount } = render(
        <TaskCard task={makeTask({ rank, title: `Task ${rank}` })} onToggle={noop} onDelete={noop} onEdit={noop} />
      );
      expect(screen.getByText(`Task ${rank}`)).toBeInTheDocument();
      expect(screen.getByText(rank)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders task with no rank without crashing', () => {
    const task = makeTask({ title: 'Unranked task' });
    delete (task as unknown as Record<string, unknown>).rank;
    render(<TaskCard task={task} onToggle={noop} onDelete={noop} onEdit={noop} />);
    expect(screen.getByText('Unranked task')).toBeInTheDocument();
  });

  it('renders completed task with strikethrough styling', () => {
    const task = makeTask({ rank: 'A1', title: 'Done task', completed: true });
    render(<TaskCard task={task} onToggle={noop} onDelete={noop} onEdit={noop} />);
    const titleEl = screen.getByText('Done task');
    expect(titleEl.className).toContain('text-stone-500');
  });

  it('calls onToggle when checkbox is clicked', () => {
    const onToggle = vi.fn();
    const task = makeTask({ rank: 'A1', title: 'Toggle me' });
    render(<TaskCard task={task} onToggle={onToggle} onDelete={noop} onEdit={noop} />);
    const btn = screen.getByText('Toggle me').closest('.group')!.querySelector('button')!;
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('handles malformed rank gracefully (null)', () => {
    const task = { ...makeTask({ title: 'Bad rank' }), rank: null } as unknown as Task;
    expect(() =>
      render(<TaskCard task={task} onToggle={noop} onDelete={noop} onEdit={noop} />)
    ).not.toThrow();
    expect(screen.getByText('Bad rank')).toBeInTheDocument();
  });

  it('renders description when present', () => {
    const task = makeTask({ title: 'Main', description: 'extra details' });
    render(<TaskCard task={task} onToggle={noop} onDelete={noop} onEdit={noop} />);
    expect(screen.getByText('- extra details')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 6. Toggle round-trip: task persists after toggle (simulated)
// ---------------------------------------------------------------------------

describe('toggle round-trip', () => {
  beforeEach(() => localStorage.clear());

  it('toggling a task keeps it in the list with flipped completed', () => {
    const tasks = [
      makeTask({ id: 't1', rank: 'A1', completed: false }),
      makeTask({ id: 't2', rank: 'B1', completed: false }),
    ];
    saveTasks(tasks);

    // Simulate toggle
    const toggled = getTasks().map(t =>
      t.id === 't1' ? { ...t, completed: !t.completed } : t
    );
    saveTasks(toggled);

    const after = getTasks();
    expect(after).toHaveLength(2);
    expect(after.find(t => t.id === 't1')!.completed).toBe(true);
    expect(after.find(t => t.id === 't2')!.completed).toBe(false);
  });

  it('toggling A1 task does not remove it from storage', () => {
    const tasks = [makeTask({ id: 'a1-task', rank: 'A1', completed: false })];
    saveTasks(tasks);

    // Toggle
    const toggled = getTasks().map(t =>
      t.id === 'a1-task' ? { ...t, completed: true } : t
    );
    saveTasks(toggled);

    const after = getTasks();
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe('a1-task');
    expect(after[0].completed).toBe(true);
    expect(after[0].rank).toBe('A1');
  });

  it('toggling back and forth preserves all fields', () => {
    const original = makeTask({ id: 'flip', rank: 'A1', description: 'keep me', completed: false });
    saveTasks([original]);

    // Toggle on
    let list = getTasks().map(t => t.id === 'flip' ? { ...t, completed: true } : t);
    saveTasks(list);

    // Toggle off
    list = getTasks().map(t => t.id === 'flip' ? { ...t, completed: false } : t);
    saveTasks(list);

    const final = getTasks().find(t => t.id === 'flip')!;
    expect(final.completed).toBe(false);
    expect(final.rank).toBe('A1');
    expect(final.description).toBe('keep me');
    expect(final.title).toBe(original.title);
  });
});

// ---------------------------------------------------------------------------
// 7. Edge cases: empty list, single task, many tasks
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('sorting empty list does not crash', () => {
    expect(() => sortTasks([])).not.toThrow();
    expect(sortTasks([])).toEqual([]);
  });

  it('sorting single task returns it', () => {
    const tasks = [makeTask({ rank: 'A1' })];
    expect(sortTasks(tasks)).toHaveLength(1);
  });

  it('handles 100 tasks without error', () => {
    const tasks = Array.from({ length: 100 }, (_, i) =>
      makeTask({ id: `t${i}`, rank: (['A1', 'B2', 'C3'] as Rank[])[i % 3] })
    );
    expect(() => sortTasks(tasks)).not.toThrow();
    expect(sortTasks(tasks)).toHaveLength(100);
  });

  it('clean handles task with every optional field undefined', () => {
    const task = makeTask();
    delete (task as unknown as Record<string, unknown>).description;
    delete (task as unknown as Record<string, unknown>).rank;
    delete (task as unknown as Record<string, unknown>).source;
    const cleaned = clean(task);
    expect(Object.values(cleaned).every(v => v !== undefined)).toBe(true);
    expect(cleaned).toHaveProperty('id');
    expect(cleaned).toHaveProperty('title');
    expect(cleaned).toHaveProperty('completed');
    expect(cleaned).toHaveProperty('date');
    expect(cleaned).toHaveProperty('createdAt');
  });
});
