import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { messagesApi, dialogsApi, contactsApi } from '../api';
import type { Message } from '../api';
import { getAvatarColor } from '../lib/avatarColor';

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
  const [fileUploading, setFileUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [videoRecording, setVideoRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [vu, setVu] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vuRafRef = useRef<number | null>(null);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [recordLocked, setRecordLocked] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [otherUser, setOtherUser] = useState<{ id: string; name: string; displayName: string; avatar_url?: string | null } | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  function renderAttachment(m: Message) {
    if (!m.file_url) return null;
    if (m.file_type === 'image') {
      return (
        <div className="max-w-xs">
          <img src={avatarUrl(m.file_url)} alt={m.file_name || ''} className="max-h-64 w-full rounded-lg object-contain" />
        </div>
      );
    }
    if (m.file_type === 'video') {
      return (
        <div className="max-w-xs">
          <video src={avatarUrl(m.file_url)} controls className="max-h-64 w-full rounded-lg" />
        </div>
      );
    }
    if (m.file_type === 'audio') {
      const isPlaying = playingId === m.id;
      return (
        <>
          <audio
            id={`audio-${m.id}`}
            src={avatarUrl(m.file_url)}
            preload="metadata"
          />
          <button
            type="button"
            onClick={() => void toggleVoice(m.id)}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors ${
              isPlaying ? 'bg-black/15 dark:bg-white/10' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            aria-label={isPlaying ? 'Остановить голосовое' : 'Воспроизвести голосовое'}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isPlaying ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-800 dark:bg-neutral-700 dark:text-slate-100'}`}>
              {isPlaying ? '■' : '▶'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{m.file_name || 'Голосовое сообщение'}</div>
              <div className="text-xs opacity-70">{isPlaying ? 'Воспроизведение…' : 'Нажмите, чтобы воспроизвести'}</div>
            </div>
          </button>
        </>
      );
    }
    return (
      <a
        href={avatarUrl(m.file_url)}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-blue-500 hover:underline break-all"
      >
        {m.file_name || 'Файл'}
      </a>
    );
  }

  useEffect(() => {
    if (!dialogId) return;
    setLoading(true);
    loadingRef.current = true;
    setError('');
    messagesApi
      .list(dialogId)
      .then((list) => {
        setMessages(list);
        return dialogsApi.list();
      })
      .then(async (dialogs) => {
        const d = dialogs.find((x) => x.id === dialogId);
        if (d?.other) {
          const contactCheck = await contactsApi.check(d.other.id).catch(() => ({ isContact: false, nickname: null, local_photo: null }));
          const displayName = contactCheck.nickname ?? d.other.name;
          setOtherUser({ id: d.other.id, name: d.other.name, displayName, avatar_url: d.other.avatar_url ?? null });
        } else {
          setOtherUser(null);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => {
        setLoading(false);
        loadingRef.current = false;
      });
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
    if (!dialogId) return;
    let cancelled = false;

    async function tick(currentDialogId: string) {
      if (cancelled || loadingRef.current) return;
      try {
        const list = await messagesApi.list(currentDialogId);
        setMessages((prev) => {
          if (prev.length === list.length && prev[prev.length - 1]?.id === list[list.length - 1]?.id) {
            return prev;
          }
          return list;
        });
      } catch {
        // ignore polling errors
      }
    }

    const id = window.setInterval(() => {
      if (dialogId) void tick(dialogId);
    }, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [dialogId]);

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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !dialogId) return;
    e.target.value = '';
    setFileUploading(true);
    setError('');
    try {
      const msg = await messagesApi.sendFile(dialogId, file);
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки файла');
    } finally {
      setFileUploading(false);
    }
  }

  async function startVideoMessage() {
    if (!dialogId || videoRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const chunks: BlobPart[] = [];
      let mimeType: string | undefined;
      const candidates = [
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      if (typeof MediaRecorder !== 'undefined') {
        for (const c of candidates) {
          if (MediaRecorder.isTypeSupported(c)) {
            mimeType = c;
            break;
          }
        }
      }
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      setVideoRecording(true);
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setVideoRecording(false);
        if (!dialogId) return;
        try {
          const blobType = mimeType ?? 'video/webm';
          const blob = new Blob(chunks, { type: blobType });
          const ext = blobType.includes('mp4') ? 'mp4' : 'webm';
          const file = new File([blob], `video_${Date.now()}.${ext}`, { type: blob.type || blobType });
          const msg = await messagesApi.sendFile(dialogId, file);
          setMessages((prev) => [...prev, msg]);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ошибка отправки видео-сообщения');
        }
      };
      rec.start();
      // ограничим длину видео 15 сек
      setTimeout(() => {
        if (rec.state === 'recording') rec.stop();
      }, 15000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось получить доступ к камере/микрофону');
      setVideoRecording(false);
    }
  }

  async function startRecording() {
    if (!dialogId || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      let mimeType: string | undefined;
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/webm',
        'audio/ogg',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      if (typeof MediaRecorder !== 'undefined') {
        for (const c of candidates) {
          if (MediaRecorder.isTypeSupported(c)) {
            mimeType = c;
            break;
          }
        }
      }
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = rec;

      // voice activity (VU meter)
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = data[i] - 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const level = Math.min(1, rms / 50);
        setVu(level);
        vuRafRef.current = requestAnimationFrame(loop);
      };
      vuRafRef.current = requestAnimationFrame(loop);
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (vuRafRef.current !== null) cancelAnimationFrame(vuRafRef.current);
        vuRafRef.current = null;
        setVu(0);
        audioCtxRef.current?.close().catch(() => {});
        audioCtxRef.current = null;
        analyserRef.current = null;
        if (!dialogId) return;
        try {
          const blobType = mimeType ?? 'audio/webm';
          const blob = new Blob(chunks, { type: blobType });
          const isVideo = blobType.startsWith('video/');
          const ext = blobType.includes('ogg') ? 'ogg' : 'webm';
          const namePrefix = isVideo ? 'video_voice' : 'voice';
          const file = new File([blob], `${namePrefix}_${Date.now()}.${ext}`, { type: blob.type || blobType });
          const msg = await messagesApi.sendFile(dialogId, file);
          setMessages((prev) => [...prev, msg]);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ошибка отправки голосового сообщения');
        } finally {
          setRecording(false);
        }
      };
      rec.start();
      setRecording(true);
      setRecordLocked(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось получить доступ к микрофону');
    }
  }

  function stopRecording() {
    const rec = mediaRecorderRef.current;
    if (!rec || rec.state !== 'recording') return;
    rec.stop();
  }

  function handleMicDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartYRef.current = e.clientY;
    if (!recording) {
      void startRecording();
    }
  }

  function handleMicMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!recording || dragStartYRef.current === null) return;
    const dy = dragStartYRef.current - e.clientY;
    if (dy > 40 && !recordLocked) {
      setRecordLocked(true);
    }
  }

  function handleMicUp(e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragStartYRef.current = null;
    if (!recording) return;
    if (!recordLocked) {
      // короткое нажатие или без фиксации — остановить и отправить
      stopRecording();
    }
    // при зафиксированной записи пользователь нажимает ещё раз,
    // чтобы остановить и отправить (обрабатывается в onClick)
  }

  function handleMicClick() {
    if (recording && recordLocked) {
      stopRecording();
      setRecordLocked(false);
      return;
    }
    if (!recording) {
      void startRecording();
    }
  }

  async function toggleVoice(messageId: string) {
    const el = document.getElementById(`audio-${messageId}`) as HTMLAudioElement | null;
    if (!el) return;
    if (playingId === messageId) {
      el.pause();
      el.currentTime = 0;
      setPlayingId(null);
      return;
    }
    if (playingId) {
      const prev = document.getElementById(`audio-${playingId}`) as HTMLAudioElement | null;
      if (prev) {
        prev.pause();
        prev.currentTime = 0;
      }
    }
    try {
      await el.play();
      setPlayingId(messageId);
      el.onended = () => {
        setPlayingId((prev) => (prev === messageId ? null : prev));
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось воспроизвести аудио');
    }
  }

  if (!dialogId) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 min-w-0 flex-col">
        <AppHeader
          title={otherUser?.displayName ?? otherUser?.name ?? 'Чат'}
          showBack
          showMenu
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((o) => !o)}
          chatOther={otherUser ? { ...otherUser, name: otherUser.displayName } : undefined}
          onChatAvatarClick={() => setAvatarModalOpen(true)}
            onCallClick={() => setCallModalOpen(true)}
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
                <img src={avatarUrl(otherUser.avatar_url)} alt={otherUser.displayName} className="max-h-[90vh] max-w-full object-contain" />
              ) : (
                <div className={`flex h-48 w-48 items-center justify-center text-6xl font-semibold text-white ${getAvatarColor(otherUser.displayName || '?')}`}>
                  {(otherUser.displayName || '?').charAt(0).toUpperCase()}
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
              const rawName = m.sender_name ?? '';
              const senderName = (!isOwn && otherUser && m.sender_id === otherUser.id && otherUser.displayName)
                ? otherUser.displayName
                : rawName;

              const attachment = renderAttachment(m);

              if (isOwn) {
                return (
                  <li key={m.id} className="flex justify-end px-1">
                    <div
                      className="max-w-[70%] rounded-2xl rounded-tr-sm px-4 py-2 bg-[var(--theme-button-bg)] text-[var(--theme-button-text)]"
                    >
                      <div className="space-y-1">
                        {attachment}
                        {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                      </div>
                      <p className="mt-1 text-right text-xs opacity-70">{formatDate(m.created_at)}</p>
                    </div>
                  </li>
                );
              }

              return (
                <li key={m.id} className="flex flex-col items-start gap-1 px-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/user/${m.sender_id}`} className="shrink-0">
                      <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold text-white ${!senderAvatar ? getAvatarColor(senderName || '?') : ''}`}>
                        {senderAvatar
                          ? <img src={senderAvatar} alt="" className="w-full h-full object-cover" />
                          : (senderName || '?').charAt(0).toUpperCase()}
                      </div>
                    </Link>
                    <Link
                      to={`/user/${m.sender_id}`}
                      className={`text-sm font-semibold leading-none hover:underline ${useThemeCard ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      {senderName || 'Пользователь'}
                    </Link>
                  </div>
                  <div className="ml-10 max-w-[70%]">
                    <div
                      className={`space-y-1 rounded-2xl rounded-tl-sm px-4 py-2 ${
                        useThemeCard ? 'bg-[var(--theme-input-bg)] text-slate-100' : 'bg-white text-slate-800 dark:bg-neutral-800 dark:text-slate-100 shadow-sm'
                      }`}
                    >
                      {attachment}
                      {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                      <p className="mt-1 text-xs opacity-60">{formatDate(m.created_at)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {callModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 text-slate-100 p-6 shadow-xl flex flex-col items-center gap-4">
            <div className="text-lg font-semibold">Идёт звонок</div>
            <div className="text-sm opacity-80">
              Это имитация звонка внутри чата. Реальный голосовой канал можно добавить позже.
            </div>
            <button
              type="button"
              onClick={() => setCallModalOpen(false)}
              className="mt-2 rounded-full bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Завершить
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={send}
        className={`border-t p-2 ${useThemeCard ? '' : hasGlassUI ? 'glass-panel border-slate-200/50 dark:border-neutral-700/50' : 'bg-neutral-800 dark:border-neutral-600 dark:shadow-lg dark:shadow-black/20'}`}
        style={useThemeCard ? { background: 'var(--theme-card)', borderColor: 'var(--theme-input-border)' } : undefined}
      >
        <div className="flex gap-2 items-center">
          <label className="flex items-center rounded-xl border px-3 py-2 text-sm cursor-pointer bg-white hover:bg-slate-50 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:border-neutral-500">
            <span className="select-none">{fileUploading ? 'Файл...' : '📎'}</span>
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={fileUploading}
            />
          </label>
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
            type="button"
            onClick={startVideoMessage}
            disabled={videoRecording}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-lg disabled:opacity-50 ${
              videoRecording
                ? 'bg-amber-500 text-white'
                : 'bg-slate-200 text-slate-800 dark:bg-neutral-700 dark:text-slate-100'
            }`}
            aria-label="Видео-сообщение"
          >
            🎥
          </button>
          <button
            type="button"
            onClick={handleMicClick}
            onPointerDown={handleMicDown}
            onPointerMove={handleMicMove}
            onPointerUp={handleMicUp}
            className={`relative rounded-xl px-3 py-2 text-sm font-medium transition-shadow ${
              recording
                ? 'bg-red-600 text-white'
                : 'bg-slate-200 text-slate-800 dark:bg-neutral-700 dark:text-slate-100'
            }`}
            style={recording ? { boxShadow: `0 0 0 0.15rem rgba(248, 113, 113, ${0.3 + vu * 0.5}), 0 0 20px rgba(248,113,113,${vu})` } : undefined}
          >
            {recordLocked ? '⏺' : recording ? 'Стоп' : '🎤'}
          </button>
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full font-medium disabled:opacity-50 transition-colors duration-200 ${
              hasGlassUI ? 'glass-button' : 'bg-[var(--theme-button-bg)] text-[var(--theme-button-text)]'
            }`}
            aria-label="Отправить"
          >
            ➤
          </button>
        </div>
      </form>
      </div>

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
