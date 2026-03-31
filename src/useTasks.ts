import { useState, useCallback } from 'react';
import type { Task } from './types';
import { getTasks, saveTasks, generateId } from './storage';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(() => getTasks());

  const addTask = useCallback((data: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    const t: Task = { ...data, id: generateId(), completed: false, createdAt: new Date().toISOString() };
    setTasks(prev => { const u = [...prev, t]; saveTasks(u); return u; });
  }, []);

  const updateTask = useCallback((id: string, changes: Partial<Task>) => {
    setTasks(prev => { const u = prev.map(t => t.id === id ? { ...t, ...changes } : t); saveTasks(u); return u; });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => { const u = prev.filter(t => t.id !== id); saveTasks(u); return u; });
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => { const u = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t); saveTasks(u); return u; });
  }, []);

  return { tasks, addTask, updateTask, deleteTask, toggleTask };
};
