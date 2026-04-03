import { useState, useEffect, useRef } from 'react';
import type { FC, FormEvent } from 'react';
import type { Task, Rank } from './types';
import { X } from 'lucide-react';

const RANKS: Rank[] = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

const rankStyle: Record<string, string> = {
  A1: 'bg-red-100 text-red-700 ring-red-300',
  A2: 'bg-red-50 text-red-600 ring-red-200',
  A3: 'bg-red-50 text-red-400 ring-red-100',
  B1: 'bg-amber-100 text-amber-700 ring-amber-300',
  B2: 'bg-amber-50 text-amber-600 ring-amber-200',
  B3: 'bg-amber-50 text-amber-500 ring-amber-100',
  C1: 'bg-green-100 text-green-700 ring-green-300',
  C2: 'bg-green-50 text-green-600 ring-green-200',
  C3: 'bg-green-50 text-green-500 ring-green-100',
};

interface Props {
  task?: Task | null;
  defaultDate: string;
  onSave: (data: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
  onClose: () => void;
  hideRank?: boolean;
}

export const TaskModal: FC<Props> = ({ task, defaultDate, onSave, onUpdate, onClose, hideRank }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rank, setRank] = useState<Rank | null>(task?.rank ?? null);
  const [date, setDate] = useState(defaultDate);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setRank(task.rank ?? null);
      setDate(task.date);
    }
  }, [task]);

  // Trigger slide-up on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (task) {
      onUpdate(task.id, { title: title.trim(), description: description.trim() || undefined, rank: rank ?? undefined, date });
    } else {
      onSave({ title: title.trim(), description: description.trim() || undefined, rank: rank ?? undefined, date });
    }
    setVisible(false);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center transition-colors duration-300"
      style={{ backgroundColor: visible ? 'rgba(0,0,0,0.25)' : 'transparent' }}
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        className="w-full max-w-lg bg-[#faf8f5] rounded-t-2xl p-6 shadow-2xl transition-transform duration-300 ease-out"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-stone-800">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-stone-100 text-stone-400">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-white/80 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional details..." rows={2}
              className="w-full bg-white/80 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none" />
          </div>
          {!hideRank && (
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-2">Rank</label>
              <div className="grid grid-cols-3 gap-2">
                {RANKS.map(r => (
                  <button key={r} type="button" onClick={() => setRank(r)}
                    className={`py-2 rounded-xl text-xs font-semibold tracking-wider ring-1 transition-all ${rankStyle[r]} ${rank === r ? 'ring-2 scale-105 shadow-sm' : 'opacity-50'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-white/80 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
          <button type="submit"
            className="w-full bg-stone-700 hover:bg-stone-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-sm">
            {task ? 'Save Changes' : 'Add Task'}
          </button>
        </form>
      </div>
    </div>
  );
};
