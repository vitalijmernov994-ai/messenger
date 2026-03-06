import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { customThemeColor, hasGlassUI } = useTheme();
  const useThemeCard = !!customThemeColor && !hasGlassUI;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div
        className={`w-full max-w-sm rounded-xl p-6 shadow-md transition-colors duration-200 ${!useThemeCard ? 'bg-white dark:bg-neutral-800 dark:border dark:border-neutral-600 dark:shadow-lg dark:shadow-black/30 dark:shadow-none' : ''}`}
        style={useThemeCard ? { background: 'var(--theme-card)' } : undefined}
      >
        <h1 className={`mb-6 text-center text-2xl font-semibold ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>iMSITChat — Вход</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 ${!useThemeCard ? 'border-slate-300 dark:border-neutral-500 dark:bg-neutral-700 dark:text-slate-100' : ''}`}
              style={useThemeCard ? { background: 'var(--theme-input-bg)', borderColor: 'var(--theme-input-border)', color: 'var(--theme-input-text)' } : undefined}
            />
          </div>
          <div>
            <label htmlFor="password" className={`block text-sm font-medium ${useThemeCard ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>
              Пароль
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 ${!useThemeCard ? 'border-slate-300 dark:border-neutral-500 dark:bg-neutral-700 dark:text-slate-100' : ''}`}
              style={useThemeCard ? { background: 'var(--theme-input-bg)', borderColor: 'var(--theme-input-border)', color: 'var(--theme-input-text)' } : undefined}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--theme-button-bg)] py-2 font-medium text-[var(--theme-button-text)] disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className={`mt-4 text-center text-sm ${useThemeCard ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
          Нет аккаунта?{' '}
          <Link to="/register" className="text-blue-400 hover:underline">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  );
}
