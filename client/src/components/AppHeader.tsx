import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Menu, LogOut, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getAvatarColor } from '../lib/avatarColor';

type ChatOther = { id: string; name: string; avatar_url?: string | null };

type AppHeaderProps = {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
  /** Для экрана чата: аватар собеседника и ссылка на профиль в заголовке */
  chatOther?: ChatOther;
  onChatAvatarClick?: () => void;
  onCallClick?: () => void;
};

export function AppHeader({ title, showBack, showMenu = true, menuOpen, onMenuToggle, chatOther, onChatAvatarClick, onCallClick }: AppHeaderProps) {
  const { auth, logout } = useAuth();
  const { hasGlassUI, customThemeColor } = useTheme();
  const navigate = useNavigate();
  const useThemeHeader = customThemeColor && !hasGlassUI;

  if (showBack && chatOther) {
    return (
      <header
        className={`flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3 transition-colors duration-200 ${
          useThemeHeader ? '' : 'glass-panel border-slate-200/40 dark:border-slate-800/70'
        }`}
        style={useThemeHeader ? { background: 'var(--theme-header)', borderColor: 'var(--theme-input-border)', color: '#f8fafc' } : undefined}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`shrink-0 flex items-center gap-1 rounded-lg p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${useThemeHeader ? 'text-slate-200 hover:bg-white/15 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-neutral-900 dark:hover:text-slate-200'}`}
            aria-label="Назад"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline text-sm font-medium">Назад</span>
          </button>

          <button
            type="button"
            onClick={onChatAvatarClick}
            className="shrink-0 rounded-full overflow-hidden w-9 h-9 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Открыть фото"
          >
            {chatOther.avatar_url ? (
              <img src={chatOther.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className={`flex w-full h-full items-center justify-center text-sm font-semibold text-white ${getAvatarColor(chatOther.name || '?')}`}>
                {(chatOther.name || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </button>

          <Link
            to={`/user/${chatOther.id}`}
            className={`truncate text-base font-semibold hover:underline ${useThemeHeader ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}
          >
            {title}
          </Link>
        </div>

        <div className="shrink-0 flex items-center gap-1">
          {onCallClick && (
            <button
              type="button"
              onClick={onCallClick}
              className={`flex rounded-lg p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${useThemeHeader ? 'text-slate-200 hover:bg-white/15' : 'hover:bg-slate-100 dark:hover:bg-neutral-900'}`}
              aria-label="Позвонить"
            >
              <Phone className={`h-5 w-5 ${useThemeHeader ? 'text-slate-200' : 'text-slate-600 dark:text-slate-400'}`} />
            </button>
          )}
          {showMenu ? (
            <button
              type="button"
              onClick={onMenuToggle}
              className={`flex rounded-lg p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${useThemeHeader ? 'text-slate-200 hover:bg-white/15' : 'hover:bg-slate-100 dark:hover:bg-neutral-900'}`}
              aria-label="Меню"
              aria-expanded={menuOpen}
            >
              <Menu className={`h-6 w-6 ${useThemeHeader ? 'text-slate-200' : 'text-slate-600 dark:text-slate-400'}`} />
            </button>
          ) : (
            <span className="w-10" />
          )}
        </div>
      </header>
    );
  }

  return (
    <header
      className={`grid shrink-0 grid-cols-3 items-center gap-2 border-b px-4 py-3 transition-colors duration-200 ${
        useThemeHeader ? '' : 'glass-panel border-slate-200/40 dark:border-slate-800/70'
      }`}
      style={useThemeHeader ? { background: 'var(--theme-header)', borderColor: 'var(--theme-input-border)', color: '#f8fafc' } : undefined}
    >
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`flex items-center gap-1 rounded-lg p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black ${useThemeHeader ? 'text-slate-200 hover:bg-white/15 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-neutral-900 dark:hover:text-slate-200'}`}
            aria-label="Назад"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline text-sm font-medium">Назад</span>
          </button>
        ) : (
          <div className="flex flex-col items-start">
            <span className={useThemeHeader ? 'text-sm font-medium text-slate-100' : 'text-sm font-medium text-slate-800 dark:text-slate-100'}>{auth?.user?.name}</span>
            <button
              onClick={() => logout()}
              className={`flex items-center gap-1 text-xs transition-colors duration-200 ${useThemeHeader ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              <LogOut className="h-3.5 w-3.5" />
              Выйти
            </button>
          </div>
        )}
      </div>
      <h1 className={`text-center text-xl font-semibold truncate ${useThemeHeader ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>
        {title}
      </h1>
      <div className="flex justify-end">
        {showMenu ? (
          <button
            type="button"
            onClick={onMenuToggle}
            className={`flex rounded-lg p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black ${useThemeHeader ? 'text-slate-200 hover:bg-white/15' : 'hover:bg-slate-100 dark:hover:bg-neutral-900'}`}
            aria-label="Меню"
            aria-expanded={menuOpen}
          >
            <Menu className={`h-6 w-6 ${useThemeHeader ? 'text-slate-200' : 'text-slate-600 dark:text-slate-400'}`} />
          </button>
        ) : (
          <span className="w-10" />
        )}
      </div>
    </header>
  );
}
