import { useState, useEffect } from 'react';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { useTheme } from '../context/ThemeContext';
import { adminApi } from '../api';

type UserRow = { id: string; email: string; name: string; role: string; created_at: string; is_banned: boolean };
type BannedRow = { email: string; reason: string | null; banned_at: string; banned_by: string | null; user_id: string | null; user_name: string | null };

export default function Admin() {
  const { customThemeColor } = useTheme();
  const useThemeCard = !!customThemeColor;
  const [users, setUsers] = useState<UserRow[]>([]);
  const [banned, setBanned] = useState<BannedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBanned, setLoadingBanned] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<'users' | 'banned'>('users');

  useEffect(() => {
    let cancelled = false;
    adminApi
      .listUsers()
      .then((list) => { if (!cancelled) setUsers(list); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function refreshBanned() {
    setLoadingBanned(true);
    try {
      const list = await adminApi.listBannedEmails();
      setBanned(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoadingBanned(false);
    }
  }

  useEffect(() => {
    if (tab !== 'banned') return;
    refreshBanned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('ru-RU');
  }

  async function ban(email: string) {
    const reason = window.prompt('Причина бана (необязательно):', '');
    try {
      await adminApi.banEmail(email, reason === null ? null : (reason.trim() || null));
      const next = await adminApi.listUsers();
      setUsers(next);
      if (tab === 'banned') await refreshBanned();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  async function unban(email: string) {
    if (!window.confirm(`Разбанить ${email}?`)) return;
    try {
      await adminApi.unbanEmail(email);
      const next = await adminApi.listUsers();
      setUsers(next);
      if (tab === 'banned') await refreshBanned();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  const tabButtonBase = useThemeCard
    ? 'rounded-xl px-3 py-1.5 text-sm transition-colors'
    : 'rounded-xl px-3 py-1.5 text-sm transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-neutral-700 dark:hover:bg-neutral-600';
  const tabActive = useThemeCard
    ? 'bg-white/10 text-slate-100'
    : 'bg-slate-900 text-white dark:bg-neutral-100 dark:text-neutral-900';

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 min-w-0 flex-col">
        <AppHeader
          title="Админ-панель"
          showBack
          showMenu
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((o) => !o)}
        />

        <main className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-4xl">
      {error && (
        <div className="mb-4 rounded-xl bg-red-100 px-4 py-2 text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
          {error}
        </div>
      )}

      <section className={useThemeCard ? 'rounded-xl p-4 shadow-sm transition-colors duration-200' : 'rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-800 dark:border dark:border-neutral-600 dark:shadow-lg dark:shadow-black/30 transition-colors duration-200'} style={useThemeCard ? { background: 'var(--theme-card)' } : undefined}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className={`font-medium ${useThemeCard ? 'text-slate-100' : 'text-slate-700 dark:text-slate-200'}`}>Администрирование</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('users')}
              className={`${tabButtonBase} ${tab === 'users' ? tabActive : useThemeCard ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 dark:text-slate-200'}`}
            >
              Пользователи
            </button>
            <button
              type="button"
              onClick={() => setTab('banned')}
              className={`${tabButtonBase} ${tab === 'banned' ? tabActive : useThemeCard ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 dark:text-slate-200'}`}
            >
              Заблокированные
            </button>
          </div>
        </div>

        {tab === 'users' && (
          loading ? (
            <p className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>Загрузка...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={useThemeCard ? 'border-b border-white/20' : 'border-b border-slate-200 dark:border-neutral-600'}>
                    <th className={`py-2 pr-4 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Email</th>
                    <th className={`py-2 pr-4 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Имя</th>
                    <th className={`py-2 pr-4 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Роль</th>
                    <th className={`py-2 pr-4 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Статус</th>
                    <th className={`py-2 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={useThemeCard ? 'border-b border-white/10' : 'border-b border-slate-100 dark:border-neutral-600'}>
                      <td className={`py-2 pr-4 ${useThemeCard ? 'text-slate-100' : 'dark:text-slate-200'}`}>{u.email}</td>
                      <td className={`py-2 pr-4 ${useThemeCard ? 'text-slate-100' : 'dark:text-slate-200'}`}>{u.name}</td>
                      <td className="py-2 pr-4">
                        <span className={u.role === 'admin' ? 'text-amber-400 font-medium' : useThemeCard ? 'text-slate-200' : 'dark:text-slate-200'}>
                          {u.role}
                        </span>
                      </td>
                      <td className={`py-2 pr-4 ${useThemeCard ? 'text-slate-300' : 'dark:text-slate-300'}`}>
                        {u.is_banned ? (
                          <span className="text-red-400 font-medium">Заблокирован</span>
                        ) : (
                          <span className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}>Активен</span>
                        )}
                      </td>
                      <td className="py-2">
                        {u.role === 'admin' ? (
                          <span className={useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}>—</span>
                        ) : u.is_banned ? (
                          <button
                            type="button"
                            onClick={() => unban(u.email)}
                            className={useThemeCard ? 'rounded-lg bg-white/10 px-3 py-1 text-slate-100 hover:bg-white/15' : 'rounded-lg bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700'}
                          >
                            Разбанить
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => ban(u.email)}
                            className={useThemeCard ? 'rounded-lg bg-red-500/20 px-3 py-1 text-red-200 hover:bg-red-500/30' : 'rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-700'}
                          >
                            Бан
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={`mt-3 text-xs ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                Бан применяется по email: вход и регистрация на этот email будут запрещены.
              </p>
            </div>
          )
        )}

        {tab === 'banned' && (
          loadingBanned ? (
            <p className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>Загрузка...</p>
          ) : banned.length === 0 ? (
            <p className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>Заблокированных email пока нет.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={useThemeCard ? 'border-b border-white/20' : 'border-b border-slate-200 dark:border-neutral-600'}>
                    <th className={`py-2 pr-4 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Email</th>
                    <th className={`py-2 pr-4 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Пользователь</th>
                    <th className={`py-2 pr-4 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Причина</th>
                    <th className={`py-2 pr-4 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Дата</th>
                    <th className={`py-2 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {banned.map((b) => (
                    <tr key={b.email} className={useThemeCard ? 'border-b border-white/10' : 'border-b border-slate-100 dark:border-neutral-600'}>
                      <td className={`py-2 pr-4 ${useThemeCard ? 'text-slate-100' : 'dark:text-slate-200'}`}>{b.email}</td>
                      <td className={`py-2 pr-4 ${useThemeCard ? 'text-slate-100' : 'dark:text-slate-200'}`}>
                        {b.user_name ? b.user_name : <span className={useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}>—</span>}
                      </td>
                      <td className={`py-2 pr-4 ${useThemeCard ? 'text-slate-300' : 'dark:text-slate-300'}`}>
                        {b.reason ? b.reason : <span className={useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}>—</span>}
                      </td>
                      <td className={`py-2 pr-4 ${useThemeCard ? 'text-slate-300' : 'dark:text-slate-300'}`}>{formatDate(b.banned_at)}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => unban(b.email)}
                          className={useThemeCard ? 'rounded-lg bg-white/10 px-3 py-1 text-slate-100 hover:bg-white/15' : 'rounded-lg bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700'}
                        >
                          Разбанить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>
          </div>
        </main>
      </div>

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
