const COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-rose-500',
  'bg-orange-500', 'bg-teal-500', 'bg-cyan-500', 'bg-emerald-500',
  'bg-sky-500', 'bg-fuchsia-500', 'bg-lime-600', 'bg-amber-500',
];

export function getAvatarColor(name: string): string {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return COLORS[n % COLORS.length];
}
