import type {
  AttendanceHistoryRecord,
  AttendanceHistoryStats,
  AttendanceSelectionStatus,
  AttendanceTask,
  AttendanceTaskCardStats,
  AttendanceTaskStatus,
} from '../types/attendance';

function getBrowserOrigin(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  return 'http://localhost';
}

export function normalizeAttendanceSelectionStatus(
  status: unknown,
): AttendanceSelectionStatus {
  if (status === 1 || status === '1' || status === 'P_PRESENT' || status === 'PRESENT') {
    return 'P_PRESENT';
  }

  if (status === 2 || status === '2' || status === 'P_ABSENT' || status === 'ABSENT') {
    return 'P_ABSENT';
  }

  if (status === 3 || status === '3' || status === 'P_LATE' || status === 'LATE') {
    return 'P_LATE';
  }

  return 'NONE';
}

export function buildAttendanceHistoryStats(
  records: AttendanceHistoryRecord[],
): AttendanceHistoryStats {
  return records.reduce<AttendanceHistoryStats>((stats, record) => {
    if (record.status === 'P_PRESENT') {
      stats.present += 1;
    } else if (record.status === 'P_ABSENT') {
      stats.absent += 1;
    } else if (record.status === 'P_LATE') {
      stats.late += 1;
    }

    return stats;
  }, {
    present: 0,
    absent: 0,
    late: 0,
  });
}

export function getAttendanceStatusClass(status: AttendanceSelectionStatus): string {
  if (status === 'P_PRESENT') return 'present';
  if (status === 'P_ABSENT') return 'absent';
  if (status === 'P_LATE') return 'late';
  return 'none';
}

export function getAttendanceStatusIcon(status: AttendanceSelectionStatus): string {
  if (status === 'P_PRESENT') return 'fa-check';
  if (status === 'P_ABSENT') return 'fa-times';
  if (status === 'P_LATE') return 'fa-clock';
  return 'fa-question-circle';
}

export function getAttendanceStatusLabel(status: AttendanceSelectionStatus): string {
  if (status === 'P_PRESENT') return 'มาเรียน';
  if (status === 'P_ABSENT') return 'ขาด';
  if (status === 'P_LATE') return 'สาย';
  return 'ไม่ได้เช็คชื่อ';
}

export function sortAttendanceRoomValues(left: string, right: string): number {
  return left.localeCompare(right, 'th', { numeric: true, sensitivity: 'base' });
}

export function getAttendanceTaskStatus(task: AttendanceTask): AttendanceTaskStatus {
  if (task.active_link && !task.active_link_locked) return 'ACTIVE';
  if (task.active_link && task.active_link_locked) return 'LOCKED';
  return 'EXPIRED';
}

export function isAttendanceTaskLinkReady(task: AttendanceTask): boolean {
  return Boolean(task.active_link && !task.active_link_locked);
}

export function normalizeAttendancePublicLink(rawLink: string, origin = getBrowserOrigin()): string {
  if (!rawLink) return rawLink;

  try {
    const url = new URL(rawLink, origin);
    const originUrl = new URL(origin);

    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.protocol = originUrl.protocol;
      url.host = originUrl.host;
    }

    return url.toString();
  } catch {
    return rawLink;
  }
}

export function getAttendanceTaskPublicLink(task: AttendanceTask, origin = getBrowserOrigin()): string {
  if (task.active_link) {
    return normalizeAttendancePublicLink(task.active_link, origin);
  }

  if (!task.active_link_id) {
    return '';
  }

  return `${origin}/#/task/${task.active_link_id}`;
}

export function getAttendanceTaskShareUrl(link: string): string {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}`;
}

export function buildAttendanceTaskCardStats(
  tasks: AttendanceTask[],
): AttendanceTaskCardStats {
  return tasks.reduce<AttendanceTaskCardStats>((stats, task) => {
    stats.total += 1;

    const status = getAttendanceTaskStatus(task);
    if (status === 'ACTIVE') {
      stats.active += 1;
    } else if (status === 'LOCKED') {
      stats.locked += 1;
    } else {
      stats.expired += 1;
    }

    return stats;
  }, {
    total: 0,
    active: 0,
    locked: 0,
    expired: 0,
  });
}

export function formatAttendanceDate(date: string): string {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatAttendanceRefreshTimestamp(date = new Date()): string {
  return date.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
