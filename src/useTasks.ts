import { useState, useCallback, useEffect } from 'react';
import type { Task } from './types';
import { getTasks, saveTasks, generateId } from './storage';
import { useAuth } from './useAuth';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';

const VALID_RANKS = new Set<Task['rank']>(['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']);
const VALID_SOURCES = new Set<NonNullable<Task['source']>>(['today', 'calendar']);

const normalizeTask = (raw: unknown): Task | null => {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const id = typeof item.id === 'string' && item.id.trim() ? item.id : '';
  const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : '';
  const date = typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : '';
  if (!id || !title || !date) return null;

  const rank = typeof item.rank === 'string' && VALID_RANKS.has(item.rank as Task['rank'])
    ? (item.rank as Task['rank'])
    : undefined;
  const description = typeof item.description === 'string' && item.description.trim()
    ? item.description.trim()
    : undefined;
  const completed = typeof item.completed === 'boolean' ? item.completed : false;
  const createdAt = typeof item.createdAt === 'string' && item.createdAt
    ? item.createdAt
    : new Date().toISOString();
  const source = typeof item.source === 'string' && VALID_SOURCES.has(item.source as NonNullable<Task['source']>)
    ? (item.source as NonNullable<Task['source']>)
    : undefined;

  return { id, title, description, rank, completed, date, createdAt, source };
};

const normalizeTasks = (items: unknown[]): Task[] => {
  const normalized = items
    .map(normalizeTask)
    .filter((task): task is Task => task !== null);

  const deduped = new Map<string, Task>();
  normalized.forEach(task => deduped.set(task.id, task));
  return Array.from(deduped.values());
};

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(() => normalizeTasks(getTasks()));

  // Real-time Firestore listener when signed in
  useEffect(() => {
    if (!user) return;
    const col = collection(db, 'users', user.uid, 'tasks');
    const unsub = onSnapshot(col, (snap) => {
      const remote = normalizeTasks(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      setTasks(remote);
      saveTasks(remote); // cache locally
    });
    return unsub;
  }, [user]);

  // Upload local data only if Firestore is empty (first-time setup)
  useEffect(() => {
    if (!user) return;
    const local = normalizeTasks(getTasks());
    if (local.length === 0) return;
    const col = collection(db, 'users', user.uid, 'tasks');
    getDocs(col).then(snap => {
      if (snap.empty) {
        const batch = writeBatch(db);
        local.forEach(t => batch.set(doc(col, t.id), t));
        batch.commit();
      }
    });
  }, [user]);

  const persist = useCallback((task: Task) => {
    if (user) {
      const ref = doc(db, 'users', user.uid, 'tasks', task.id);
      setDoc(ref, task);
    }
  }, [user]);

  const addTask = useCallback((data: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    const t: Task = { ...data, id: generateId(), completed: false, createdAt: new Date().toISOString() };
    setTasks(prev => { const u = [...prev, t]; saveTasks(u); return u; });
    persist(t);
  }, [persist]);

  const updateTask = useCallback((id: string, changes: Partial<Task>) => {
    setTasks(prev => {
      const u = prev.map(t => t.id === id ? { ...t, ...changes } : t);
      saveTasks(u);
      const updated = u.find(t => t.id === id);
      if (updated) persist(updated);
      return u;
    });
  }, [persist]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => { const u = prev.filter(t => t.id !== id); saveTasks(u); return u; });
    if (user) deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
  }, [user]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => {
      const u = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      saveTasks(u);
      const updated = u.find(t => t.id === id);
      if (updated) persist(updated);
      return u;
    });
  }, [persist]);

  return { tasks, addTask, updateTask, deleteTask, toggleTask };
};
