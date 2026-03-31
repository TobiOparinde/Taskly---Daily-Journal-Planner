import { useState } from 'react';
import type { FC } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthDays, getStartPadding } from './dateUtils';
import { format, isSameDay } from 'date-fns';

interface Props {
  title: string;
  selected: Date;
  onSelect: (d: Date) => void;
  hasDot: (d: Date) => boolean;
}

export const CalendarGrid: FC<Props> = ({ title, selected, onSelect, hasDot }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const days = getMonthDays(year, month);
  const startPad = getStartPadding(year, month);

  const prevMonth = () => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
  const nextMonth = () => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1);

  return (
    <div className="px-5 pt-5 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] text-stone-400 font-medium tracking-wide uppercase">
            {format(new Date(year, month), 'MMMM yyyy')}
          </p>
          <h1 className="text-lg font-bold text-stone-800 mt-0.5">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 rounded border border-stone-200 text-stone-500 hover:bg-stone-50"><ChevronLeft size={14} /></button>
          <button onClick={nextMonth} className="p-1 rounded border border-stone-200 text-stone-500 hover:bg-stone-50"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] font-semibold text-stone-400 text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
        {days.map(d => {
          const isToday = isSameDay(d, now);
          const isSel = isSameDay(d, selected);
          const dot = hasDot(d);
          return (
            <button key={d.toISOString()} onClick={() => onSelect(d)}
              className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${isSel ? 'bg-stone-700 text-white' : isToday ? 'bg-stone-200 text-stone-700' : 'hover:bg-stone-100 text-stone-700'}`}>
              <span className="text-xs font-medium">{d.getDate()}</span>
              {dot && <span className={`w-1 h-1 rounded-full mt-0.5 ${isSel ? 'bg-stone-300' : 'bg-stone-400'}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
