import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { useTheme } from '../context/ThemeContext';
import { usersApi } from '../api';
import type { UserListItem } from '../api';
import { getAvatarColor } from '../lib/avatarColor';
import { getRecentSearches, addRecentSearch } from '../lib/recentSearch';

const SERVER = import.meta.env.VITE_API_URL || '';
function resolveUrl(url: string | null | undefined) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${SERVER}${url}`;
}

export default function Search() {
  const navigate = useNavigate();
  const { customThemeColor, hasGlassUI } = useTheme();
  const useThemeCard = customThemeColor && !hasGlassUI;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recent, setRecent] = useState(getRecentSearches);
  const [menuOpen, setMenuOpen] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const list = await usersApi.search(trimmed);
      setResults(list);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) { setResults([]); setSearched(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') doSearch(query);
  }

  function openUser(user: UserListItem) {
    addRecentSearch({ id: user.id, name: user.name, public_id: user.public_id });
    setRecent(getRecentSearches());
    navigate(`/user/${user.id}`);
  }

  const inputClass = `flex-1 bg-transparent text-sm focus:outline-none ${useThemeCard ? 'text-slate-200 placeholder-slate-500' : 'text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500'}`;
  const wrapClass = `flex items-center gap-2 rounded-xl px-3 py-2.5 ${useThemeCard ? 'bg-white/10' : 'bg-slate-100 dark:bg-neutral-700/60'}`;
  const btnClass = `shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${useThemeCard ? 'bg-indigo-500/80 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`;

  function UserRow({ user }: { user: { id: string; name: string; public_id?: string | null; avatar_url?: string | null } }) {
    const photo = resolveUrl(user.avatar_url);
    return (
      <button
        type="button"
        onClick={() => openUser(user as UserListItem)}
        className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${useThemeCard ? 'hover:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-neutral-700/60'}`}
      >
        <div className={`shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-semibold ${!photo ? getAvatarColor(user.name) : ''}`}>
          {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className={`font-medium truncate text-sm ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>{user.name}</p>
          {user.public_id && (
            <p className={`text-xs truncate ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>@{user.public_id}</p>
          )}
        </div>
      </button>
    );
  }

  const cardClass = `rounded-xl p-4 shadow-sm ${useThemeCard ? '' : 'bg-white dark:bg-neutral-800 dark:border dark:border-neutral-600 dark:shadow-lg dark:shadow-black/30'}`;
  const cardStyle = useThemeCard ? { background: 'var(--theme-card)' } : undefined;
  const labelClass = `mb-3 text-sm font-medium ${useThemeCard ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`;
  const emptyClass = `text-sm ${useThemeCard ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`;

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
          <div className="mx-auto max-w-lg flex flex-col gap-4">
            <div className={cardClass} style={cardStyle}>
              <p className={labelClass}>Введите имя или @ID для поиска</p>
              <div className="flex gap-2">
                <div className={wrapClass + ' flex-1'}>
                  <SearchIcon className={`h-4 w-4 shrink-0 ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Имя или @ABC123..."
                    className={inputClass}
                    style={useThemeCard ? undefined : undefined}
                  />
                </div>
                <button type="button" className={btnClass} onClick={() => doSearch(query)}>
                  Найти
                </button>
              </div>

              <div className="mt-3">
                {loading ? (
                  <p className={emptyClass}>Поиск...</p>
                ) : searched ? (
                  results.length === 0 ? (
                    <p className={emptyClass}>Никого не найдено</p>
                  ) : (
                    <ul>
                      {results.map((u) => <li key={u.id}><UserRow user={u} /></li>)}
                    </ul>
                  )
                ) : (
                  <p className={emptyClass}>Нажмите «Найти» или Enter для поиска</p>
                )}
              </div>
            </div>

            {recent.length > 0 && (
              <div className={cardClass} style={cardStyle}>
                <p className={labelClass}>Недавние поиски</p>
                <ul>
                  {recent.map((u) => <li key={u.id}><UserRow user={u} /></li>)}
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
