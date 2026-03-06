import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { useTheme } from '../context/ThemeContext';
import { usersApi, dialogsApi } from '../api';
import { Search } from 'lucide-react';
import { getAvatarColor } from '../lib/avatarColor';

type DialogItem = { id: string; created_at: string; other?: { id: string; name: string; email: string } };
type UserItem = { id: string; name: string; email: string };

function Avatar({ name }: { name: string }) {
  return (
    <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-semibold ${getAvatarColor(name)}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Dialogs() {
  const { hasGlassUI, customThemeColor } = useTheme();
  const useThemeCard = customThemeColor && !hasGlassUI;
  const [dialogs, setDialogs] = useState<DialogItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<'dialogs' | 'contacts'>('dialogs');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, u] = await Promise.all([dialogsApi.list(), usersApi.list()]);
        if (!cancelled) {
          setDialogs(d);
          setUsers(u);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const tabBase = 'flex-1 py-2 text-sm font-medium border-b-2 transition-colors duration-150';
  const tabActive = useThemeCard
    ? `${tabBase} border-indigo-400 text-indigo-300`
    : `${tabBase} border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400`;
  const tabInactive = useThemeCard
    ? `${tabBase} border-transparent text-slate-400 hover:text-slate-200`
    : `${tabBase} border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200`;

  const rowClass = useThemeCard
    ? 'flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer'
    : 'flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer';

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 min-w-0 flex-col">
        <AppHeader
          title="iMSITChat"
          showBack={false}
          showMenu={true}
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((o) => !o)}
        />

        <div className={`flex border-b shrink-0 ${useThemeCard ? 'border-white/10' : 'border-slate-200 dark:border-neutral-700'}`}
          style={useThemeCard ? { background: 'var(--theme-card)' } : undefined}
        >
          <button className={tab === 'dialogs' ? tabActive : tabInactive} onClick={() => setTab('dialogs')}>
            Чаты {dialogs.length > 0 && <span className="ml-1 text-xs opacity-60">({dialogs.length})</span>}
          </button>
          <button className={tab === 'contacts' ? tabActive : tabInactive} onClick={() => setTab('contacts')}>
            Контакты
          </button>
        </div>

        <main className={`flex-1 overflow-y-auto ${!useThemeCard ? 'bg-slate-50 dark:bg-neutral-900' : ''}`}
          style={useThemeCard ? { background: 'var(--theme-bg)' } : undefined}
        >
          {error && (
            <div className="mx-4 mt-3 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <span className={`text-sm ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>Загрузка...</span>
            </div>
          ) : tab === 'dialogs' ? (
            dialogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <p className={`text-sm ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>Нет активных чатов</p>
                <button
                  onClick={() => setTab('contacts')}
                  className="text-sm font-medium text-indigo-500 hover:text-indigo-400"
                >
                  Найти собеседника →
                </button>
              </div>
            ) : (
              <ul className="py-2">
                {dialogs.map((d) => (
                  <li key={d.id}>
                    <Link to={`/chat/${d.id}`} className={rowClass}>
                      <Avatar name={d.other?.name ?? '?'} />
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>
                          {d.other?.name ?? 'Диалог'}
                        </p>
                        <p className={`text-xs truncate ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {d.other?.email}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div>
              <div className="px-4 pt-3 pb-2">
                <button
                  onClick={() => navigate('/search')}
                  className={`w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-colors ${useThemeCard ? 'bg-white/10 text-slate-300 hover:bg-white/15' : 'bg-slate-200 dark:bg-neutral-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-neutral-600'}`}
                >
                  <Search className="h-4 w-4 shrink-0" />
                  Поиск пользователей...
                </button>
              </div>
              {users.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className={`text-sm ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>Нет других пользователей</p>
                </div>
              ) : (
                <ul className="py-1">
                  {users.map((u) => (
                    <li key={u.id}>
                      <Link to={`/user/${u.id}`} className={rowClass}>
                        <Avatar name={u.name} />
                        <div className="min-w-0">
                          <p className={`font-medium truncate ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>
                            {u.name}
                          </p>
                          <p className={`text-xs truncate ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {u.email}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </main>
      </div>

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
