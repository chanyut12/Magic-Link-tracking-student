import { computed, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { caseService } from '../services/caseService';
import { taskService } from '../services/taskService';
import type {
  CaseReviewAction,
  CaseReviewRecord,
  CaseTaskDetail,
  CaseTaskRecord,
  CaseTaskSubmission,
} from '../types/case';
import type { TaskCreateResponse } from '../types/task';

interface ReviewFormState {
  review_action: CaseReviewAction;
  review_note: string;
  reviewed_by: string;
}

interface NewLinkFormState {
  assigned_to_name: string;
  assigned_to_phone: string;
  assigned_to_email: string;
  expires_value: string;
}

interface CloseAwaitingFormState {
  reviewed_by: string;
  review_note: string;
}

const reviewActionOptions = [
  { label: 'ให้ความช่วยเหลือ', value: 'ASSIST' as const },
  { label: 'ส่งต่อหน่วยงาน/ผู้เกี่ยวข้อง', value: 'FORWARD' as const },
  { label: 'ปิดเคส', value: 'CLOSE' as const },
];

function getErrorMessage(error: unknown, fallback: string): string {
  const nextError = error as { response?: { data?: { message?: string } } };
  return nextError.response?.data?.message || fallback;
}

export function useCaseTaskDetail(taskId: string) {
  const $q = useQuasar();

  const loading = ref(true);
  const data = ref<CaseTaskDetail | null>(null);
  const reviews = ref<CaseReviewRecord[]>([]);
  const caseTasks = ref<CaseTaskRecord[]>([]);
  const reviewSaving = ref(false);
  const newLinkSaving = ref(false);
  const closeAwaitingSaving = ref(false);
  const newLinkDialog = ref(false);
  const newMagicLink = ref('');

  const reviewForm = reactive<ReviewFormState>({
    review_action: 'ASSIST',
    review_note: '',
    reviewed_by: '',
  });

  const newLinkForm = reactive<NewLinkFormState>({
    assigned_to_name: '',
    assigned_to_phone: '',
    assigned_to_email: '',
    expires_value: '24',
  });

  const closeAwaitingForm = reactive<CloseAwaitingFormState>({
    reviewed_by: '',
    review_note: '',
  });

  const chain = computed(() => data.value?.chain || []);

  const submission = computed<CaseTaskSubmission | null>(() => {
    const submissions = chain.value
      .map((link) => link.submission)
      .filter((item): item is CaseTaskSubmission => Boolean(item));

    if (submissions.length === 0) {
      return null;
    }

    return submissions.sort((a, b) => {
      const timeA = new Date(String(a.submitted_at)).getTime();
      const timeB = new Date(String(b.submitted_at)).getTime();
      return timeB - timeA;
    })[0] || null;
  });

  const canReview = computed(() => (
    data.value?.task_type === 'VISIT'
      && Boolean(data.value?.case_id)
      && data.value?.case_status === 'PENDING_REVIEW'
  ));
  const hasReviewCase = computed(() => (
    data.value?.task_type === 'VISIT'
      && Boolean(data.value?.case_id)
      && data.value?.case_status === 'RESOLVED'
  ));
  const canCreateNewLink = computed(() => (
    data.value?.task_type === 'VISIT'
      && Boolean(data.value?.case_id)
      && data.value?.case_status === 'IN_PROGRESS'
  ));
  const canCloseAwaiting = computed(() => (
    data.value?.task_type === 'VISIT'
      && Boolean(data.value?.case_id)
      && data.value?.case_status === 'AWAITING_HELP'
  ));

  const headerInfo = computed(() => {
    if (!data.value) {
      return '';
    }

    if (data.value.task_type === 'ATTENDANCE') {
      return `ภารกิจเช็คชื่อ ${data.value.target_grade || '-'}/${data.value.target_room || '-'}`;
    }

    return `${data.value.student_name || ''} — ${data.value.student_school || ''}`;
  });

  async function fetchData(): Promise<void> {
    try {
      data.value = await caseService.getTaskDetail(taskId);

      if (data.value?.case_id) {
        const [nextReviews, nextTasks] = await Promise.all([
          caseService.getCaseReviews(Number(data.value.case_id)),
          caseService.getCaseTasks(Number(data.value.case_id)),
        ]);
        reviews.value = nextReviews;
        caseTasks.value = nextTasks;
      } else {
        reviews.value = Array.isArray(data.value?.reviews) ? data.value.reviews : [];
        caseTasks.value = [];
      }
    } catch (error) {
      console.error(error);
      $q.notify({ message: 'ไม่สามารถโหลดข้อมูลได้', color: 'negative' });
    } finally {
      loading.value = false;
    }
  }

  async function refreshData(): Promise<void> {
    loading.value = true;
    await fetchData();
  }

  function resetNewLinkForm(): void {
    newLinkForm.assigned_to_name = '';
    newLinkForm.assigned_to_phone = '';
    newLinkForm.assigned_to_email = '';
    newLinkForm.expires_value = '24';
  }

  async function submitNewLink(): Promise<TaskCreateResponse | void> {
    if (!data.value?.case_id || !canCreateNewLink.value) {
      return;
    }

    if (!newLinkForm.assigned_to_name.trim()) {
      $q.notify({ message: 'กรุณากรอกชื่อผู้รับมอบหมาย', color: 'warning' });
      return;
    }

    newLinkSaving.value = true;
    try {
      const response = await taskService.createTask({
        task_type: 'VISIT',
        type: 'VISIT',
        existing_case_id: String(data.value.case_id),
        assigned_to_name: newLinkForm.assigned_to_name.trim(),
        assigned_to_phone: newLinkForm.assigned_to_phone.trim() || undefined,
        assigned_to_email: newLinkForm.assigned_to_email.trim() || undefined,
        expires_value: Number(newLinkForm.expires_value),
        expires_unit: 'hours',
      });

      newMagicLink.value = response.magic_link;
      newLinkDialog.value = true;
      resetNewLinkForm();
      $q.notify({ message: 'สร้าง Link มอบหมายใหม่สำเร็จ', color: 'positive' });
      await refreshData();
      return response;
    } catch (error) {
      $q.notify({
        message: getErrorMessage(error, 'ไม่สามารถสร้าง Link ได้'),
        color: 'negative',
      });
    } finally {
      newLinkSaving.value = false;
    }
  }

  async function submitCloseAwaiting(): Promise<void> {
    if (!data.value?.case_id || !canCloseAwaiting.value) {
      return;
    }

    closeAwaitingSaving.value = true;
    try {
      await caseService.reviewCase(Number(data.value.case_id), {
        review_action: 'CLOSE',
        review_note: closeAwaitingForm.review_note || undefined,
        reviewed_by: closeAwaitingForm.reviewed_by || 'ผอ.',
      });
      $q.notify({ message: 'ปิดเคสสำเร็จ', color: 'positive' });
      await refreshData();
    } catch (error) {
      $q.notify({
        message: getErrorMessage(error, 'ไม่สามารถปิดเคสได้'),
        color: 'negative',
      });
    } finally {
      closeAwaitingSaving.value = false;
    }
  }

  async function submitReview(): Promise<void> {
    if (!data.value?.case_id || !canReview.value) {
      return;
    }

    if (!reviewForm.review_action) {
      $q.notify({ message: 'กรุณาเลือกการตัดสินใจ', color: 'warning' });
      return;
    }

    reviewSaving.value = true;
    try {
      await caseService.reviewCase(Number(data.value.case_id), {
        review_action: reviewForm.review_action,
        review_note: reviewForm.review_note || undefined,
        reviewed_by: reviewForm.reviewed_by || undefined,
      });
      reviewForm.review_note = '';
      $q.notify({ message: 'บันทึกผลการประเมินสำเร็จ', color: 'positive' });
      await refreshData();
    } catch (error) {
      console.error(error);
      $q.notify({
        message: getErrorMessage(error, 'ไม่สามารถบันทึกผลการประเมินได้'),
        color: 'negative',
      });
    } finally {
      reviewSaving.value = false;
    }
  }

  return {
    loading,
    data,
    reviews,
    caseTasks,
    reviewSaving,
    newLinkSaving,
    closeAwaitingSaving,
    reviewForm,
    newLinkForm,
    closeAwaitingForm,
    newLinkDialog,
    newMagicLink,
    reviewActionOptions,
    chain,
    submission,
    canReview,
    hasReviewCase,
    canCreateNewLink,
    canCloseAwaiting,
    headerInfo,
    fetchData,
    refreshData,
    submitNewLink,
    submitCloseAwaiting,
    submitReview,
  };
}
