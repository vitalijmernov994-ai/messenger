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

        <main className={`flex-1 overflow-y-auto ${!useThemeCard ? 'bg-slate-50 dark:bg-neutral-900' : ''}`}
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
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className={`text-sm ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>Нет активных чатов</p>
              <p className={`text-xs ${useThemeCard ? 'text-slate-500' : 'text-slate-400 dark:text-slate-600'}`}>Найдите собеседника через «Поиск людей»</p>
            </div>
          ) : (
            <ul className="py-2">
              {decoratedDialogs.map(({ dialog: d, displayName, avatarUrl }) => (
                <li key={d.id}>
                  <Link to={`/chat/${d.id}`} className={rowClass}>
                    <Avatar name={displayName} avatarUrl={avatarUrl} />
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>
                        {displayName || 'Диалог'}
                      </p>
                      {d.other?.public_id && (
                        <p className={`text-xs truncate ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          @{d.other.public_id}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
