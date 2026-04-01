import { useState } from 'react';
import type { Page } from './types';
import { useTasks } from './useTasks';
import { useNotes } from './useNotes';
import { BottomNav } from './BottomNav';
import { TodayPage } from './TodayPage';
import { CalendarPage } from './CalendarPage';
import { NotesPage } from './NotesPage';

const pageIndex: Record<Page, number> = { today: 0, calendar: 1, notes: 2 };

export default function App() {
  const [page, setPage] = useState<Page>('today');
  const [phase, setPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [displayPage, setDisplayPage] = useState<Page>('today');
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { getNoteForDate, saveNote } = useNotes();

  const handlePageChange = (next: Page) => {
    if (next === page || phase !== 'idle') return;
    const dir = pageIndex[next] > pageIndex[page] ? 'left' : 'right';
    setDirection(dir);
    setPhase('exit');
    setTimeout(() => {
      setDisplayPage(next);
      setPage(next);
      setPhase('enter');
      setTimeout(() => setPhase('idle'), 20);
    }, 180);
  };

  // Exit: slide out in the direction of travel
  // Enter: start offset on the incoming side, then animate to center
  const slideClass =
    phase === 'exit'
      ? direction === 'left'
        ? '-translate-x-[30%] opacity-0'
        : 'translate-x-[30%] opacity-0'
      : phase === 'enter'
        ? direction === 'left'
          ? 'translate-x-[30%] opacity-0 !duration-0'
          : '-translate-x-[30%] opacity-0 !duration-0'
        : 'translate-x-0 opacity-100';

  return (
    <div
      className="flex flex-col bg-[#faf8f5]"
      style={{ height: '100dvh', maxWidth: '480px', margin: '0 auto' }}
    >
      <div className="flex-1 overflow-hidden min-h-0">
        <div className={`h-full transition-all duration-200 ease-out ${slideClass}`}>
          {displayPage === 'today' && (
            <TodayPage
              tasks={tasks}
              onAdd={addTask}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onToggle={toggleTask}
            />
          )}
          {displayPage === 'calendar' && (
            <CalendarPage
              tasks={tasks}
              onAdd={addTask}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onToggle={toggleTask}
            />
          )}
          {displayPage === 'notes' && (
            <NotesPage getNoteForDate={getNoteForDate} saveNote={saveNote} />
          )}
        </div>
      </div>
      <BottomNav current={page} onChange={handlePageChange} />
    </div>
  );
}
