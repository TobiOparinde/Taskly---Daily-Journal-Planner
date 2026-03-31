import { useState, useCallback } from 'react';
import type { Note } from './types';
import { getNotes, saveNotes, generateId } from './storage';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>(() => getNotes());

  const getNoteForDate = useCallback((dateStr: string): Note | undefined =>
    notes.find(n => n.date === dateStr), [notes]);

  const saveNote = useCallback((dateStr: string, content: string) => {
    setNotes(prev => {
      const existing = prev.find(n => n.date === dateStr);
      const updated = existing
        ? prev.map(n => n.date === dateStr ? { ...n, content, updatedAt: new Date().toISOString() } : n)
        : [...prev, { id: generateId(), date: dateStr, content, updatedAt: new Date().toISOString() }];
      saveNotes(updated);
      return updated;
    });
  }, []);

  return { getNoteForDate, saveNote };
};
