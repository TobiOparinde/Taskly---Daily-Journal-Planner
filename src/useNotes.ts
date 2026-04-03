import { useState, useCallback, useEffect } from 'react';
import type { Note } from './types';
import { getNotes, saveNotes, generateId } from './storage';
import { useAuth } from './useAuth';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';

export const useNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>(() => getNotes());

  // Real-time Firestore listener
  useEffect(() => {
    if (!user) return;
    const col = collection(db, 'users', user.uid, 'notes');
    const unsub = onSnapshot(col, (snap) => {
      const remote = snap.docs.map(d => ({ ...d.data(), id: d.id } as Note));
      setNotes(remote);
      saveNotes(remote);
    });
    return unsub;
  }, [user]);

  // Upload local data only if Firestore is empty (first-time setup)
  useEffect(() => {
    if (!user) return;
    const local = getNotes();
    if (local.length === 0) return;
    const col = collection(db, 'users', user.uid, 'notes');
    getDocs(col).then(snap => {
      if (snap.empty) {
        const batch = writeBatch(db);
        local.forEach(n => batch.set(doc(col, n.id), n));
        batch.commit();
      }
    });
  }, [user]);

  const getNoteForDate = useCallback((dateStr: string): Note | undefined =>
    notes.find(n => n.date === dateStr), [notes]);

  const saveNote = useCallback((dateStr: string, content: string) => {
    setNotes(prev => {
      const existing = prev.find(n => n.date === dateStr);
      let saved: Note;
      const updated = existing
        ? prev.map(n => {
            if (n.date === dateStr) { saved = { ...n, content, updatedAt: new Date().toISOString() }; return saved; }
            return n;
          })
        : (() => { saved = { id: generateId(), date: dateStr, content, updatedAt: new Date().toISOString() }; return [...prev, saved]; })();
      saveNotes(updated);
      if (user && saved!) {
        setDoc(doc(db, 'users', user.uid, 'notes', saved!.id), saved!);
      }
      return updated;
    });
  }, [user]);

  return { getNoteForDate, saveNote };
};
