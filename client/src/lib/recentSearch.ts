const KEY = 'imsitchat-recent-search';
const MAX = 10;

export type RecentUser = { id: string; name: string; email: string };

export function getRecentSearches(): RecentUser[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as RecentUser[];
    return Array.isArray(arr) ? arr.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(user: RecentUser): void {
  const list = getRecentSearches().filter((u) => u.id !== user.id);
  list.unshift(user);
  const trimmed = list.slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
}
