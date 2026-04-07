import { useState, useCallback, useMemo } from 'react';
import type { FC } from 'react';
import type { Task } from './types';
import { TaskModal } from './TaskModal';
import { QuoteFooter } from './QuoteFooter';
import { CalendarGrid } from './CalendarGrid';
import { Plus, Check } from 'lucide-react';
import { toDateStr, getMonthDays } from './dateUtils';
import { format } from 'date-fns';

interface Props {
  tasks: Task[];
  onAdd: (data: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void;
  onUpdate: (id: string, changes: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export const CalendarPage: FC<Props> = ({ tasks, onAdd, onUpdate, onToggle }) => {
  const [selected, setSelected] = useState<Date>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const year = selected.getFullYear();
  const month = selected.getMonth();

  const monthTasks = useMemo(() => {
    const days = getMonthDays(year, month);
    const monthStrs = days.map(d => toDateStr(d));
    return tasks
      .filter(t => t.source === 'calendar' && monthStrs.includes(t.date))
      .sort((a, b) => {
        const dateA = typeof a.date === 'string' ? a.date : '';
        const dateB = typeof b.date === 'string' ? b.date : '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return 0;
      });
  }, [tasks, year, month]);

  const done = monthTasks.filter(t => t.completed).length;
  const total = monthTasks.length;

  const hasDot = useCallback((d: Date) => tasks.some(t => t.source === 'calendar' && t.date === toDateStr(d)), [tasks]);

  // Group tasks by date
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    monthTasks.forEach(t => {
      const list = map.get(t.date) || [];
      list.push(t);
      map.set(t.date, list);
    });
    return Array.from(map.entries());
  }, [monthTasks]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CalendarGrid title="Calendar" selected={selected} onSelect={setSelected} hasDot={hasDot} />

      <div className="h-3 flex-shrink-0" />

      <div className="flex-1 flex flex-col px-5 pb-2 min-h-0">
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">Monthly Goals</p>
            {total > 0 && (
              <p className="text-[10px] text-stone-400 mt-0.5">{done}/{total} completed</p>
            )}
          </div>
          <button
            onClick={() => { setEditTask(null); setModalOpen(true); }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
            aria-label="Add task"
          >
            <Plus size={12} />
          </button>
        </div>

        {total === 0
          ? <p className="text-sm text-stone-300 italic text-center py-8">No goals this month — tap + to add one</p>
          : (
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3">
              {grouped.map(([dateStr, dateTasks]) => (
                <div key={dateStr}>
                  <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1">
                    {format(new Date(dateStr + 'T00:00:00'), 'EEE d')}
                  </p>
                  <div className="space-y-0.5">
                    {dateTasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2.5 py-1.5 group cursor-pointer"
                        onClick={() => onToggle(task.id)}
                      >
                        <span className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 ${
                          task.completed
                            ? 'bg-stone-600 border-stone-600'
                            : 'border-stone-300 bg-transparent'
                        }`}>
                          {task.completed && <Check size={10} className="text-white" strokeWidth={3} />}
                        </span>
                        <span className={`text-sm transition-colors duration-300 ${
                          task.completed ? 'text-stone-400 line-through' : 'text-stone-700'
                        }`} style={{ fontFamily: "'Georgia', serif" }}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <QuoteFooter />

      {modalOpen && (
        <TaskModal task={editTask} defaultDate={toDateStr(selected)}
          onSave={(data) => onAdd({ ...data, source: 'calendar' })} onUpdate={onUpdate} hideRank
          onClose={() => { setModalOpen(false); setEditTask(null); }} />
      )}
    </div>
  );
};
