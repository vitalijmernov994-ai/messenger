import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { usersApi } from '../api';

const API = import.meta.env.VITE_API_URL || '';
function resolveAvatarUrl(url: string | null | undefined): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API}${url}`;
}

export default function Profile() {
  const { auth, refreshUser } = useAuth();
  const { hasGlassUI, customThemeColor } = useTheme();
  const [name, setName] = useState(auth?.user?.name ?? '');
  const [description, setDescription] = useState(auth?.user?.description ?? '');
  const [avatarUrl, setAvatarUrl] = useState(auth?.user?.avatar_url ?? '');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (auth?.user) {
      setName(auth.user.name);
      setDescription(auth.user.description ?? '');
      setAvatarUrl(auth.user.avatar_url ?? '');
      setAvatarPreview('');
    }
  }, [auth?.user]);

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой. Максимум 10 МБ.');
      e.target.value = '';
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    setError('');
    try {
      const result = await usersApi.uploadAvatar(file);
      setAvatarUrl(result.avatar_url);
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки фото');
      setAvatarPreview('');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await usersApi.updateProfile({
        name,
        description: description || null,
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
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {(avatarPreview || avatarUrl) ? (
                      <img
                        src={avatarPreview || resolveAvatarUrl(avatarUrl)}
                        alt=""
                        className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-200 dark:ring-neutral-500"
                      />
                    ) : (
                      <div
                        className={`flex h-24 w-24 items-center justify-center rounded-full text-2xl font-semibold ${customThemeColor && !hasGlassUI ? '' : 'bg-slate-200 text-slate-500 dark:bg-neutral-700 dark:text-slate-200'}`}
                        style={customThemeColor && !hasGlassUI ? { background: 'var(--theme-input-bg)', color: 'var(--theme-input-text)' } : undefined}
                      >
                        {name.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-medium text-center px-1">
                        {uploadingAvatar ? 'Загрузка...' : 'Изменить фото'}
                      </span>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFile}
                    disabled={uploadingAvatar}
                  />
                  <p className={`text-xs ${customThemeColor && !hasGlassUI ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    Нажмите на фото для загрузки (до 10 МБ)
                  </p>
                </div>

                {auth?.user?.public_id && (
                  <div className={`flex items-center justify-center gap-1.5 text-sm font-mono ${customThemeColor && !hasGlassUI ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    <span>Ваш ID:</span>
                    <span className="font-semibold">@{auth.user.public_id}</span>
                  </div>
                )}

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
