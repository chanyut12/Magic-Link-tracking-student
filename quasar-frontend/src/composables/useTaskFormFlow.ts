import { computed, ref } from 'vue';
import { taskService } from '../services/taskService';
import type { TaskCreatePayload, TaskCreateResponse } from '../types/task';
import { buildTaskQrCodeUrl, extractTaskResultLink } from '../utils/taskPresentation';

interface SubmitTaskOptions {
  loginLink?: boolean | undefined;
}

export function useTaskFormFlow() {
  const submitting = ref(false);
  const showResult = ref(false);
  const resultLink = ref('');

  const qrCodeUrl = computed(() => buildTaskQrCodeUrl(resultLink.value));

  function resetResultState(): void {
    showResult.value = false;
    resultLink.value = '';
  }

  async function submitTask(
    payload: TaskCreatePayload,
    options: SubmitTaskOptions = {},
  ): Promise<TaskCreateResponse> {
    submitting.value = true;

    try {
      const response = await taskService.createTask(payload);
      resultLink.value = extractTaskResultLink(response, {
        loginLink: options.loginLink,
      });
      showResult.value = true;
      return response;
    } finally {
      submitting.value = false;
    }
  }

  return {
    submitting,
    showResult,
    resultLink,
    qrCodeUrl,
    resetResultState,
    submitTask,
  };
}
