import { useEffect, useState } from 'react';
import { generateId } from './storage';
import { toDateStr } from './dateUtils';

interface Daily {
  id: string;
  title: string;
  createdOn: string;
  removedOn: string | null;
  completedDates: string[];
}

const KEY = 'taskly_dailys';

function loadDailys(): Daily[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(data)) return [];
    const today = toDateStr(new Date());
    return data.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string')
      .map(item => ({
        id: item.id,
        title: item.title,
        // Earlier versions did not record creation dates. Preserve the one known completion.
        createdOn: typeof item.createdOn === 'string' ? item.createdOn
          : typeof item.completedOn === 'string' && item.completedOn < today ? item.completedOn : today,
        removedOn: typeof item.removedOn === 'string' ? item.removedOn : null,
        completedDates: Array.isArray(item.completedDates)
          ? item.completedDates.filter((date: unknown) => typeof date === 'string')
          : typeof item.completedOn === 'string' ? [item.completedOn] : [],
      }));
  } catch { return []; }
}

export function useDailys(selectedDate?: string) {
  const [items, setDailys] = useState(loadDailys);
  const [today, setToday] = useState(() => toDateStr(new Date()));

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      const now = new Date();
      const date = toDateStr(now);
      setToday(date);
      clearTimeout(timer);
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(refresh, midnight.getTime() - now.getTime() + 50);
    };
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const date = selectedDate ?? today;
  return {
    dailys: items.filter(item => item.createdOn <= date && (!item.removedOn || date < item.removedOn))
      .map(item => ({ ...item, completedOn: item.completedDates.includes(date) ? date : null })),
    today,
    addDaily: (title: string) => {
      if (!title.trim()) return;
      setDailys(items => [...items, { id: generateId(), title: title.trim(), createdOn: toDateStr(new Date()), removedOn: null, completedDates: [] }]);
    },
    removeDaily: (id: string) => setDailys(items => items.map(item => item.id === id
      ? { ...item, removedOn: toDateStr(new Date()) } : item)),
    toggleDaily: (id: string) => {
      const now = toDateStr(new Date());
      setToday(now);
      const target = selectedDate ?? now;
      // History and future previews are read-only; only today's checks can change.
      if (target !== now) return;
      setDailys(items => items.map(item => item.id === id && item.createdOn <= target && !item.removedOn
        ? { ...item, completedDates: item.completedDates.includes(target)
          ? item.completedDates.filter(day => day !== target) : [...item.completedDates, target] } : item));
    },
  };
}
