import type { FC } from 'react';
import { useAuth } from './useAuth';
import { LogOut, LogIn } from 'lucide-react';

export const AccountPage: FC = () => {
  const { user, signIn, signOut } = useAuth();

  return (
    <div className="flex flex-col h-full px-5 pt-14">
      <h1 className="text-lg font-bold text-stone-800 mt-0.5 mb-6">Account</h1>

      {user ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-stone-200" />
            )}
            <div>
              <p className="text-sm text-stone-700">{user.displayName}</p>
              <p className="text-[11px] text-stone-400">{user.email}</p>
            </div>
          </div>

          <p className="text-[11px] text-stone-400">Your data is synced across devices.</p>

          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-stone-500">Sign in to sync your tasks, notes, and journal across devices.</p>

          <button
            onClick={signIn}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <LogIn size={14} />
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
};
