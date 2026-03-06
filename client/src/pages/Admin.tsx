import { useState, useEffect } from 'react';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { useTheme } from '../context/ThemeContext';
import { adminApi } from '../api';

type UserRow = { id: string; email: string; name: string; role: string; created_at: string };

export default function Admin() {
  const { customThemeColor } = useTheme();
  const useThemeCard = !!customThemeColor;
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .listUsers()
      .then((list) => { if (!cancelled) setUsers(list); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('ru-RU');
  }

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
        <h2 className={`mb-3 font-medium ${useThemeCard ? 'text-slate-100' : 'text-slate-700 dark:text-slate-200'}`}>Пользователи</h2>
        {loading ? (
          <p className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>Загрузка...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={useThemeCard ? 'border-b border-white/20' : 'border-b border-slate-200 dark:border-neutral-600'}>
                  <th className={`py-2 pr-4 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Email</th>
                  <th className={`py-2 pr-4 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Имя</th>
                  <th className={`py-2 pr-4 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Роль</th>
                  <th className={`py-2 font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Дата регистрации</th>
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
                    <td className={`py-2 ${useThemeCard ? 'text-slate-300' : 'dark:text-slate-300'}`}>{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
          </div>
        </main>
      </div>

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
