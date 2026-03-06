import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MessageCircle } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { customThemeColor, hasGlassUI } = useTheme();
  const useThemeCard = !!customThemeColor && !hasGlassUI;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Пароль не менее 6 символов');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-indigo-600 dark:bg-indigo-800 p-12 text-white">
        <MessageCircle className="h-16 w-16 mb-6 opacity-90" strokeWidth={1.5} />
        <h2 className="text-3xl font-bold tracking-tight mb-3">iMSITChat</h2>
        <p className="text-indigo-200 text-center text-base leading-relaxed max-w-xs">
          Быстрый и удобный мессенджер для общения с коллегами и друзьями
        </p>
      </div>

      <div
        className={`flex flex-1 flex-col items-center justify-center px-6 py-12 ${!useThemeCard ? 'bg-slate-50 dark:bg-neutral-900' : ''}`}
        style={useThemeCard ? { background: 'var(--theme-bg)' } : undefined}
      >
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <MessageCircle className={`h-7 w-7 ${useThemeCard ? 'text-indigo-400' : 'text-indigo-600 dark:text-indigo-400'}`} strokeWidth={1.5} />
            <span className={`text-xl font-bold ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>iMSITChat</span>
          </div>

          <h1 className={`text-2xl font-bold mb-1 ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>
            Создать аккаунт
          </h1>
          <p className={`text-sm mb-8 ${useThemeCard ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
            Заполните данные для регистрации
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300" role="alert">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="name" className={`block text-sm font-medium mb-1.5 ${useThemeCard ? 'text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
                Имя
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow ${!useThemeCard ? 'border-slate-300 bg-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-slate-100' : ''}`}
                style={useThemeCard ? { background: 'var(--theme-input-bg)', borderColor: 'var(--theme-input-border)', color: 'var(--theme-input-text)' } : undefined}
              />
            </div>
            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-1.5 ${useThemeCard ? 'text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow ${!useThemeCard ? 'border-slate-300 bg-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-slate-100' : ''}`}
                style={useThemeCard ? { background: 'var(--theme-input-bg)', borderColor: 'var(--theme-input-border)', color: 'var(--theme-input-text)' } : undefined}
              />
            </div>
            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-1.5 ${useThemeCard ? 'text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
                Пароль
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow ${!useThemeCard ? 'border-slate-300 bg-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-slate-100' : ''}`}
                style={useThemeCard ? { background: 'var(--theme-input-bg)', borderColor: 'var(--theme-input-border)', color: 'var(--theme-input-text)' } : undefined}
              />
              <p className={`mt-1 text-xs ${useThemeCard ? 'text-slate-500' : 'text-slate-400 dark:text-slate-500'}`}>Минимум 6 символов</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
            >
              {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className={`mt-6 text-center text-sm ${useThemeCard ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-medium text-indigo-500 hover:text-indigo-400 hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
