import { useState, useCallback } from 'react';
import type { FC, FormEvent } from 'react';
import type { Task } from './types';
import { QuoteFooter } from './QuoteFooter';
import { CalendarGrid } from './CalendarGrid';
import { Plus, Trash2 } from 'lucide-react';
import { toDateStr } from './dateUtils';
import { useDailys } from './useDailys';
import { ScrollText } from './ScrollText';
import { format } from 'date-fns';

interface Props {
  tasks: Task[];
  onAdd: (data: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void;
  onUpdate: (id: string, changes: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export const CalendarPage: FC<Props> = ({ tasks }) => {
  const [chosenDate, setSelected] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const { dailys, today, addDaily, removeDaily, toggleDaily } = useDailys(chosenDate ? toDateStr(chosenDate) : undefined);
  const selected = chosenDate ?? new Date(today + 'T00:00:00');
  const selectedDate = toDateStr(selected);
  const isToday = selectedDate === today;
  const done = dailys.filter(item => item.completedOn === selectedDate).length;
  const hasDot = useCallback((d: Date) => tasks.some(t => t.source === 'calendar' && t.date === toDateStr(d)), [tasks]);

  const handleAdd = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    addDaily(title);
    setTitle('');
  };

  return (
    <div className="flex flex-col h-full min-w-0 overflow-hidden">
      <CalendarGrid title="Calendar" selected={selected} onSelect={setSelected} hasDot={hasDot} />
      <section aria-label="Dailys" className="flex-1 flex flex-col mx-4 sm:mx-5 mt-4 mb-2 pt-4 border-t border-stone-200 min-h-0 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3 flex-shrink-0 min-w-0">
          <div className="min-w-0 flex-1 basis-40">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">Dailys</h2>
            <p className="text-xs text-stone-500 mt-1">{isToday ? 'Today' : format(selected, 'EEE, d MMM yyyy')} · {isToday ? 'A fresh start each day.' : 'Read-only checklist'}</p>
          </div>
          {dailys.length > 0 && <p aria-live="polite" className="text-xs text-stone-500 whitespace-nowrap">{done}/{dailys.length} done</p>}
        </div>

        {isToday ? <form onSubmit={handleAdd} className="grid grid-cols-[minmax(0,1fr)_40px] gap-2 mb-3 flex-shrink-0 min-w-0 p-0.5">
          <input aria-label="New daily" value={title} onChange={event => setTitle(event.target.value)} maxLength={200}
            placeholder="Add a daily, e.g. Take vitamin"
            className="w-full min-w-0 rounded-xl border border-stone-200 bg-white/70 px-3 py-2.5 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-stone-300" />
          <button type="submit" aria-label="Add daily" disabled={!title.trim()}
            className="flex items-center justify-center rounded-xl bg-stone-700 text-white hover:bg-stone-800 disabled:opacity-40 transition-colors"><Plus size={18} /></button>
        </form> : <button onClick={() => setSelected(null)} className="self-start text-xs text-stone-600 underline underline-offset-4 mb-3">Back to today</button>}

        <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar min-h-0 min-w-0">
          {dailys.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 text-center px-4 py-6">
              <p className="text-sm text-stone-600">Small habits, every day.</p>
              <p className="text-xs text-stone-400 mt-1">{isToday ? 'Add your first daily above. It will appear from today onward.' : 'No dailys scheduled for this date.'}</p>
            </div>
          ) : (
            <ul className="space-y-2 pb-2">
              {dailys.map(item => {
                const checked = item.completedOn === selectedDate;
                return (
                  <li key={item.id} className="flex min-w-0 items-center gap-3 pl-3 pr-1 py-1.5 rounded-xl border border-stone-200 bg-white/50">
                    <input aria-label={item.title} type="checkbox" checked={checked} disabled={!isToday} onChange={() => toggleDaily(item.id)} className="w-4 h-4 flex-shrink-0 accent-stone-700 cursor-pointer disabled:cursor-default" />
                    <ScrollText label={item.title} className={`py-1 text-sm ${checked ? 'text-stone-400 line-through' : 'text-stone-700'}`}>{item.title}</ScrollText>
                    {isToday && <button aria-label={`Remove ${item.title}`} onClick={() => removeDaily(item.id)} className="flex-shrink-0 p-2.5 text-stone-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
      <QuoteFooter />
    </div>
  );
};
