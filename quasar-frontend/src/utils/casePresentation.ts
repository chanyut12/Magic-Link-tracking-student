import type {
  CaseDashboardStats,
  CaseLinkStatus,
  CaseRecord,
  CaseReviewAction,
  CaseStatus,
  CaseTaskChainLink,
} from '../types/case';
import { buildTaskLineShareUrl, normalizeTaskPublicLink } from './taskPresentation';

export type CaseDateRangeFilter = 'ALL' | 'TODAY' | 'LAST_7' | 'LAST_30';

export function formatCaseRefreshTimestamp(): string {
  return new Date().toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCaseDate(value: string): string {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

export function formatCaseDateTime(value: string): string {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getCaseCompletionRate(stats: CaseDashboardStats): number {
  if (!stats.total) {
    return 0;
  }

  return Math.round((stats.resolved / stats.total) * 100);
}

export function getCaseStatusLabel(status: string): string {
  const labels: Record<CaseStatus, string> = {
    OPEN: 'รอสร้างลิงค์',
    PENDING_REVIEW: 'รอผอ.ประเมิน',
    IN_PROGRESS: 'กำลังติดตาม',
    AWAITING_HELP: 'รอรับความช่วยเหลือจากหน่วยงาน',
    RESOLVED: 'ปิดเคสสำเร็จ',
  };

  return labels[status] || status;
}

export function getCaseStatusBadgeClass(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'badge-open';
    case 'PENDING_REVIEW':
      return 'badge-pending';
    case 'IN_PROGRESS':
      return 'badge-progress';
    case 'RESOLVED':
      return 'badge-completed';
    default:
      return 'badge-active';
  }
}

function isCaseLinkLocked(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

type CaseLinkRecord = Pick<
  CaseRecord,
  'link_state' | 'active_link' | 'active_link_id' | 'active_link_locked' | 'active_link_expires_at'
>;

export function getCaseLinkStatus(record: CaseLinkRecord): CaseLinkStatus {
  if (record.link_state === 'ACTIVE'
    || record.link_state === 'LOCKED'
    || record.link_state === 'EXPIRED'
    || record.link_state === 'NONE') {
    return record.link_state;
  }

  if (isCaseLinkLocked(record.active_link_locked)) {
    return 'LOCKED';
  }

  if (record.active_link_expires_at) {
    const expiresAt = new Date(record.active_link_expires_at);
    if (!Number.isNaN(expiresAt.getTime())) {
      return expiresAt > new Date() ? 'ACTIVE' : 'EXPIRED';
    }
  }

  if (record.active_link || record.active_link_id) {
    return 'ACTIVE';
  }

  return 'NONE';
}

export function getCaseLinkStatusLabel(record: CaseLinkRecord): string {
  const labels: Record<CaseLinkStatus, string> = {
    ACTIVE: 'ใช้งานอยู่',
    LOCKED: 'ปิดโดยผู้ดูแล',
    EXPIRED: 'หมดอายุ',
    NONE: 'ไม่มีลิงก์',
  };

  return labels[getCaseLinkStatus(record)];
}

export function getCaseLinkStatusBadgeClass(record: CaseLinkRecord): string {
  switch (getCaseLinkStatus(record)) {
    case 'ACTIVE':
      return 'badge-active';
    case 'LOCKED':
      return 'badge-locked';
    case 'EXPIRED':
      return 'badge-expired';
    default:
      return 'badge-none';
  }
}

export function isCaseLinkReady(
  record: CaseLinkRecord,
): boolean {
  return getCaseLinkStatus(record) === 'ACTIVE' && Boolean(record.active_link);
}

export function getCasePublicLink(rawLink: string): string {
  return normalizeTaskPublicLink(rawLink);
}

export function getCaseShareUrl(rawLink: string): string {
  return buildTaskLineShareUrl(getCasePublicLink(rawLink));
}

export function isCaseInDateRange(
  value: string,
  range: CaseDateRangeFilter,
): boolean {
  if (range === 'ALL' || !value) {
    return true;
  }

  const targetDate = new Date(value);
  if (Number.isNaN(targetDate.getTime())) {
    return false;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  );

  if (range === 'TODAY') {
    return startOfTarget.getTime() === startOfToday.getTime();
  }

  const dayDiff = Math.floor(
    (startOfToday.getTime() - startOfTarget.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDiff < 0) {
    return false;
  }

  if (range === 'LAST_7') {
    return dayDiff <= 6;
  }

  if (range === 'LAST_30') {
    return dayDiff <= 29;
  }

  return true;
}

export function getCaseTimelineDotClass(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'dot-active',
    DELEGATED: 'dot-delegated',
    COMPLETED: 'dot-completed',
    EXPIRED: 'dot-expired',
  };

  return map[status] || 'dot-active';
}

export function getCaseTimelineActionText(index: number, depth: number): string {
  if (index === 0) {
    return 'ได้รับมอบหมายจากต้นทาง';
  }

  return `ได้รับการส่งต่อ (ทอดที่ ${depth})`;
}

export function getCaseTimelineStatusText(
  link: Pick<CaseTaskChainLink, 'status' | 'admin_locked'>,
): string {
  if (link.status === 'DELEGATED') {
    return ' — ส่งต่อให้คนอื่นแล้ว';
  }
  if (link.status === 'COMPLETED') {
    return ' — ลงพื้นที่สำเร็จ';
  }
  if (link.status === 'ACTIVE') {
    return ' — รอดำเนินการ';
  }
  if (link.admin_locked) {
    return ' — ถูกผู้ดูแลปิดลิงก์';
  }

  return '';
}

export function getCaseCauseLabel(category: string): string {
  const labels: Record<string, string> = {
    ECONOMIC: 'ปัญหาทางเศรษฐกิจ',
    FAMILY: 'ปัญหาครอบครัว',
    HEALTH: 'ปัญหาสุขภาพ',
    MIGRATION: 'ย้ายถิ่นฐาน',
    DISABILITY: 'ความพิการ',
    BEHAVIOR: 'ปัญหาพฤติกรรม',
    OTHER: 'อื่นๆ',
  };

  return labels[category] || category || '-';
}

export function getCaseReviewActionLabel(action: string): string {
  const labels: Record<CaseReviewAction, string> = {
    ASSIST: 'ให้ความช่วยเหลือ',
    FORWARD: 'ส่งต่อหน่วยงาน/ผู้เกี่ยวข้อง',
    CLOSE: 'ปิดเคส',
  };

  return labels[action as CaseReviewAction] || action;
}

export function getCaseStatusSummaryLabel(status: string): string {
  const labels: Record<CaseStatus, string> = {
    OPEN: 'รอสร้างลิงค์',
    PENDING_REVIEW: 'รอผอ.ประเมิน',
    IN_PROGRESS: 'กำลังดำเนินการ',
    AWAITING_HELP: 'รอรับความช่วยเหลือจากหน่วยงาน',
    RESOLVED: 'ปิดเคสแล้ว',
  };

  return labels[status] || status || '-';
}

export function toCaseLocationNumber(value: unknown): number | null {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : null;
}

export function parseCasePhotoPaths(paths: string): string[] {
  const normalized = (paths || '').trim();
  if (!normalized) {
    return [];
  }

  if (normalized.startsWith('[')) {
    try {
      const parsed = JSON.parse(normalized);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  return normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getCasePhotoUrl(filename: string): string {
  const normalized = (filename || '').trim();
  if (!normalized) {
    return '';
  }

  if (
    normalized.startsWith('data:')
    || normalized.startsWith('http')
    || normalized.startsWith('/uploads/')
  ) {
    return normalized;
  }

  return `/uploads/${normalized}`;
}

export function createEmptyCaseDashboardStats(): CaseDashboardStats {
  return {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    today: 0,
    pendingReview: 0,
    activeLinks: 0,
    delegations: 0,
  };
}
