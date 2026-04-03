import { useRef, useState } from 'react';
import type { FC, TouchEvent } from 'react';
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

const DELETE_THRESHOLD = 80;

export const TaskCard: FC<Props> = ({ task, onToggle, onDelete, onEdit }) => {
  const cat = task.rank?.[0];
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef(false); // true = horizontal swipe locked in

  const onTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    locked.current = false;
    setSwiping(true);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (!locked.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) {
        setSwiping(false);
        setOffsetX(0);
        return;
      }
      if (Math.abs(dx) > 5) locked.current = true;
    }

    if (locked.current && dx < 0) {
      setOffsetX(dx);
    }
  };

  const onTouchEnd = () => {
    if (!swiping) return;
    setSwiping(false);
    if (offsetX < -DELETE_THRESHOLD) {
      setDismissed(true);
      setTimeout(onDelete, 250);
    } else {
      setOffsetX(0);
    }
  };

  const showDelete = offsetX < -30;

  return (
    <div className={`relative transition-all duration-250 ease-out ${dismissed ? 'h-0 overflow-hidden opacity-0' : 'h-[34px]'} ${offsetX < 0 ? 'overflow-hidden' : ''}`}>
      {/* Delete background — only rendered when swiping */}
      {offsetX < 0 && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-3 bg-red-500 w-full">
          <Trash2 size={14} className="text-white" />
        </div>
      )}

      {/* Foreground card */}
      <div
        className={`relative h-[34px] group flex items-center gap-2 ${task.completed ? 'bg-stone-200/25' : ''}`}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease-out',
          backgroundColor: offsetX < 0 ? '#faf8f5' : undefined,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
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
        <div className="flex-1 min-w-0 flex items-center gap-2 translate-y-px overflow-x-auto hide-scrollbar">
          <div className="relative whitespace-nowrap flex-shrink-0">
            <p className={`text-sm font-medium text-stone-800 transition-colors duration-300 ${task.completed ? 'text-stone-500' : ''}`}>
              {task.title}
            </p>
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute left-0 top-1/2 h-px bg-stone-500/70 transition-all duration-300 ${task.completed ? 'w-full opacity-100' : 'w-0 opacity-0'}`}
            />
          </div>
          {task.description && (
            <p className={`text-xs whitespace-nowrap flex-shrink-0 transition-colors duration-300 ${task.completed ? 'text-stone-400' : 'text-stone-500'}`}>- {task.description}</p>
          )}
        </div>
        <div className="relative w-8 h-[34px] flex-shrink-0">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 border-l border-stone-300/45" />
          <div className="absolute inset-y-0 left-0 right-0 pl-2 pr-0.5 flex items-center justify-center translate-y-px">
            <span className={`text-[10px] font-semibold tracking-widest px-1 py-[1px] rounded-sm group-hover:hidden ${cat ? priorityColor[cat] : ''}`}>
              {task.rank ? `${cat}${task.rank[1]}` : ''}
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
    </div>
  );
};
