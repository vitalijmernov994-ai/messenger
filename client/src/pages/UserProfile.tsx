import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, MoreHorizontal, UserPlus, UserMinus, Pencil } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usersApi, dialogsApi, contactsApi } from '../api';
import type { PublicProfile, ContactCheck } from '../api';
import { getAvatarColor } from '../lib/avatarColor';

const SERVER = import.meta.env.VITE_API_URL || '';
function resolveUrl(url: string | null | undefined) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${SERVER}${url}`;
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasGlassUI, customThemeColor } = useTheme();
  const { auth } = useAuth();
  const useThemeCard = customThemeColor && !hasGlassUI;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dotMenuOpen, setDotMenuOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactCheck>({ isContact: false, nickname: null, local_photo: null });
  const [nicknameModal, setNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const dotMenuRef = useRef<HTMLDivElement>(null);

  const isContact = contactInfo.isContact;

  const isOwn = auth?.user?.id === id;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([
      usersApi.getProfile(id),
      contactsApi.check(id),
    ])
      .then(([p, c]) => {
        if (!cancelled) {
          setProfile(p);
          setContactInfo(c);
        }
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dotMenuRef.current && !dotMenuRef.current.contains(e.target as Node)) {
        setDotMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function startChat() {
    if (!profile?.id || starting) return;
    setStarting(true);
    setError('');
    try {
      const { dialogId } = await dialogsApi.getOrCreate(profile.id);
      navigate(`/chat/${dialogId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setStarting(false);
    }
  }

  async function toggleContact() {
    if (!id) return;
    setDotMenuOpen(false);
    try {
      if (isContact) {
        await contactsApi.remove(id);
        setContactInfo({ isContact: false, nickname: null, local_photo: null });
      } else {
        await contactsApi.add(id);
        setContactInfo((prev) => ({ ...prev, isContact: true }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  async function saveNickname() {
    if (!id) return;
    const newNickname = nicknameInput.trim() || null;
    try {
      await contactsApi.update(id, { nickname: newNickname });
      setContactInfo((prev) => ({ ...prev, nickname: newNickname }));
      setNicknameModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  }

  if (!id) return null;

  const cardStyle = useThemeCard ? { background: 'var(--theme-card)' } : undefined;
  const cardClass = `rounded-xl p-6 shadow-sm transition-colors duration-200 ${hasGlassUI ? 'glass-panel' : useThemeCard ? '' : 'bg-white dark:bg-neutral-800 dark:border dark:border-neutral-600 dark:shadow-lg dark:shadow-black/30'}`;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 min-w-0 flex-col">
        <AppHeader
          title={profile?.name ?? 'Профиль'}
          showBack
          showMenu
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((o) => !o)}
        />

        <main className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-xl bg-red-100 px-4 py-2 text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl bg-white p-8 text-center text-slate-500 dark:bg-neutral-800 dark:text-slate-300 shadow-sm">Загрузка...</div>
          ) : !profile ? (
            <div className="rounded-xl bg-white p-8 text-center text-slate-500 dark:bg-neutral-800 dark:text-slate-300 shadow-sm">Пользователь не найден</div>
          ) : (
            <div className="mx-auto max-w-md">
              <section className={cardClass} style={cardStyle}>
                <div className="relative flex flex-col items-center gap-4">
                  {!isOwn && (
                    <div className="absolute top-0 right-0" ref={dotMenuRef}>
                      <button
                        type="button"
                        onClick={() => setDotMenuOpen((o) => !o)}
                        className={`rounded-lg p-2 transition-colors ${useThemeCard ? 'text-slate-300 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-neutral-700'}`}
                        aria-label="Действия"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                      {dotMenuOpen && (
                        <div className={`absolute right-0 top-10 z-20 w-52 rounded-xl shadow-lg border overflow-hidden ${useThemeCard ? 'border-white/20' : 'border-slate-200 dark:border-neutral-600'}`}
                          style={useThemeCard ? { background: 'var(--theme-card)' } : undefined}
                        >
                          <div className={`${useThemeCard ? '' : 'bg-white dark:bg-neutral-800'}`}>
                            <button
                              type="button"
                              onClick={toggleContact}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${useThemeCard ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700'}`}
                            >
                              {isContact
                                ? <><UserMinus className="h-4 w-4 text-red-400 shrink-0" /> Удалить из контактов</>
                                : <><UserPlus className="h-4 w-4 text-indigo-400 shrink-0" /> Добавить в контакты</>
                              }
                            </button>
                            {isContact && (
                              <button
                                type="button"
                                onClick={() => { setNicknameInput(''); setNicknameModal(true); setDotMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${useThemeCard ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700'}`}
                              >
                                <Pencil className="h-4 w-4 text-amber-400 shrink-0" /> Изменить никнейм
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {profile.avatar_url ? (
                    <img
                      src={resolveUrl(profile.avatar_url)}
                      alt=""
                      className={`h-24 w-24 rounded-full object-cover ring-2 ${useThemeCard ? 'ring-white/30' : 'ring-slate-200 dark:ring-neutral-700'}`}
                    />
                  ) : (
                    <div className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl font-semibold text-white ${getAvatarColor(profile.name)}`}>
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="text-center">
                    <h2 className={`text-xl font-semibold ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>
                      {!isOwn && contactInfo.nickname ? contactInfo.nickname : profile.name}
                    </h2>
                    {!isOwn && contactInfo.nickname && (
                      <p className={`text-xs mt-0.5 ${useThemeCard ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>{profile.name}</p>
                    )}
                    {profile.public_id && (
                      <p className={`text-sm mt-0.5 font-mono ${useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>@{profile.public_id}</p>
                    )}
                    {isOwn && profile.email && (
                      <p className={`text-sm mt-0.5 ${useThemeCard ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>{profile.email}</p>
                    )}
                  </div>

                  {profile.description && (
                    <p className={`w-full rounded-lg p-3 text-sm ${useThemeCard ? 'text-slate-200' : 'bg-slate-50 text-slate-700 dark:bg-neutral-900/50 dark:text-slate-300'}`}
                      style={useThemeCard ? { background: 'var(--theme-input-bg)' } : undefined}
                    >
                      {profile.description}
                    </p>
                  )}

                  {!isOwn && (
                    <button
                      type="button"
                      onClick={startChat}
                      disabled={starting}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium disabled:opacity-50 transition-colors duration-200 ${hasGlassUI ? 'glass-button' : 'bg-[var(--theme-button-bg)] text-[var(--theme-button-text)]'}`}
                    >
                      <MessageCircle className="h-5 w-5" />
                      {starting ? 'Открываем чат...' : 'Написать'}
                    </button>
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {nicknameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setNicknameModal(false)}>
          <div className={`w-full max-w-sm rounded-2xl p-6 shadow-xl ${useThemeCard ? '' : 'bg-white dark:bg-neutral-800'}`}
            style={useThemeCard ? { background: 'var(--theme-card)' } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-base font-semibold mb-4 ${useThemeCard ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100'}`}>Изменить никнейм</h3>
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder={profile?.name ?? ''}
              maxLength={100}
              className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${useThemeCard ? '' : 'border-slate-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-slate-100'}`}
              style={useThemeCard ? { background: 'var(--theme-input-bg)', borderColor: 'var(--theme-input-border)', color: 'var(--theme-input-text)' } : undefined}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setNicknameModal(false)} className={`px-4 py-2 rounded-lg text-sm ${useThemeCard ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-neutral-700'}`}>Отмена</button>
              <button onClick={saveNickname} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {menuOpen && <AppSidebar onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
