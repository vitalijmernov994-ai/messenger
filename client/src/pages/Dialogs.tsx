import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { useTheme } from '../context/ThemeContext';
import { contactsApi, dialogsApi } from '../api';
import { getAvatarColor } from '../lib/avatarColor';

type DialogItem = { id: string; created_at: string; other?: { id: string; name: string; public_id?: string; avatar_url?: string | null } };
type ContactLite = { nickname: string | null; local_photo: string | null };

const SERVER = import.meta.env.VITE_API_URL || '';
function resolveUrl(url: string | null | undefined) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${SERVER}${url}`;
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const photo = resolveUrl(avatarUrl);
  return (
    <div className={`shrink-0 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white text-base font-semibold ${!photo ? getAvatarColor(name) : ''}`}>
      {photo
        ? <img src={photo} alt="" className="w-full h-full object-cover" />
        : name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Dialogs() {
  const { hasGlassUI, customThemeColor } = useTheme();
  const useThemeCard = customThemeColor && !hasGlassUI;
  const [dialogs, setDialogs] = useState<DialogItem[]>([]);
  const [contactById, setContactById] = useState<Record<string, ContactLite>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      dialogsApi.list(),
      contactsApi.list().catch(() => []),
    ])
      .then(([d, contacts]) => {
        if (cancelled) return;
        setDialogs(d);
        const map: Record<string, ContactLite> = {};
        for (const c of contacts) map[c.contact_id] = { nickname: c.nickname ?? null, local_photo: c.local_photo ?? null };
        setContactById(map);
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка загрузки'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const decoratedDialogs = useMemo(() => {
    return dialogs.map((d) => {
      const otherId = d.other?.id;
      const contact = otherId ? contactById[otherId] : undefined;
      const displayName = (contact?.nickname ?? d.other?.name) ?? '?';
      const avatar = contact?.local_photo || d.other?.avatar_url || null;
      return { dialog: d, displayName, avatarUrl: avatar };
    });
  }, [dialogs, contactById]);

  const rowClass = useThemeCard
    ? 'flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer'
    : 'flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer';

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 min-w-0 flex-col">
        <AppHeader
          title="iMSITChat"
          showBack={false}
          showMenu={true}
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((o) => !o)}
        />

        <main
          className="flex-1 overflow-y-auto"
          style={useThemeCard ? { background: 'var(--theme-bg)' } : undefined}
        >
          {error && (
            <div className="mx-4 mt-3 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <span className={`text-sm ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>Загрузка...</span>
            </div>
          ) : dialogs.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <div className="glass-panel mx-4 w-full max-w-md rounded-2xl px-6 py-5">
                <p className={`text-sm ${useThemeCard ? 'text-slate-100/80' : 'text-slate-700 dark:text-slate-200'}`}>
                  Нет активных чатов
                </p>
                <p className={`mt-1 text-xs ${useThemeCard ? 'text-slate-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                  Найдите собеседника через «Поиск людей»
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-3 px-3 py-4">
              <div className="flex items-baseline justify-between px-1">
                <h2 className={useThemeCard ? 'text-sm font-semibold text-slate-100/90' : 'text-sm font-semibold text-slate-700 dark:text-slate-100'}>
                  Диалоги
                </h2>
                <span className={useThemeCard ? 'text-xs text-slate-300/80' : 'text-xs text-slate-400 dark:text-slate-500'}>
                  {dialogs.length} активных
                </span>
              </div>
              <ul className="space-y-2">
                {decoratedDialogs.map(({ dialog: d, displayName, avatarUrl }) => (
                  <li key={d.id}>
                    <Link to={`/chat/${d.id}`} className={rowClass}>
                      <Avatar name={displayName} avatarUrl={avatarUrl} />
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>
                          {displayName || 'Диалог'}
                        </p>
                        {d.other?.public_id && (
                          <p className={`text-xs truncate ${useThemeCard ? 'text-slate-300/80' : 'text-slate-400 dark:text-slate-500'}`}>
                            @{d.other.public_id}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
