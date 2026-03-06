import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { messagesApi, dialogsApi } from '../api';
import type { Message } from '../api';

const API = import.meta.env.VITE_API_URL || '';
function avatarUrl(url: string | null | undefined): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API}${url}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Chat() {
  const { dialogId } = useParams<{ dialogId: string }>();
  const { auth } = useAuth();
  const { hasGlassUI, customThemeColor } = useTheme();
  const useThemeCard = customThemeColor && !hasGlassUI;
  const { joinDialog, leaveDialog, onNewMessage } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [otherUser, setOtherUser] = useState<{ id: string; name: string; avatar_url?: string | null } | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dialogId) return;
    setLoading(true);
    setError('');
    messagesApi
      .list(dialogId)
      .then((list) => {
        setMessages(list);
        return dialogsApi.list();
      })
      .then((dialogs) => {
        const d = dialogs.find((x) => x.id === dialogId);
        if (d?.other) setOtherUser({ id: d.other.id, name: d.other.name, avatar_url: d.other.avatar_url ?? null });
        else setOtherUser(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, [dialogId]);

  useEffect(() => {
    if (!dialogId) return;
    joinDialog(dialogId);
    return () => leaveDialog(dialogId);
  }, [dialogId, joinDialog, leaveDialog]);

  useEffect(() => {
    if (!dialogId) return;
    const unsub = onNewMessage((msg: unknown) => {
      const m = msg as Message;
      if (m.dialog_id === dialogId) setMessages((prev) => [...prev, m]);
    });
    return unsub;
  }, [dialogId, onNewMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!dialogId || !input.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const newMsg = await messagesApi.send(dialogId, input.trim());
      setMessages((prev) => [...prev, newMsg]);
      setInput('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  }

  if (!dialogId) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 min-w-0 flex-col">
        <AppHeader
          title={otherUser?.name ?? 'Чат'}
          showBack
          showMenu
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((o) => !o)}
          chatOther={otherUser ?? undefined}
          onChatAvatarClick={() => setAvatarModalOpen(true)}
        />

        {avatarModalOpen && otherUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setAvatarModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Фото пользователя"
          >
            <div className="relative max-h-[90vh] max-w-[90vw] rounded-2xl overflow-hidden bg-neutral-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
              {otherUser.avatar_url ? (
                <img src={avatarUrl(otherUser.avatar_url)} alt={otherUser.name} className="max-h-[90vh] max-w-full object-contain" />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center text-6xl font-medium text-slate-400">
                  {(otherUser.name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                className="absolute top-2 right-2 rounded-lg bg-black/50 px-2 py-1 text-sm text-white hover:bg-black/70"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

      {error && (
        <div className="rounded-xl bg-red-100 px-4 py-2 text-red-700 dark:bg-red-900/30 dark:text-red-300 mx-4 mt-2" role="alert">
          {error}
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto p-4 transition-colors duration-200 ${!useThemeCard ? 'bg-slate-50 dark:bg-black' : ''}`}
        style={useThemeCard ? { background: 'var(--theme-bg)' } : undefined}
      >
        {loading ? (
          <div className={useThemeCard ? 'text-center text-slate-300' : 'text-center text-slate-500 dark:text-slate-400'}>Загрузка сообщений...</div>
        ) : messages.length === 0 ? (
          <div className={useThemeCard ? 'text-center text-slate-300' : 'text-center text-slate-500 dark:text-slate-400'}>Нет сообщений. Напишите первым.</div>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => {
              const isOwn = m.sender_id === auth?.user?.id;
              const senderAvatar = m.sender_avatar_url ? avatarUrl(m.sender_avatar_url) : '';
              const senderName = m.sender_name ?? '';

              if (isOwn) {
                return (
                  <li key={m.id} className="flex justify-end px-1">
                    <div
                      className="max-w-[70%] rounded-2xl rounded-tr-sm px-4 py-2 bg-[var(--theme-button-bg)] text-[var(--theme-button-text)]"
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="mt-1 text-right text-xs opacity-70">{formatDate(m.created_at)}</p>
                    </div>
                  </li>
                );
              }

              return (
                <li key={m.id} className="flex items-start gap-2 px-1">
                  <Link to={`/user/${m.sender_id}`} className="shrink-0 mt-0.5">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-300 dark:bg-neutral-600 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-200">
                      {senderAvatar
                        ? <img src={senderAvatar} alt="" className="w-full h-full object-cover" />
                        : (senderName || '?').charAt(0).toUpperCase()}
                    </div>
                  </Link>
                  <div className="flex flex-col min-w-0 max-w-[70%]">
                    <Link
                      to={`/user/${m.sender_id}`}
                      className={`mb-0.5 text-xs font-semibold hover:underline ${useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      {senderName || 'Пользователь'}
                    </Link>
                    <div
                      className={`rounded-2xl rounded-tl-sm px-4 py-2 ${
                        useThemeCard ? 'bg-[var(--theme-input-bg)] text-slate-100' : 'bg-white text-slate-800 dark:bg-neutral-800 dark:text-slate-100 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`mt-1 text-xs opacity-60`}>{formatDate(m.created_at)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className={`border-t p-2 ${useThemeCard ? '' : hasGlassUI ? 'glass-panel border-slate-200/50 dark:border-neutral-700/50' : 'bg-neutral-800 dark:border-neutral-600 dark:shadow-lg dark:shadow-black/20'}`}
        style={useThemeCard ? { background: 'var(--theme-card)', borderColor: 'var(--theme-input-border)' } : undefined}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Сообщение..."
            maxLength={10000}
            className={`flex-1 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-shadow duration-200 ${!useThemeCard ? 'border-slate-300 dark:border-neutral-500 dark:bg-neutral-700 dark:text-slate-100 dark:placeholder-slate-400' : ''}`}
            style={useThemeCard ? { background: 'var(--theme-input-bg)', borderColor: 'var(--theme-input-border)', color: 'var(--theme-input-text)' } : undefined}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className={`rounded-xl px-4 py-2 font-medium disabled:opacity-50 transition-colors duration-200 ${hasGlassUI ? 'glass-button' : 'bg-[var(--theme-button-bg)] text-[var(--theme-button-text)]'}`}
          >
            Отправить
          </button>
        </div>
      </form>
      </div>

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
