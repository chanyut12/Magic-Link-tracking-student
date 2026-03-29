import { computed, ref, type ComputedRef, type Ref } from 'vue';
import type { AuthStorageTarget, ResolvedAuthStorageTarget } from '../types/auth';
import {
  clearMagicSessionToken,
  readMagicSessionToken,
  writeMagicSessionToken,
} from './authSessionState';

interface MagicTaskSessionStore {
  sessionToken: Ref<string>;
  hasSessionToken: ComputedRef<boolean>;
  reloadSessionToken: (target?: AuthStorageTarget) => string;
  saveSessionToken: (
    nextSessionToken: string,
    target?: ResolvedAuthStorageTarget,
  ) => void;
  clearSessionToken: () => void;
}

export function useMagicTaskSession(token: string): MagicTaskSessionStore {
  const sessionToken = ref(readMagicSessionToken(token));
  const hasSessionToken = computed(() => !!sessionToken.value);

  function reloadSessionToken(target: AuthStorageTarget = 'auto'): string {
    const nextSessionToken = readMagicSessionToken(token, target);
    sessionToken.value = nextSessionToken;
    return nextSessionToken;
  }

  function saveSessionToken(
    nextSessionToken: string,
    target: ResolvedAuthStorageTarget = 'session',
  ): void {
    sessionToken.value = nextSessionToken;
    writeMagicSessionToken(token, nextSessionToken, target);
  }

  function clearSessionToken(): void {
    sessionToken.value = '';
    clearMagicSessionToken(token);
  }

  return {
    sessionToken,
    hasSessionToken,
    reloadSessionToken,
    saveSessionToken,
    clearSessionToken,
  };
}
