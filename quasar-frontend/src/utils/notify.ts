import type { QNotifyCreateOptions } from 'quasar';

interface AxiosStyleErrorPayload {
  message?: string;
  error?: string;
}

interface NotifyLike {
  notify: (options: QNotifyCreateOptions) => void;
}

interface ErrorWithResponse {
  response?: {
    data?: AxiosStyleErrorPayload;
  };
  message?: string;
}

export function resolveErrorMessage(error: unknown, fallback: string): string {
  const nextError = error as ErrorWithResponse;
  return nextError.response?.data?.message
    || nextError.response?.data?.error
    || nextError.message
    || fallback;
}

export function notifyError(
  target: NotifyLike,
  error: unknown,
  fallback: string,
  options: QNotifyCreateOptions = {},
): void {
  target.notify({
    color: 'negative',
    position: 'top',
    message: resolveErrorMessage(error, fallback),
    ...options,
  });
}
