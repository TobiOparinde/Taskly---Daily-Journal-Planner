import type { FC } from 'react';
import type { Task } from './types';
import { Trash2, Edit3, Check } from 'lucide-react';

interface Props {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const priorityColor: Record<string, string> = {
  A: 'text-rose-300',
  B: 'text-amber-300',
  C: 'text-emerald-300',
};

export const TaskCard: FC<Props> = ({ task, onToggle, onDelete, onEdit }) => {
  const rank = typeof task.rank === 'string' ? task.rank : '';
  const cat = rank[0];
  const level = rank[1];
  const rankLabel = cat && level ? `${cat}${level}` : '';
  const badgeColor = cat && priorityColor[cat] ? priorityColor[cat] : 'text-stone-300';
  return (
    <div className={`group h-[34px] flex items-center gap-2 transition-all duration-300 ${task.completed ? 'bg-stone-200/25' : ''}`}>
      <button
        onClick={onToggle}
        className="w-4 h-[34px] flex items-center justify-center flex-shrink-0 text-stone-400 hover:text-stone-500 transition-colors translate-y-px"
      >
        <span
          className={`relative flex items-center justify-center w-[10px] h-[10px] rounded-full border transition-all duration-300 ${task.completed ? 'bg-stone-600 border-stone-600 text-stone-100' : 'border-stone-400 bg-transparent text-transparent'}`}
        >
          {task.completed && <Check size={8} className="absolute" strokeWidth={3} />}
        </span>
      </button>
      <div className="flex-1 min-w-0 flex items-center gap-2 translate-y-px overflow-hidden">
        <div className="relative overflow-x-auto hide-scrollbar">
          <p className={`text-sm font-medium text-stone-800 transition-colors duration-300 whitespace-nowrap ${task.completed ? 'text-stone-500' : ''}`}>
            {task.title}
          </p>
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-0 top-1/2 h-px bg-stone-500/70 transition-all duration-300 ${task.completed ? 'w-full opacity-100' : 'w-0 opacity-0'}`}
          />
        </div>
        {task.description && (
          <p className={`text-xs truncate flex-shrink transition-colors duration-300 ${task.completed ? 'text-stone-400' : 'text-stone-500'}`}>- {task.description}</p>
        )}
      </div>
      <div className="relative w-8 h-[34px] flex-shrink-0">
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 border-l border-stone-300/45" />
        <div className="absolute inset-y-0 left-0 right-0 pl-2 pr-0.5 flex items-center justify-center translate-y-px">
          <span className={`text-[10px] font-semibold tracking-widest px-1 py-[1px] rounded-sm group-hover:hidden ${badgeColor}`}>
            {rankLabel}
          </span>
          <div className="hidden group-hover:flex items-center gap-1">
            <button onClick={onEdit} className="p-0.5 rounded hover:bg-stone-100/70 text-stone-400 hover:text-stone-600 transition-colors">
              <Edit3 size={12} />
            </button>
            <button onClick={onDelete} className="p-0.5 rounded hover:bg-stone-100/70 text-stone-400 hover:text-stone-600 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
