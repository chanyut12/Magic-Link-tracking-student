const READ_CASE_IDS_STORAGE_KEY = 'read_case_ids';
const DISMISSED_CASE_IDS_STORAGE_KEY = 'dismissed_case_ids';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readArrayFromStorage(key: string): number[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return Array.from(new Set(parsed.map((item) => Number(item)).filter(Number.isInteger)));
  } catch {
    return [];
  }
}

function writeArrayToStorage(key: string, value: number[]): void {
  if (!isBrowser()) {
    return;
  }

  if (value.length === 0) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readStoredReadCaseIds(): number[] {
  return readArrayFromStorage(READ_CASE_IDS_STORAGE_KEY);
}

export function writeStoredReadCaseIds(value: number[]): void {
  writeArrayToStorage(READ_CASE_IDS_STORAGE_KEY, value);
}

export function readStoredDismissedCaseIds(): number[] {
  return readArrayFromStorage(DISMISSED_CASE_IDS_STORAGE_KEY);
}

export function writeStoredDismissedCaseIds(value: number[]): void {
  writeArrayToStorage(DISMISSED_CASE_IDS_STORAGE_KEY, value);
}

