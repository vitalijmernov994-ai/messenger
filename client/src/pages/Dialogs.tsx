import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { useTheme } from '../context/ThemeContext';
import { usersApi, dialogsApi } from '../api';

type DialogItem = { id: string; created_at: string; other?: { id: string; name: string; email: string } };
type UserItem = { id: string; name: string; email: string };

const cardClass = (glass: boolean, hasColor: boolean) =>
  glass
    ? 'rounded-xl p-4 shadow-sm transition-colors duration-200 glass-panel'
    : hasColor
      ? 'rounded-xl p-4 shadow-sm transition-colors duration-200'
      : 'rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-800 dark:border dark:border-neutral-600 dark:shadow-lg dark:shadow-black/30 transition-colors duration-200';

export default function Dialogs() {
  const { hasGlassUI, customThemeColor } = useTheme();
  const useThemeCard = customThemeColor && !hasGlassUI;
  const [dialogs, setDialogs] = useState<DialogItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

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

        <main className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-lg bg-red-100 px-4 py-2 text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className={cardClass(hasGlassUI, !!customThemeColor) + ' p-8 text-center'} style={customThemeColor && !hasGlassUI ? { background: 'var(--theme-card)' } : undefined}>
              <span className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>Загрузка диалогов...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <section className={cardClass(hasGlassUI, !!customThemeColor)} style={customThemeColor && !hasGlassUI ? { background: 'var(--theme-card)' } : undefined}>
                <h2 className={`mb-3 font-medium ${useThemeCard ? 'text-slate-100' : 'text-slate-700 dark:text-slate-200'}`}>Мои диалоги</h2>
                {dialogs.length === 0 ? (
                  <p className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>Пока нет диалогов. Выберите пользователя в поиске или в списке ниже.</p>
                ) : (
                  <ul className="space-y-2">
                    {dialogs.map((d) => (
                      <li key={d.id}>
                        <Link
                          to={`/chat/${d.id}`}
                          className={`block rounded-xl border p-3 transition-colors duration-200 ${useThemeCard ? 'border-white/20 hover:bg-white/10 text-slate-100' : 'border-slate-200 hover:bg-slate-50 dark:border-neutral-600 dark:bg-neutral-700/80 dark:hover:bg-neutral-600 dark:text-slate-100'}`}
                        >
                          <span className="font-medium text-slate-800 dark:text-white">{d.other?.name ?? 'Диалог'}</span>
                          <span className={`ml-2 text-sm ${useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}`}>{d.other?.email}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className={cardClass(hasGlassUI, !!customThemeColor)} style={customThemeColor && !hasGlassUI ? { background: 'var(--theme-card)' } : undefined}>
                <h2 className={`mb-3 font-medium ${useThemeCard ? 'text-slate-100' : 'text-slate-700 dark:text-slate-200'}`}>Начать диалог</h2>
                {users.length === 0 ? (
                  <p className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>Нет других пользователей.</p>
                ) : (
                  <ul className="space-y-2">
                    {users.map((u) => (
                      <li key={u.id}>
                        <Link
                          to={`/user/${u.id}`}
                          className={`block w-full rounded-xl border p-3 text-left transition-colors duration-200 ${useThemeCard ? 'border-white/20 hover:bg-white/10 text-slate-100' : 'border-slate-200 hover:bg-slate-50 dark:border-neutral-600 dark:bg-neutral-700/80 dark:hover:bg-neutral-600 dark:text-slate-100'}`}
                        >
                          <span className="font-medium text-slate-800 dark:text-white">{u.name}</span> <span className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}>{u.email}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
