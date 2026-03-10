import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { usersApi, authApi } from '../api';

function Modal({
  title,
  onClose,
  children,
  themeAware,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  themeAware?: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.effectiveDark && !theme.customThemeColor;
  const isCustom = !!theme.customThemeColor;
  const modalBgClass = themeAware ? (isCustom ? '' : isDark ? 'bg-neutral-800' : 'bg-white') : 'bg-white dark:bg-neutral-800 dark:border dark:border-neutral-600 dark:shadow-lg dark:shadow-black/30';
  const modalStyle = themeAware && isCustom ? { background: 'var(--theme-card)' } : undefined;
  const modalTextClass = themeAware && (isDark || isCustom) ? 'text-slate-100' : '';
  const titleClass = themeAware ? (isDark || isCustom ? 'text-slate-100' : 'text-slate-800') : 'text-slate-800 dark:text-slate-100';
  const closeClass = themeAware ? (isDark || isCustom ? 'text-slate-300 hover:bg-white/15' : 'text-slate-500 hover:bg-slate-100') : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl p-5 shadow-xl transition-all duration-200 ${modalBgClass} ${modalTextClass}`}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${titleClass}`}>{title}</h3>
          <button type="button" onClick={onClose} className={`rounded-lg p-2 transition-colors duration-200 ${closeClass}`}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Settings() {
  const { auth, setUser } = useAuth();
  const { theme, setTheme, customThemeColor, setCustomThemeColor, customBackgroundImage, setCustomBackgroundImage, customBackgroundVideo, setCustomBackgroundVideo, hasGlassUI, effectiveDark } = useTheme();
  const useThemeCard = customThemeColor && !hasGlassUI;
  const [modal, setModal] = useState<'password' | 'email' | 'theme' | null>(null);

  const isLightActive = theme === 'light' && !customThemeColor;
  const isDarkActive = theme === 'dark' && !customThemeColor;
  const isSystemActive = theme === 'system' && !customThemeColor;
  const isCustomActive = !!customThemeColor;
  const modalDark = effectiveDark && !customThemeColor;
  const unselectedBtn = modalDark ? 'bg-neutral-800 text-slate-200' : 'bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-slate-200';
  const lightBtnClass = `rounded-xl py-3 text-sm font-medium transition-colors duration-200 ${isLightActive ? 'bg-white border-2 border-slate-300 text-slate-800 shadow-sm' : unselectedBtn}`;
  const darkBtnClass = `rounded-xl py-3 text-sm font-medium transition-colors duration-200 ${isDarkActive ? 'bg-slate-800 text-white border-2 border-slate-600' : unselectedBtn}`;
  const systemBtnClass = `rounded-xl py-3 text-sm font-medium transition-colors duration-200 ${isSystemActive ? (effectiveDark ? 'bg-slate-800 text-white border-2 border-slate-600' : 'bg-white border-2 border-slate-300 text-slate-800 shadow-sm') : unselectedBtn}`;
  const customBtnClass = `rounded-xl py-3 text-sm font-medium transition-colors duration-200 ${isCustomActive ? 'text-white border-2 border-white/30' : unselectedBtn}`;
  const [themeStep, setThemeStep] = useState<'main' | 'custom'>('main');
  const [videoUrlInput, setVideoUrlInput] = useState(customBackgroundVideo ?? '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState(auth?.user?.email ?? '');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (auth?.user) setEmail(auth.user.email);
  }, [auth?.user]);

  useEffect(() => {
    if (modal === 'theme') {
      setVideoUrlInput(customBackgroundVideo ?? '');
      setThemeStep('main');
    }
  }, [modal, customBackgroundVideo]);

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess(false);
    setEmailLoading(true);
    try {
      const updated = await usersApi.updateProfile({ email });
      setEmailSuccess(true);
      setUser(updated);
      setModal(null);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setEmailLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    if (newPassword.length < 6) {
      setPasswordError('Новый пароль не менее 6 символов');
      return;
    }
    setPasswordLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setModal(null);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 min-w-0 flex-col">
        <AppHeader
          title="Настройки"
          showBack
          showMenu
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((o) => !o)}
        />

        <main className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setModal('password')}
          className="liquid-card flex flex-col items-center gap-2 rounded-2xl p-6 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          style={useThemeCard || customThemeColor ? { background: 'rgba(var(--theme-bg-rgb, 15,23,42),0.86)' } : undefined}
        >
          <span className="text-2xl">🔐</span>
          <span className={`font-medium ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>Сменить пароль</span>
        </button>
        <button
          type="button"
          onClick={() => setModal('email')}
          className="liquid-card flex flex-col items-center gap-2 rounded-2xl p-6 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          style={useThemeCard || customThemeColor ? { background: 'rgba(var(--theme-bg-rgb, 15,23,42),0.86)' } : undefined}
        >
          <span className="text-2xl">✉</span>
          <span className={`font-medium ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>Сменить почту</span>
        </button>
        <button
          type="button"
          onClick={() => setModal('theme')}
          className="liquid-card flex flex-col items-center gap-2 rounded-2xl p-6 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          style={useThemeCard || customThemeColor ? { background: 'rgba(var(--theme-bg-rgb, 15,23,42),0.86)' } : undefined}
        >
          <span className="text-2xl">🌓</span>
          <span className={`font-medium ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>Сменить тему</span>
        </button>
      </div>

      {modal === 'password' && (
        <Modal title="Сменить пароль" onClose={() => setModal(null)}>
          <form onSubmit={changePassword} className="space-y-4">
            {passwordError && <div className="rounded bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{passwordError}</div>}
            {passwordSuccess && <div className="rounded bg-green-100 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">Пароль изменён.</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Текущий пароль</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-neutral-500 dark:bg-neutral-700 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Новый пароль (не менее 6)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-neutral-500 dark:bg-neutral-700 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button type="submit" disabled={passwordLoading} className="w-full rounded-xl bg-[var(--theme-button-bg)] py-2.5 font-medium text-[var(--theme-button-text)] disabled:opacity-50 transition-colors duration-200">
              {passwordLoading ? 'Сохранение...' : 'Сменить пароль'}
            </button>
          </form>
        </Modal>
      )}

      {modal === 'email' && (
        <Modal title="Сменить почту" onClose={() => setModal(null)}>
          <form onSubmit={saveEmail} className="space-y-4">
            {emailError && <div className="rounded bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{emailError}</div>}
            {emailSuccess && <div className="rounded bg-green-100 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">Почта сохранена.</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Новый email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-neutral-500 dark:bg-neutral-700 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button type="submit" disabled={emailLoading} className="w-full rounded-xl bg-[var(--theme-button-bg)] py-2.5 font-medium text-[var(--theme-button-text)] disabled:opacity-50 transition-colors duration-200">
              {emailLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>
        </Modal>
      )}

      {modal === 'theme' && (
        <Modal title="Сменить тему" onClose={() => { setModal(null); setThemeStep('main'); }} themeAware>
          {themeStep === 'main' ? (
            <div className="space-y-3">
              <p className={`mb-2 text-sm font-medium ${modalDark || customThemeColor ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Основная тема</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    setCustomThemeColor(null);
                    setCustomBackgroundImage(null);
                    setCustomBackgroundVideo(null);
                    setModal(null);
                  }}
                  className={lightBtnClass}
                >
                  Светлая
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    setCustomThemeColor(null);
                    setCustomBackgroundImage(null);
                    setCustomBackgroundVideo(null);
                    setModal(null);
                  }}
                  className={darkBtnClass}
                >
                  Тёмная
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTheme('system');
                    setCustomThemeColor(null);
                    setCustomBackgroundImage(null);
                    setCustomBackgroundVideo(null);
                    setModal(null);
                  }}
                  className={systemBtnClass}
                >
                  Системная
                </button>
                <button
                  type="button"
                  onClick={() => { setCustomThemeColor(null); setThemeStep('custom'); }}
                  className={customBtnClass}
                >
                  Свой фон
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className={`flex items-center gap-2 border-b pb-3 ${modalDark || customThemeColor ? 'border-white/20' : 'border-slate-200 dark:border-neutral-700'}`}>
                <button
                  type="button"
                  onClick={() => setThemeStep('main')}
                  className={modalDark || customThemeColor ? 'rounded-lg p-2 text-slate-300 hover:bg-white/15 transition-colors' : 'rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-neutral-900 transition-colors'}
                  aria-label="Назад"
                >
                  ← Назад
                </button>
                <span className={`text-sm font-medium ${modalDark || customThemeColor ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Своя тема</span>
              </div>

              <div className={`rounded-xl border p-3 ${modalDark || customThemeColor ? 'border-white/20 bg-white/10' : 'border-slate-200 bg-slate-50 dark:border-neutral-500 dark:bg-neutral-700/30'}`}>
                <p className={`mb-2 text-sm font-medium ${modalDark || customThemeColor ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>Загрузить свою тему</p>
                <p className={`mb-3 text-xs ${modalDark || customThemeColor ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>Картинка или зацикленное видео как фон — кнопки станут как стекло и не перекроют фон</p>

                <div className="mb-3">
                  <label className={`mb-1 block text-xs font-medium ${modalDark || customThemeColor ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>Картинка (файл)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-slate-700 dark:file:bg-slate-600 dark:file:text-slate-200"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 10 * 1024 * 1024) {
                        alert('Изображение слишком большое (макс. 10 МБ)');
                        e.target.value = '';
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setCustomBackgroundImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label className={`mb-1 block text-xs font-medium ${modalDark || customThemeColor ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>Видео (ссылка)</label>
                  <input
                    type="url"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    placeholder="https://... видео (mp4, webm)"
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${modalDark || customThemeColor ? 'border-white/30 bg-white/15 text-slate-100 placeholder-slate-400' : 'border-slate-300 dark:border-neutral-500 dark:bg-neutral-700 dark:text-slate-100 dark:placeholder-slate-400'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setCustomBackgroundVideo(videoUrlInput.trim() || null)}
                    className="mt-2 rounded-xl bg-[var(--theme-button-bg)] px-3 py-1.5 text-sm font-medium text-[var(--theme-button-text)]"
                  >
                    Применить видео
                  </button>
                </div>

                {(customBackgroundImage || customBackgroundVideo) && (
                  <div className={`flex flex-wrap items-center gap-2 border-t pt-3 ${modalDark || customThemeColor ? 'border-white/20' : 'border-slate-200 dark:border-neutral-700'}`}>
                    {customBackgroundImage && (
                      <div className={`h-12 w-12 overflow-hidden rounded-lg border ${modalDark || customThemeColor ? 'border-white/30' : 'border-slate-300 dark:border-neutral-600'}`}>
                        <img src={customBackgroundImage} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <span className={`text-xs ${modalDark || customThemeColor ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>Фон включён</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomBackgroundImage(null);
                        setCustomBackgroundVideo(null);
                        setVideoUrlInput('');
                      }}
                      className="rounded-xl bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    >
                      Удалить фон
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

          </div>
        </main>
      </div>

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
