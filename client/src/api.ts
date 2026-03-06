const API = import.meta.env.VITE_API_URL || '';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || String(err) || res.statusText);
  }
  return res.json();
}

export const authApi = {
  register: (email: string, password: string, name: string, role?: string) =>
    api<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role: role || 'user' }),
    }),
  login: (email: string, password: string) =>
    api<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => api<User>('/api/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api<{ ok: boolean }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export type PublicProfile = { id: string; name: string; email?: string; description?: string | null; avatar_url?: string | null };

export type ContactRow = { contact_id: string; name: string; avatar_url: string | null; nickname: string | null; local_photo: string | null; created_at: string };

export const contactsApi = {
  list: () => api<ContactRow[]>('/api/contacts'),
  add: (contactId: string) => api<{ ok: boolean }>('/api/contacts', { method: 'POST', body: JSON.stringify({ contactId }) }),
  remove: (contactId: string) => api<{ ok: boolean }>(`/api/contacts/${contactId}`, { method: 'DELETE' }),
  update: (contactId: string, data: { nickname?: string | null; local_photo?: string | null }) =>
    api<{ ok: boolean }>(`/api/contacts/${contactId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  check: (contactId: string) => api<{ isContact: boolean }>(`/api/contacts/${contactId}/check`),
};

export const usersApi = {
  list: () => api<{ id: string; name: string; email: string }[]>('/api/users'),
  getProfile: (id: string) => api<PublicProfile>(`/api/users/${id}`),
  updateProfile: (data: { name?: string; email?: string; description?: string | null; avatar_url?: string | null }) =>
    api<User>('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  uploadAvatar: async (file: File): Promise<{ avatar_url: string }> => {
    const token = localStorage.getItem('token');
    const API = import.meta.env.VITE_API_URL || '';
    const form = new FormData();
    form.append('avatar', file);
    const res = await fetch(`${API}/api/users/me/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  },
};

export const dialogsApi = {
  list: () =>
    api<{ id: string; created_at: string; other?: { id: string; name: string; email: string; avatar_url?: string | null } }[]>(
      '/api/dialogs'
    ),
  getOrCreate: (otherUserId: string) =>
    api<{ dialogId: string }>('/api/dialogs', {
      method: 'POST',
      body: JSON.stringify({ otherUserId }),
    }),
};

export const messagesApi = {
  list: (dialogId: string) =>
    api<Message[]>(`/api/dialogs/${dialogId}/messages`),
  send: (dialogId: string, body: string) =>
    api<Message>(`/api/dialogs/${dialogId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
};

export const adminApi = {
  listUsers: () =>
    api<{ id: string; email: string; name: string; role: string; created_at: string }[]>('/api/admin/users'),
};

export interface User {
  id: string;
  email: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  role: string;
  created_at: string;
}

export interface Message {
  id: string;
  dialog_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name?: string;
  sender_email?: string;
  sender_avatar_url?: string | null;
}
