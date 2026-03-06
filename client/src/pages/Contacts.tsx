import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { useTheme } from '../context/ThemeContext';
import { contactsApi } from '../api';
import type { ContactRow } from '../api';
import { getAvatarColor } from '../lib/avatarColor';

const SERVER = import.meta.env.VITE_API_URL || '';
function resolveUrl(url: string | null | undefined) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${SERVER}${url}`;
}

export default function Contacts() {
  const { hasGlassUI, customThemeColor } = useTheme();
  const useThemeCard = customThemeColor && !hasGlassUI;
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    contactsApi.list()
      .then(setContacts)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      (c.nickname ?? c.name).toLowerCase().includes(q)
    );
  }, [contacts, search]);

  async function removeContact() {
    if (!confirmId) return;
    try {
      await contactsApi.remove(confirmId);
      setContacts((prev) => prev.filter((c) => c.contact_id !== confirmId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setConfirmId(null);
    }
  }

  const rowClass = `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${useThemeCard ? 'hover:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-neutral-700/60'}`;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 min-w-0 flex-col">
        <AppHeader
          title="Контакты"
          showBack
          showMenu
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((o) => !o)}
        />

        <div className={`px-4 py-3 border-b shrink-0 ${useThemeCard ? 'border-white/10' : 'border-slate-200 dark:border-neutral-700'}`}
          style={useThemeCard ? { background: 'var(--theme-card)' } : undefined}
        >
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${useThemeCard ? 'bg-white/10' : 'bg-slate-100 dark:bg-neutral-700/60'}`}>
            <Search className={`h-4 w-4 shrink-0 ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`} />
            <input
              type="text"
              placeholder="Поиск по контактам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`flex-1 bg-transparent text-sm focus:outline-none ${useThemeCard ? 'text-slate-200 placeholder-slate-500' : 'text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500'}`}
            />
          </div>
        </div>

        <main className={`flex-1 overflow-y-auto ${!useThemeCard ? 'bg-slate-50 dark:bg-neutral-900' : ''}`}
          style={useThemeCard ? { background: 'var(--theme-bg)' } : undefined}
        >
          {error && (
            <div className="mx-4 mt-3 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <span className={`text-sm ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>Загрузка...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className={`text-sm ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {search ? 'Ничего не найдено' : 'Контактов пока нет'}
              </p>
              {!search && (
                <p className={`text-xs ${useThemeCard ? 'text-slate-500' : 'text-slate-400 dark:text-slate-600'}`}>
                  Добавьте контакты через профиль пользователя
                </p>
              )}
            </div>
          ) : (
            <ul className="py-2">
              {filtered.map((c) => {
                const displayName = c.nickname ?? c.name;
                const photo = c.local_photo ? resolveUrl(c.local_photo) : resolveUrl(c.avatar_url);
                return (
                  <li key={c.contact_id} className={rowClass}>
                    <Link to={`/user/${c.contact_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`shrink-0 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white text-base font-semibold ${!photo ? getAvatarColor(c.name) : ''}`}>
                        {photo
                          ? <img src={photo} alt="" className="w-full h-full object-cover" />
                          : displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>
                          {displayName}
                        </p>
                        {c.nickname && (
                          <p className={`text-xs truncate ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>{c.name}</p>
                        )}
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmId(c.contact_id)}
                      className={`shrink-0 rounded-lg p-2 transition-colors ${useThemeCard ? 'text-slate-400 hover:bg-white/10 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400'}`}
                      aria-label="Удалить из контактов"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirmId(null)}>
          <div
            className={`w-full max-w-sm rounded-2xl p-6 shadow-xl ${useThemeCard ? '' : 'bg-white dark:bg-neutral-800'}`}
            style={useThemeCard ? { background: 'var(--theme-card)' } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-base font-semibold mb-2 ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>
              Удалить из контактов?
            </h3>
            <p className={`text-sm mb-6 ${useThemeCard ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
              Контакт будет удалён, но переписка с ним останется.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={removeContact}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >
                Удалить
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${useThemeCard ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-neutral-700'}`}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
