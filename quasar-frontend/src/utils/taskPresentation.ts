import type {
  LoginLink,
  TaskCreateResponse,
  TaskDelegationResponse,
} from '../types/task';

type TaskLinkLike = Pick<LoginLink, 'admin_locked' | 'expires_at'>;

export function normalizeTaskPublicLink(rawLink: string): string {
  if (!rawLink) {
    return rawLink;
  }

  try {
    const url = new URL(rawLink, window.location.origin);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.protocol = window.location.protocol;
      url.host = window.location.host;
    }
    return url.toString();
  } catch {
    return rawLink;
  }
}

export function toMagicLoginLink(rawLink: string): string {
  return normalizeTaskPublicLink(rawLink).replace('/task/', '/login/magic/');
}

export function buildTaskResultLink(
  rawLink: string,
  options: { loginLink?: boolean | undefined } = {},
): string {
  return options.loginLink ? toMagicLoginLink(rawLink) : normalizeTaskPublicLink(rawLink);
}

export function buildTaskQrCodeUrl(link: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
}

export function buildTaskLineShareUrl(link: string): string {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}`;
}

export function isTaskLinkActive(link: TaskLinkLike): boolean {
  return !link.admin_locked && new Date(link.expires_at) > new Date();
}

export function getTaskLinkStatus(link: TaskLinkLike): 'ACTIVE' | 'LOCKED' | 'EXPIRED' {
  if (link.admin_locked) {
    return 'LOCKED';
  }

  if (new Date(link.expires_at) <= new Date()) {
    return 'EXPIRED';
  }

  return 'ACTIVE';
}

export function formatTaskDate(dateStr: string): string {
  if (!dateStr) {
    return '-';
  }

  const date = new Date(dateStr);
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTaskRefreshTimestamp(date = new Date()): string {
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function computeDelegationExpiryHours(
  value: number,
  unit: 'hours' | 'days' | 'weeks',
): number {
  if (unit === 'days') {
    return value * 24;
  }

  if (unit === 'weeks') {
    return value * 168;
  }

  return value;
}

export function extractTaskResultLink(
  payload: Pick<TaskCreateResponse, 'magic_link'> | Pick<TaskDelegationResponse, 'magic_link'>,
  options: { loginLink?: boolean | undefined } = {},
): string {
  return buildTaskResultLink(payload.magic_link, options);
}
