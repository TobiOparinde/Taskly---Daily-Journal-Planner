import { useState, useCallback, useEffect } from 'react';
import type { Task } from './types';
import { getTasks, saveTasks, generateId } from './storage';
import { useAuth } from './useAuth';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(() => getTasks());

  // Real-time Firestore listener when signed in
  useEffect(() => {
    if (!user) return;
    const col = collection(db, 'users', user.uid, 'tasks');
    const unsub = onSnapshot(col, (snap) => {
      const remote = snap.docs.map(d => ({ ...d.data(), id: d.id } as Task));
      setTasks(remote);
      saveTasks(remote); // cache locally
    });
    return unsub;
  }, [user]);

  // Upload local data only if Firestore is empty (first-time setup)
  useEffect(() => {
    if (!user) return;
    const local = getTasks();
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
