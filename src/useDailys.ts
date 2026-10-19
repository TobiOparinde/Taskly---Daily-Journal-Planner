import { useEffect, useState } from 'react';
import { generateId } from './storage';
import { toDateStr } from './dateUtils';
import { useAuth } from './useAuth';
import { db } from './firebase';
import { collection, doc, onSnapshot, runTransaction, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface Daily {
  id: string;
  title: string;
  createdOn: string;
  removedOn: string | null;
  completedDates: string[];
}

const KEY = 'taskly_dailys';

function loadDailys(key = KEY): Daily[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) || '[]');
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
  const { user, loading } = useAuth();
  const uid = user?.uid;
  const cacheKey = uid ? `${KEY}:${uid}` : KEY;
  const [storedItems, setDailys] = useState(() => loadDailys(cacheKey));
  const [loadedKey, setLoadedKey] = useState(cacheKey);
  const [syncReady, setSyncReady] = useState(!uid);
  const [syncError, setSyncError] = useState<string | null>(null);
  const items = loadedKey === cacheKey ? storedItems : [];
  const ready = !loading && loadedKey === cacheKey && syncReady;
  const [today, setToday] = useState(() => toDateStr(new Date()));

  useEffect(() => {
    if (!loading && loadedKey === cacheKey) localStorage.setItem(cacheKey, JSON.stringify(storedItems));
  }, [storedItems, cacheKey, loadedKey, loading]);

  useEffect(() => {
    if (loading) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    setDailys(loadDailys(cacheKey));
    setLoadedKey(cacheKey);
    setSyncReady(!uid);
    setSyncError(null);
    if (!uid) return;
    const fail = (error: unknown) => {
      console.error('Dailys sync failed:', error);
      if (active) setSyncError('Dailys could not sync. Check your connection and try reloading.');
    };
    const connect = async () => {
      // Claim legacy browser data once; never import it into a different account.
      const ownerKey = `${KEY}:legacy-owner`;
      const owner = localStorage.getItem(ownerKey);
      if (!owner) localStorage.setItem(ownerKey, uid);
      const legacy = !owner || owner === uid ? loadDailys() : [];
      const migratedKey = `${cacheKey}:migrated`;
      if (!localStorage.getItem(migratedKey)) {
        for (const item of legacy) {
          if (!active) return;
          const ref = doc(db, 'users', uid, 'dailys', item.id);
          await runTransaction(db, async transaction => {
            const existing = await transaction.get(ref);
            if (!existing.exists()) transaction.set(ref, item);
          });
        }
        if (!active) return;
        localStorage.setItem(migratedKey, 'true');
      }
      if (!active) return;
      unsubscribe = onSnapshot(collection(db, 'users', uid, 'dailys'), snapshot => {
        if (!active) return;
        setDailys(snapshot.docs.map(entry => ({ ...entry.data(), id: entry.id } as Daily)));
        setSyncReady(true);
        setSyncError(null);
      }, fail);
    };
    void connect().catch(fail);
    return () => { active = false; unsubscribe?.(); };
  }, [uid, cacheKey, loading]);

  const saveRemote = (operation: Promise<void>) => {
    void operation.catch(error => {
      console.error('Dailys write failed:', error);
      setSyncError('Your daily change could not sync. Reload before trying again.');
    });
  };

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
    ready,
    syncError,
    addDaily: (title: string) => {
      if (!ready || !title.trim()) return;
      const item: Daily = { id: generateId(), title: title.trim().slice(0, 200), createdOn: toDateStr(new Date()), removedOn: null, completedDates: [] };
      setDailys(items => [...items, item]);
      if (uid) saveRemote(setDoc(doc(db, 'users', uid, 'dailys', item.id), item));
    },
    removeDaily: (id: string) => {
      if (!ready) return;
      const removedOn = toDateStr(new Date());
      setDailys(items => items.map(item => item.id === id ? { ...item, removedOn } : item));
      if (uid) saveRemote(updateDoc(doc(db, 'users', uid, 'dailys', id), { removedOn }));
    },
    toggleDaily: (id: string) => {
      const now = toDateStr(new Date());
      setToday(now);
      const target = selectedDate ?? now;
      // History and future previews are read-only; only today's checks can change.
      if (!ready || target !== now) return;
      const item = items.find(item => item.id === id && item.createdOn <= target && !item.removedOn);
      if (!item) return;
      if (uid) saveRemote(updateDoc(doc(db, 'users', uid, 'dailys', id), {
        completedDates: item.completedDates.includes(target) ? arrayRemove(target) : arrayUnion(target),
      }));
      setDailys(items => items.map(item => item.id === id && item.createdOn <= target && !item.removedOn
        ? { ...item, completedDates: item.completedDates.includes(target)
          ? item.completedDates.filter(day => day !== target) : [...item.completedDates, target] } : item));
    },
  };
}
