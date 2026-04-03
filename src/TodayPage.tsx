import { useState } from 'react';
import type { FC } from 'react';
import type { Task, DailyJournalEntry } from './types';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { QuoteFooter } from './QuoteFooter';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useJournal } from './useJournal';
import { toDateStr } from './dateUtils';
import { addDays, format, isFuture, isToday, isTomorrow, isYesterday } from 'date-fns';

interface Props {
  tasks: Task[];
  onAdd: (data: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void;
  onUpdate: (id: string, changes: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const createEmptyJournal = (): DailyJournalEntry => ({
  gratitude: ['', '', ''],
  affirmation: '',
  reflection: '',
});

const weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const TodayPage: FC<Props> = ({ tasks, onAdd, onUpdate, onDelete, onToggle }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { journalByDate, updateJournal: updateJournalHook } = useJournal();
  const selectedDateStr = toDateStr(selectedDate);
  const todayTasks = tasks.filter(t => t.date === selectedDateStr);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const sortedTasks = [...todayTasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    const rankA = typeof a.rank === 'string' ? a.rank : 'Z9';
    const rankB = typeof b.rank === 'string' ? b.rank : 'Z9';
    return rankA.localeCompare(rankB);
  });

  const done = todayTasks.filter(t => t.completed).length;
  const total = todayTasks.length;
  const emptyRows = Math.max(0, 9 - total);
  const weekIndex = (selectedDate.getDay() + 6) % 7;
  const journal = journalByDate[selectedDateStr] ?? createEmptyJournal();
  const isViewingToday = isToday(selectedDate);
  const heading = isViewingToday
    ? 'Today'
    : isYesterday(selectedDate)
      ? 'Yesterday'
      : isTomorrow(selectedDate)
        ? 'Tomorrow'
        : isFuture(selectedDate)
          ? 'Planner'
          : 'Archive';

  const updateJournal = (updater: (entry: DailyJournalEntry) => DailyJournalEntry) => {
    updateJournalHook(selectedDateStr, updater);
  };

  const updateGratitude = (index: number, value: string) => {
    updateJournal(entry => {
      const gratitude = [...entry.gratitude] as DailyJournalEntry['gratitude'];
      gratitude[index] = value;
      return { ...entry, gratitude };
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-5 space-y-[22px] flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] text-stone-400 font-medium tracking-wide uppercase">
              {format(selectedDate, 'EEEE, d MMMM yyyy')}
            </p>
            <h1 className="text-lg font-bold text-stone-800 mt-0.5">{heading}</h1>
          </div>
          <div className="flex flex-col items-end gap-1.5 mt-0.5">
            <div className="flex items-center gap-1.5 text-[10px] tracking-widest text-stone-400">
                {weekLabels.map((label, idx) => (
                  <span key={`${label}${idx}`} className={idx === weekIndex ? 'text-stone-700 font-semibold' : ''}>
                    {label}
                  </span>
                ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedDate(prev => addDays(prev, -1))}
                className="p-1 rounded border border-stone-200 text-stone-500 hover:bg-stone-50"
                aria-label="Go to previous day"
              >
                <ChevronLeft size={14} />
              </button>
              {!isViewingToday && (
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="text-[10px] px-2 py-1 rounded border border-stone-200 text-stone-500 hover:bg-stone-50"
                >
                  Today
                </button>
              )}
              <button
                onClick={() => setSelectedDate(prev => addDays(prev, 1))}
                className="p-1 rounded border border-stone-200 text-stone-500 hover:bg-stone-50"
                aria-label="Go to next day"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <section>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-500 mb-1">3 things to be grateful for...</p>
          <div className="space-y-1">
            {[0, 1, 2].map(idx => (
              <label key={idx} className="flex items-center gap-1 border-b border-stone-300/60 pb-0.5">
                <span className="text-xs text-stone-400 w-3.5">{idx + 1}.</span>
                <input
                  value={journal.gratitude[idx]}
                  onChange={e => updateGratitude(idx, e.target.value)}
                  placeholder=""
                  className="w-full bg-transparent text-xs text-stone-700 placeholder-stone-300 focus:outline-none"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="!mt-[26px]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-500 mb-1">Daily affirmations. I am...</p>
          <label className="flex items-center border-b border-stone-300/60 pb-0.5">
            <input
              value={journal.affirmation}
              onChange={e => updateJournal(entry => ({ ...entry, affirmation: e.target.value }))}
              className="w-full bg-transparent text-xs text-stone-700 placeholder-stone-300 focus:outline-none"
              placeholder=""
            />
          </label>
        </section>
      </div>

      <div className="mt-[26px] flex-1 flex flex-col gap-3 px-5 min-h-0 pb-2">
        <section className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">Today's tasks / notes</p>
            <button
              onClick={() => { setEditTask(null); setModalOpen(true); }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
              aria-label="Add task"
            >
              <Plus size={12} />
            </button>
          </div>
          <div className="text-xs text-stone-400 mb-1.5">tasks today: {done}/{total}</div>
          <div
            className="flex-1 min-h-0 pr-1 overflow-y-auto hide-scrollbar"
            style={{ backgroundAttachment: 'local', backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 33px, rgba(120, 113, 108, 0.2) 33px, rgba(120, 113, 108, 0.2) 34px)' }}
          >
            {sortedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => onToggle(task.id)}
                onDelete={() => onDelete(task.id)}
                onEdit={() => { setEditTask(task); setModalOpen(true); }}
              />
            ))}
            {total > 0 && (
              <div
                className="h-[34px] flex items-center gap-2 text-stone-300 opacity-45 cursor-pointer"
                onClick={() => { setEditTask(null); setModalOpen(true); }}
              >
                <span className="w-4 h-[34px] flex items-center justify-center translate-y-px">
                  <span className="w-[10px] h-[10px] rounded-full border border-stone-400/70" />
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-stone-400 text-sm leading-none font-light">+</span>
                </div>
                <span className="relative w-8 h-[34px] flex-shrink-0">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 border-l border-stone-300/45" />
                </span>
              </div>
            )}
            {Array.from({ length: emptyRows }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className={`h-[34px] flex items-center gap-2 text-stone-300 opacity-45${total === 0 && idx === 0 ? ' cursor-pointer' : ''}`}
                onClick={total === 0 && idx === 0 ? () => { setEditTask(null); setModalOpen(true); } : undefined}
              >
                <span className="w-4 h-[34px] flex items-center justify-center translate-y-px">
                  <span className="w-[10px] h-[10px] rounded-full border border-stone-400/70" />
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-stone-300">
                    {total === 0 && idx === 0 ? 'Tap here or press + to add your first task.' : '\u00A0'}
                  </span>
                </div>
                <span className="relative w-8 h-[34px] flex-shrink-0">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 border-l border-stone-300/45" />
                </span>
              </div>
            ))}
            <div className="h-[34px] flex items-center gap-2 text-stone-300 opacity-45" aria-hidden="true">
              <span className="w-4 h-[34px] flex items-center justify-center translate-y-px">
                <span className="w-[10px] h-[10px] rounded-full border border-stone-400/70" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-stone-300">&nbsp;</span>
              </div>
              <span className="relative w-8 h-[34px] flex-shrink-0">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 border-l border-stone-300/45" />
              </span>
            </div>
            <div className="h-[36px] flex items-center gap-2 text-stone-300 opacity-45" aria-hidden="true">
              <span className="w-4 h-[34px] flex items-center justify-center translate-y-px">
                <span className="w-[10px] h-[10px] rounded-full border border-stone-400/70" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-stone-300">&nbsp;</span>
              </div>
              <span className="relative w-8 h-[34px] flex-shrink-0">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 border-l border-stone-300/45" />
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="flex-shrink-0 px-5 pt-4 pb-1">
        <section>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-500 mb-1">Great things that happened today</p>
          <label className="flex items-center border-b border-stone-300/60 pb-0.5">
            <input
              value={journal.reflection}
              onChange={e => updateJournal(entry => ({ ...entry, reflection: e.target.value }))}
              className="w-full bg-transparent text-xs text-stone-700 placeholder-stone-300 focus:outline-none"
              placeholder=""
            />
          </label>
        </section>
      </div>

      <QuoteFooter dateStr={selectedDateStr} />

      {modalOpen && (
        <TaskModal task={editTask} defaultDate={selectedDateStr}
          onSave={onAdd} onUpdate={onUpdate}
          onClose={() => { setModalOpen(false); setEditTask(null); }} />
      )}
    </div>
  );
};
