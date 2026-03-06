import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { usersApi } from '../api';

export default function Profile() {
  const { auth, refreshUser } = useAuth();
  const { hasGlassUI, customThemeColor } = useTheme();
  const [name, setName] = useState(auth?.user?.name ?? '');
  const [description, setDescription] = useState(auth?.user?.description ?? '');
  const [avatarUrl, setAvatarUrl] = useState(auth?.user?.avatar_url ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (auth?.user) {
      setName(auth.user.name);
      setDescription(auth.user.description ?? '');
      setAvatarUrl(auth.user.avatar_url ?? '');
    }
  }, [auth?.user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await usersApi.updateProfile({
        name,
        description: description || null,
        avatar_url: avatarUrl.trim() || null,
      });
      setSuccess(true);
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 min-w-0 flex-col">
        <AppHeader
          title="Профиль"
          showBack
          showMenu
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((o) => !o)}
        />

        <main className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-lg">
            <section
              className={`rounded-xl p-6 shadow-sm transition-colors duration-200 ${hasGlassUI ? 'glass-panel' : customThemeColor ? '' : 'bg-white dark:bg-neutral-800 dark:border dark:border-neutral-600 dark:shadow-lg dark:shadow-black/30'}`}
              style={customThemeColor && !hasGlassUI ? { background: 'var(--theme-card)' } : undefined}
            >
              <form onSubmit={save} className="space-y-5">
                {error && (
                  <div className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-xl bg-green-100 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    Сохранено.
                  </div>
                )}

                <div className="flex flex-col items-center gap-3">
                  {avatarUrl.trim() ? (
                    <img
                      src={avatarUrl.trim()}
                      alt=""
                      className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-200 dark:ring-neutral-500"
                    />
                  ) : (
                    <div
                      className={customThemeColor && !hasGlassUI ? 'flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold' : 'flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-500 dark:bg-neutral-700 dark:text-slate-200'}
                      style={customThemeColor && !hasGlassUI ? { background: 'var(--theme-input-bg)', color: 'var(--theme-input-text)' } : undefined}
                    >
                      {name.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="w-full">
                    <label htmlFor="profile-avatar" className={`block text-sm font-medium ${customThemeColor && !hasGlassUI ? 'text-slate-200' : 'text-slate-700 dark:text-slate-200'}`}>
                      Ссылка на аватар
                    </label>
                    <input
                      id="profile-avatar"
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className={`mt-1 w-full rounded-xl border px-3 py-2 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${!(customThemeColor && !hasGlassUI) ? 'border-slate-300 dark:border-neutral-500 dark:bg-neutral-700 dark:text-slate-100 dark:placeholder-slate-400' : ''}`}
                      style={customThemeColor && !hasGlassUI ? { background: 'var(--theme-input-bg)', borderColor: 'var(--theme-input-border)', color: 'var(--theme-input-text)' } : undefined}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-name" className={`block text-sm font-medium ${customThemeColor && !hasGlassUI ? 'text-slate-200' : 'text-slate-700 dark:text-slate-200'}`}>
                    Имя (ник)
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`mt-1 w-full rounded-xl border px-3 py-2 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${!(customThemeColor && !hasGlassUI) ? 'border-slate-300 dark:border-neutral-500 dark:bg-neutral-700 dark:text-slate-100' : ''}`}
                    style={customThemeColor && !hasGlassUI ? { background: 'var(--theme-input-bg)', borderColor: 'var(--theme-input-border)', color: 'var(--theme-input-text)' } : undefined}
                  />
                </div>
                <div>
                  <label htmlFor="profile-desc" className={`block text-sm font-medium ${customThemeColor && !hasGlassUI ? 'text-slate-200' : 'text-slate-700 dark:text-slate-200'}`}>
                    Описание
                  </label>
                  <textarea
                    id="profile-desc"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="О себе..."
                    className={`mt-1 w-full rounded-xl border px-3 py-2 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${!(customThemeColor && !hasGlassUI) ? 'border-slate-300 dark:border-neutral-500 dark:bg-neutral-700 dark:text-slate-100 dark:placeholder-slate-400' : ''}`}
                    style={customThemeColor && !hasGlassUI ? { background: 'var(--theme-input-bg)', borderColor: 'var(--theme-input-border)', color: 'var(--theme-input-text)' } : undefined}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-xl px-4 py-3 font-medium disabled:opacity-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black ${hasGlassUI ? 'glass-button' : 'bg-[var(--theme-button-bg)] text-[var(--theme-button-text)] focus:ring-[var(--theme-button-bg)]'}`}
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </form>
            </section>
          </div>
        </main>
      </div>

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
