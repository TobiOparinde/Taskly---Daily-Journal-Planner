import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import type { Note } from './types';
import { QuoteFooter } from './QuoteFooter';
import { CalendarGrid } from './CalendarGrid';
import { Save } from 'lucide-react';
import { toDateStr } from './dateUtils';
import { format } from 'date-fns';

interface Props {
  getNoteForDate: (dateStr: string) => Note | undefined;
  saveNote: (dateStr: string, content: string) => void;
}

export const NotesPage: FC<Props> = ({ getNoteForDate, saveNote }) => {
  const [selected, setSelected] = useState<Date>(new Date());
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(true);

  const selStr = toDateStr(selected);

  useEffect(() => {
    const note = getNoteForDate(selStr);
    setContent(note?.content || '');
    setSaved(true);
  }, [selStr, getNoteForDate]);

  const handleSave = useCallback(() => {
    saveNote(selStr, content);
    setSaved(true);
  }, [selStr, content, saveNote]);

  // Auto-save 2 seconds after last keystroke
  useEffect(() => {
    if (saved) return;
    const t = setTimeout(handleSave, 2000);
    return () => clearTimeout(t);
  }, [content, saved, handleSave]);

  const hasDot = useCallback((d: Date) => !!(getNoteForDate(toDateStr(d))?.content?.trim()), [getNoteForDate]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CalendarGrid title="Notes" selected={selected} onSelect={setSelected} hasDot={hasDot} />

      <div className="h-4 flex-shrink-0" />

      <div className="flex-1 flex flex-col px-5 pb-2 min-h-0">
        <div className="flex items-center justify-between mb-2 flex-shrink-0 h-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">{format(selected, 'EEEE, d MMMM')}</p>
          <div className="flex items-center gap-2">
            {!saved && <span className="text-[10px] text-stone-400 italic">editing…</span>}
            {saved && content.trim() && <span className="text-[10px] text-emerald-500 font-medium">✓ Saved</span>}
            <button onClick={handleSave}
              className="flex items-center gap-1.5 text-xs text-stone-500 px-2 py-1 rounded border border-stone-200 hover:bg-stone-50 transition-colors">
              <Save size={12} /> Save
            </button>
          </div>
        </div>
        <textarea value={content} onChange={e => { setContent(e.target.value); setSaved(false); }}
          placeholder={`Notes for ${format(selected, 'd MMMM')}…\n\nWrite anything — thoughts, plans, reflections.`}
          className="flex-1 bg-white/70 border border-stone-200 rounded-xl px-4 py-3.5 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none leading-relaxed min-h-0" />
      </div>

      <QuoteFooter />
    </div>
  );
};
