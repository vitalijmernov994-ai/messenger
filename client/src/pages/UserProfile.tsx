import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { useTheme } from '../context/ThemeContext';
import { usersApi, dialogsApi } from '../api';
import type { PublicProfile } from '../api';

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasGlassUI, customThemeColor } = useTheme();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    usersApi
      .getProfile(id)
      .then((p) => { if (!cancelled) setProfile(p); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function startChat() {
    if (!profile?.id || starting) return;
    setStarting(true);
    setError('');
    try {
      const { dialogId } = await dialogsApi.getOrCreate(profile.id);
      navigate(`/chat/${dialogId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setStarting(false);
    }
  }

  if (!id) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 min-w-0 flex-col">
        <AppHeader
          title={profile?.name ?? 'Профиль'}
          showBack
          showMenu
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((o) => !o)}
        />

        <main className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-xl bg-red-100 px-4 py-2 text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl bg-white p-8 text-center text-slate-500 dark:bg-neutral-800 dark:text-slate-300 shadow-sm">
              Загрузка...
            </div>
          ) : !profile ? (
            <div className="rounded-xl bg-white p-8 text-center text-slate-500 dark:bg-neutral-800 dark:text-slate-300 shadow-sm">
              Пользователь не найден
            </div>
          ) : (
            <div className="mx-auto max-w-md">
              <section
            className={`rounded-xl p-6 shadow-sm transition-colors duration-200 ${hasGlassUI ? 'glass-panel' : customThemeColor ? '' : 'bg-white dark:bg-neutral-800 dark:border dark:border-neutral-600 dark:shadow-lg dark:shadow-black/30'}`}
            style={customThemeColor && !hasGlassUI ? { background: 'var(--theme-card)' } : undefined}
          >
                <div className="flex flex-col items-center gap-4">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className={`h-24 w-24 rounded-full object-cover ring-2 ${customThemeColor && !hasGlassUI ? 'ring-white/30' : 'ring-slate-200 dark:ring-neutral-700'}`}
                    />
                  ) : (
                    <div
                      className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl font-semibold ${customThemeColor && !hasGlassUI ? 'text-slate-100' : 'bg-slate-200 text-slate-500 dark:bg-neutral-900 dark:text-slate-400'}`}
                      style={customThemeColor && !hasGlassUI ? { background: 'var(--theme-input-bg)' } : undefined}
                    >
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-center">
                    <h2 className={`text-xl font-semibold ${customThemeColor && !hasGlassUI ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>{profile.name}</h2>
                    <p className={`text-sm ${customThemeColor && !hasGlassUI ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>{profile.email}</p>
                  </div>
                  {profile.description && (
                    <p
                      className={`w-full rounded-lg p-3 text-sm ${customThemeColor && !hasGlassUI ? 'text-slate-200' : 'bg-slate-50 text-slate-700 dark:bg-neutral-900/50 dark:text-slate-300'}`}
                      style={customThemeColor && !hasGlassUI ? { background: 'var(--theme-input-bg)' } : undefined}
                    >
                      {profile.description}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={startChat}
                    disabled={starting}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium disabled:opacity-50 transition-colors duration-200 ${hasGlassUI ? 'glass-button' : 'bg-[var(--theme-button-bg)] text-[var(--theme-button-text)]'}`}
                  >
                    <MessageCircle className="h-5 w-5" />
                    {starting ? 'Открываем чат...' : 'Написать'}
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
