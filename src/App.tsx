import { useState } from 'react';
import type { Page } from './types';
import { useTasks } from './useTasks';
import { useNotes } from './useNotes';
import { BottomNav } from './BottomNav';
import { TodayPage } from './TodayPage';
import { CalendarPage } from './CalendarPage';
import { NotesPage } from './NotesPage';

export default function App() {
  const [page, setPage] = useState<Page>('today');
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { getNoteForDate, saveNote } = useNotes();

  return (
    <div
      className="flex flex-col bg-[#faf8f5]"
      style={{ height: '100dvh', maxWidth: '480px', margin: '0 auto' }}
    >
      <div className="flex-1 overflow-hidden min-h-0">
        {page === 'today' && (
          <TodayPage
            tasks={tasks}
            onAdd={addTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onToggle={toggleTask}
          />
        )}
        {page === 'calendar' && (
          <CalendarPage
            tasks={tasks}
            onAdd={addTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onToggle={toggleTask}
          />
        )}
        {page === 'notes' && (
          <NotesPage getNoteForDate={getNoteForDate} saveNote={saveNote} />
        )}
      </div>
      <BottomNav current={page} onChange={setPage} />
    </div>
  );
}
