import { useState } from 'react';
import type { Page } from './types';
import { useTasks } from './useTasks';
import { useNotes } from './useNotes';
import { BottomNav } from './BottomNav';
import { TodayPage } from './TodayPage';
import { CalendarPage } from './CalendarPage';
import { NotesPage } from './NotesPage';
import { AccountPage } from './AccountPage';

export default function App() {
  const [page, setPage] = useState<Page>('today');
  const [displayPage, setDisplayPage] = useState<Page>('today');
  const [fading, setFading] = useState(false);
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { getNoteForDate, saveNote } = useNotes();

  const handlePageChange = (next: Page) => {
    if (next === page || fading) return;
    setFading(true);
    setTimeout(() => {
      setDisplayPage(next);
      setPage(next);
      setFading(false);
    }, 150);
  };

  return (
    <div
      className="flex flex-col bg-[#faf8f5]"
      style={{ height: '100dvh', maxWidth: '480px', margin: '0 auto' }}
    >
      <div className="flex-1 overflow-hidden min-h-0">
        <div className={`h-full transition-opacity duration-150 ease-out ${fading ? 'opacity-0' : 'opacity-100'}`}>
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
          {displayPage === 'account' && (
            <AccountPage />
          )}
        </div>
      </div>
      <BottomNav current={page} onChange={handlePageChange} />
    </div>
  );
}
