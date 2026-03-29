import { ref } from 'vue';

export interface UseAsyncStateOptions {
  fallbackMessage?: string;
  onError?: ((error: unknown) => void) | undefined;
  resetError?: boolean;
}

export function useAsyncState() {
  const loading = ref(false);
  const errorMessage = ref<string | null>(null);

  function clearError(): void {
    errorMessage.value = null;
  }

  function setError(message: string | null): void {
    errorMessage.value = message;
  }

  async function run<T>(
    executor: () => Promise<T>,
    options: UseAsyncStateOptions = {},
  ): Promise<T | undefined> {
    loading.value = true;

    if (options.resetError !== false) {
      clearError();
    }

    try {
      return await executor();
    } catch (error) {
      if (options.fallbackMessage) {
        setError(options.fallbackMessage);
      }
      options.onError?.(error);
      return undefined;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    errorMessage,
    clearError,
    setError,
    run,
  };
}
