import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { useTheme } from '../context/ThemeContext';
import { usersApi } from '../api';
import { getRecentSearches, addRecentSearch } from '../lib/recentSearch';

type UserItem = { id: string; name: string; email: string };

const sectionClass = (customTheme: boolean) =>
  customTheme ? 'rounded-xl p-4 shadow-sm transition-colors duration-200' : 'rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-800 dark:border dark:border-neutral-600 dark:shadow-lg dark:shadow-black/30 transition-colors duration-200';

export default function Search() {
  const navigate = useNavigate();
  const { customThemeColor } = useTheme();
  const useThemeCard = !!customThemeColor;
  const [users, setUsers] = useState<UserItem[]>([]);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState(getRecentSearches);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    usersApi
      .list()
      .then((list) => { if (!cancelled) setUsers(list); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  function openUser(user: UserItem) {
    addRecentSearch(user);
    setRecent(getRecentSearches());
    navigate(`/user/${user.id}`);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 min-w-0 flex-col">
        <AppHeader
          title="Поиск людей"
          showBack
          showMenu
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((o) => !o)}
        />

        <main className="flex-1 overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl grid gap-4 md:grid-cols-2">
        <section className={sectionClass(useThemeCard)} style={useThemeCard ? { background: 'var(--theme-card)' } : undefined}>
          <h2 className={`mb-3 font-medium ${useThemeCard ? 'text-slate-100' : 'text-slate-700 dark:text-slate-100'}`}>Поиск по имени и почте</h2>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введите имя или email..."
            className={`mb-3 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-shadow duration-200 ${!useThemeCard ? 'border-slate-300 dark:border-neutral-500 dark:bg-neutral-700 dark:text-slate-100 dark:placeholder-slate-400' : ''}`}
            style={useThemeCard ? { background: 'var(--theme-input-bg)', borderColor: 'var(--theme-input-border)', color: 'var(--theme-input-text)' } : undefined}
          />
          {loading ? (
            <p className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}>Загрузка...</p>
          ) : query.trim() ? (
            <ul className="space-y-2">
              {filtered.length === 0 ? (
                <li className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}>Никого не найдено</li>
              ) : (
                filtered.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => openUser(u)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors duration-200 ${useThemeCard ? 'border-white/20 hover:bg-white/10 text-slate-100' : 'border-slate-200 hover:bg-slate-50 dark:border-neutral-600 dark:bg-neutral-700/80 dark:hover:bg-neutral-600 dark:text-slate-100'}`}
                      style={useThemeCard ? { background: 'var(--theme-input-bg)' } : undefined}
                    >
                      {u.name} <span className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}>{u.email}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <p className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}>Введите запрос для поиска</p>
          )}
        </section>

        <section className={sectionClass(useThemeCard)} style={useThemeCard ? { background: 'var(--theme-card)' } : undefined}>
          <h2 className={`mb-3 font-medium ${useThemeCard ? 'text-slate-100' : 'text-slate-700 dark:text-slate-100'}`}>Недавние поиски (до 10)</h2>
          {recent.length === 0 ? (
            <p className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}>Пока нет недавних поисков</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => openUser(u)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors duration-200 ${useThemeCard ? 'border-white/20 hover:bg-white/10 text-slate-100' : 'border-slate-200 hover:bg-slate-50 dark:border-neutral-600 dark:bg-neutral-700/80 dark:hover:bg-neutral-600 dark:text-slate-100'}`}
                    style={useThemeCard ? { background: 'var(--theme-input-bg)' } : undefined}
                  >
                    {u.name} <span className={useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}>{u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
        </main>
      </div>

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
