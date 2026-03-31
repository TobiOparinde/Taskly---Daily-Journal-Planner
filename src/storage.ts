import type { Task, Note, DailyJournalEntry } from './types';

const TASKS_KEY = 'ranked_tasks';
const NOTES_KEY = 'ranked_notes';
const DAILY_JOURNAL_KEY = 'ranked_daily_journal';

export const getTasks = (): Task[] => {
  try { return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'); }
  catch { return []; }
};
export const saveTasks = (tasks: Task[]): void =>
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));

export const getNotes = (): Note[] => {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); }
  catch { return []; }
};
export const saveNotes = (notes: Note[]): void =>
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));

export const getDailyJournal = (): Record<string, DailyJournalEntry> => {
  try { return JSON.parse(localStorage.getItem(DAILY_JOURNAL_KEY) || '{}'); }
  catch { return {}; }
};

export const saveDailyJournal = (data: Record<string, DailyJournalEntry>): void =>
  localStorage.setItem(DAILY_JOURNAL_KEY, JSON.stringify(data));

export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
