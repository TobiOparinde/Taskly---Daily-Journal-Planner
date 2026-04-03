import { useState, useCallback, useEffect } from 'react';
import type { DailyJournalEntry } from './types';
import { getDailyJournal, saveDailyJournal } from './storage';
import { useAuth } from './useAuth';
import { db } from './firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

export const useJournal = () => {
  const { user } = useAuth();
  const [journalByDate, setJournalByDate] = useState<Record<string, DailyJournalEntry>>(() => getDailyJournal());

  // Real-time Firestore listener
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'data', 'journal');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const remote = snap.data() as Record<string, DailyJournalEntry>;
        setJournalByDate(remote);
        saveDailyJournal(remote);
      }
    });
    return unsub;
  }, [user]);

  // Upload local data only if Firestore is empty (first-time setup)
  useEffect(() => {
    if (!user) return;
    const local = getDailyJournal();
    if (Object.keys(local).length === 0) return;
    const ref = doc(db, 'users', user.uid, 'data', 'journal');
    getDoc(ref).then(snap => {
      if (!snap.exists()) {
        setDoc(ref, local);
      }
    });
  }, [user]);

  const updateJournal = useCallback((dateStr: string, updater: (entry: DailyJournalEntry) => DailyJournalEntry) => {
    setJournalByDate(prev => {
      const base = prev[dateStr] ?? { gratitude: ['', '', ''], affirmation: '', reflection: '' };
      const nextForDate = updater(base);
      const next = { ...prev, [dateStr]: nextForDate };
      saveDailyJournal(next);
      if (user) {
        setDoc(doc(db, 'users', user.uid, 'data', 'journal'), next);
      }
      return next;
    });
  }, [user]);

  return { journalByDate, updateJournal };
};
