import type { FC } from 'react';
import type { Page } from './types';
import { ListChecks, CalendarDays, FileText, UserRound, UserRoundCheck } from 'lucide-react';
import { useAuth } from './useAuth';

interface Props { current: Page; onChange: (p: Page) => void; }

const tabs = [
  { id: 'today' as Page,    label: 'Today',    Icon: ListChecks },
  { id: 'calendar' as Page, label: 'Calendar', Icon: CalendarDays },
  { id: 'notes' as Page,    label: 'Notes',    Icon: FileText },
];

export const BottomNav: FC<Props> = ({ current, onChange }) => {
  const { user, signIn, signOut } = useAuth();

  return (
    <nav
      className="flex-shrink-0 bg-[#faf8f5]/95 backdrop-blur-sm border-t border-stone-200 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ id, label, Icon }) => {
        const active = current === id;
        return (
          <button key={id} onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center pt-3 pb-2 gap-0.5 transition-colors ${active ? 'text-stone-700' : 'text-stone-400'}`}>
            <Icon size={20} />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
            {active && <span className="w-1 h-1 rounded-full bg-stone-500" />}
          </button>
        );
      })}
      <button
        onClick={user ? signOut : signIn}
        className={`flex-1 flex flex-col items-center pt-3 pb-2 gap-0.5 transition-colors ${user ? 'text-stone-700' : 'text-stone-400'}`}
      >
        {user ? <UserRoundCheck size={20} /> : <UserRound size={20} />}
        <span className="text-[10px] font-medium tracking-wide">{user ? 'Sync' : 'Sign in'}</span>
        {user && <span className="w-1 h-1 rounded-full bg-stone-500" />}
      </button>
    </nav>
  );
};
