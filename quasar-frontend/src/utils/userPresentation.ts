import type { ManagedUser } from '../types/user';

const avatarColors = [
  ['#6366f1', '#8b5cf6'],
  ['#ec4899', '#f43f5e'],
  ['#14b8a6', '#06b6d4'],
  ['#f59e0b', '#f97316'],
  ['#10b981', '#22c55e'],
  ['#3b82f6', '#0ea5e9'],
  ['#8b5cf6', '#a855f7'],
  ['#ef4444', '#f97316'],
] as const;

export function getUserDisplayName(user: ManagedUser): string {
  const firstName = user.FirstName?.trim() || '';
  const lastName = user.LastName?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || user.fullname?.trim() || user.username || '-';
}

export function getUserInitial(user: ManagedUser): string {
  return getUserDisplayName(user).charAt(0).toUpperCase() || '?';
}

export function getUserRoleText(user: ManagedUser): string {
  return user.labels && user.labels.length > 0 ? user.labels.join(', ') : 'ไม่มีตำแหน่ง';
}

export function getUserAvatarGradient(name: string): Record<string, string> {
  if (!name) {
    return { background: '#ccc', color: '#fff' };
  }

  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % avatarColors.length;
  const [c1, c2] = avatarColors[index] ?? ['#6366f1', '#8b5cf6'];

  return {
    background: `linear-gradient(135deg, ${c1}, ${c2})`,
    color: 'white',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
  };
}

