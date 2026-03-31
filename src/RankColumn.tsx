import type { FC } from 'react';
import type { Task, RankCategory, Rank } from './types';
import { TaskCard } from './TaskCard';

interface Props {
  category: RankCategory;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const cfg = {
  A: { label: 'A — High',   bg: 'bg-stone-50/70', header: 'text-stone-600', badge: 'bg-stone-100 text-stone-500', dot: 'bg-stone-300' },
  B: { label: 'B — Medium', bg: 'bg-stone-50/70', header: 'text-stone-600', badge: 'bg-stone-100 text-stone-500', dot: 'bg-stone-300' },
  C: { label: 'C — Low',    bg: 'bg-stone-50/70', header: 'text-stone-600', badge: 'bg-stone-100 text-stone-500', dot: 'bg-stone-300' },
};

const levelLabel: Record<string, string> = { '1': 'Urgent', '2': 'Important', '3': 'Optional' };

export const RankColumn: FC<Props> = ({ category, tasks, onToggle, onDelete, onEdit }) => {
  const c = cfg[category];
  const done = tasks.filter(t => t.completed).length;
  return (
    <div className={`rounded-2xl p-3 ${c.bg} min-w-[250px] w-[250px] flex-shrink-0 flex flex-col`}>
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
          <span className={`text-xs font-semibold tracking-wide ${c.header}`}>{c.label}</span>
        </div>
        {tasks.length > 0 && (
          <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${c.badge}`}>
            {done}/{tasks.length}
          </span>
        )}
      </div>
      <div className="overflow-y-auto scrollbar-hide">
        {(['1', '2', '3'] as const).map(level => {
          const rank = `${category}${level}` as Rank;
          const levelTasks = tasks.filter(t => t.rank === rank);
          return (
            <div key={level} className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1.5 px-0.5">
                {category}{level} · {levelLabel[level]}
              </p>
              {levelTasks.length === 0
                ? <p className="text-[10px] text-stone-300 italic px-0.5 pb-1">Empty</p>
                : levelTasks.map(task => (
                    <TaskCard key={task.id} task={task}
                      onToggle={() => onToggle(task.id)}
                      onDelete={() => onDelete(task.id)}
                      onEdit={() => onEdit(task)} />
                  ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
