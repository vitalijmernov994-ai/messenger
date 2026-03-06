import { Link } from 'react-router-dom';
import { User, MessageCircle, Search, Settings, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type AppSidebarProps = { onClose: () => void };

export function AppSidebar({ onClose }: AppSidebarProps) {
  const { auth } = useAuth();
  const { hasGlassUI, customThemeColor } = useTheme();
  const useThemeHeader = customThemeColor && !hasGlassUI;

  const linkClass = useThemeHeader
    ? 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-200 hover:bg-white/15 transition-colors duration-200'
    : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-neutral-900 transition-colors duration-200';

  return (
    <aside
      className={`flex w-72 shrink-0 flex-col border-l ${
        useThemeHeader ? '' : hasGlassUI ? 'glass-panel border-slate-200/50 dark:border-neutral-700/50' : 'border-slate-200 bg-white dark:border-neutral-600 dark:bg-neutral-800 dark:shadow-sm dark:shadow-black/20'
      }`}
      style={useThemeHeader ? { background: 'var(--theme-header)', borderColor: 'var(--theme-input-border)' } : undefined}
    >
      <div className={`flex items-center justify-between border-b p-3 ${useThemeHeader ? 'border-white/20' : 'border-slate-200 dark:border-neutral-600'}`}>
        <span className={`font-medium ${useThemeHeader ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>Меню</span>
        <button
          type="button"
          onClick={onClose}
          className={useThemeHeader ? 'rounded-lg p-2 text-slate-200 hover:bg-white/15 transition-colors duration-200' : 'rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors duration-200'}
          aria-label="Закрыть"
        >
          <span className={`text-xl leading-none ${useThemeHeader ? 'text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>×</span>
        </button>
      </div>
      <nav className="flex flex-col p-2">
        <Link to="/profile" onClick={onClose} className={linkClass}>
          <User className={`h-5 w-5 ${useThemeHeader ? 'text-amber-300' : 'text-amber-600 dark:text-amber-400'}`} />
          Профиль
        </Link>
        <Link to="/" onClick={onClose} className={linkClass}>
          <MessageCircle className={`h-5 w-5 ${useThemeHeader ? 'text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'}`} />
          Чаты
        </Link>
        <Link to="/search" onClick={onClose} className={linkClass}>
          <Search className={`h-5 w-5 ${useThemeHeader ? 'text-blue-300' : 'text-blue-600 dark:text-blue-400'}`} />
          Поиск людей
        </Link>
        <Link to="/settings" onClick={onClose} className={linkClass}>
          <Settings className={`h-5 w-5 ${useThemeHeader ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`} />
          Настройки
        </Link>
        {auth?.user?.role === 'admin' && (
          <Link to="/admin" onClick={onClose} className={linkClass}>
            <Shield className={`h-5 w-5 ${useThemeHeader ? 'text-amber-300' : 'text-amber-600 dark:text-amber-400'}`} />
            Админ-панель
          </Link>
        )}
      </nav>
    </aside>
  );
}
