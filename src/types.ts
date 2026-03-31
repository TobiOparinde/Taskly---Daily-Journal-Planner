export type RankCategory = 'A' | 'B' | 'C';
export type RankLevel = '1' | '2' | '3';
export type Rank = `${RankCategory}${RankLevel}`;

export interface Task {
  id: string;
  title: string;
  description?: string;
  rank?: Rank;
  completed: boolean;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Note {
  id: string;
  date: string;
  content: string;
  updatedAt: string;
}

export interface DailyJournalEntry {
  gratitude: [string, string, string];
  affirmation: string;
  reflection: string;
}

export type Page = 'today' | 'calendar' | 'notes';
