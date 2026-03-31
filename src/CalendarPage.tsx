import { useState, useCallback } from 'react';
import type { FC } from 'react';
import type { Task } from './types';
import { RankColumn } from './RankColumn';
import { TaskModal } from './TaskModal';
import { QuoteFooter } from './QuoteFooter';
import { CalendarGrid } from './CalendarGrid';
import { Plus } from 'lucide-react';
import { toDateStr } from './dateUtils';
import { format } from 'date-fns';

interface Props {
  tasks: Task[];
  onAdd: (data: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void;
  onUpdate: (id: string, changes: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export const CalendarPage: FC<Props> = ({ tasks, onAdd, onUpdate, onDelete, onToggle }) => {
  const [selected, setSelected] = useState<Date>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const selStr = toDateStr(selected);
  const selTasks = tasks.filter(t => t.date === selStr);

  const hasDot = useCallback((d: Date) => tasks.some(t => t.date === toDateStr(d)), [tasks]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CalendarGrid title="Calendar" selected={selected} onSelect={setSelected} hasDot={hasDot} />

      <div className="h-4 flex-shrink-0" />

      <div className="flex-1 flex flex-col px-5 pb-2 min-h-0">
        <div className="flex items-center justify-between mb-2 flex-shrink-0 h-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">{format(selected, 'EEEE, d MMMM')}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">{selTasks.length} tasks</span>
            <button
              onClick={() => { setEditTask(null); setModalOpen(true); }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
              aria-label="Add task"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
        {selTasks.length === 0
          ? <p className="text-sm text-stone-300 italic text-center py-8">No tasks — tap + to add one</p>
          : (
            <div className="flex gap-3 pb-3 overflow-x-auto scrollbar-hide">
              {(['A', 'B', 'C'] as const).map(cat => (
                <RankColumn key={cat} category={cat}
                  tasks={selTasks.filter(t => t.rank?.[0] === cat)}
                  onToggle={onToggle} onDelete={onDelete}
                  onEdit={t => { setEditTask(t); setModalOpen(true); }} />
              ))}
            </div>
          )}
      </div>

      <QuoteFooter />

      {modalOpen && (
        <TaskModal task={editTask} defaultDate={selStr}
          onSave={onAdd} onUpdate={onUpdate}
          onClose={() => { setModalOpen(false); setEditTask(null); }} />
      )}
    </div>
  );
};
