import { computed, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { taskService } from '../services/taskService';
import type { TaskLinkAdminAction } from '../types/task';

interface TaskLinkAdminDialogOptions {
  lockTitle?: string;
  unlockTitle?: string;
  lockHint?: string;
  unlockHint?: string;
  lockReasonLabel?: string;
  unlockReasonLabel?: string;
  lockConfirmLabel?: string;
  unlockConfirmLabel?: string;
  lockSuccessMessage?: string;
  unlockSuccessMessage?: string;
  errorMessage?: string;
  defaultLockReason?: string;
  defaultUnlockReason?: string;
  onSuccess?: (() => Promise<void> | void) | undefined;
}

export function useTaskLinkAdminDialog(options: TaskLinkAdminDialogOptions = {}) {
  const $q = useQuasar();

  const adminActionDialog = reactive<{
    show: boolean;
    action: TaskLinkAdminAction;
    linkId: string;
    reason: string;
    loading: boolean;
  }>({
    show: false,
    action: 'lock',
    linkId: '',
    reason: '',
    loading: false,
  });

  const adminDialogTitle = computed(() => (
    adminActionDialog.action === 'lock'
      ? (options.lockTitle || 'ยืนยันปิดลิงก์')
      : (options.unlockTitle || 'ยืนยันเปิดลิงก์อีกครั้ง')
  ));

  const adminDialogHint = computed(() => (
    adminActionDialog.action === 'lock'
      ? (
        options.lockHint
        || 'ระบบจะปิดการเข้าถึงลิงก์นี้ทันที และบันทึกเหตุผลในประวัติ'
      )
      : (
        options.unlockHint
        || 'ระบบจะเปิดให้ใช้งานลิงก์นี้อีกครั้ง และบันทึกเหตุผลในประวัติ'
      )
  ));

  const adminReasonLabel = computed(() => (
    adminActionDialog.action === 'lock'
      ? (options.lockReasonLabel || 'เหตุผลที่ปิดลิงก์')
      : (options.unlockReasonLabel || 'เหตุผลที่เปิดลิงก์')
  ));

  const adminConfirmLabel = computed(() => (
    adminActionDialog.action === 'lock'
      ? (options.lockConfirmLabel || 'ยืนยันปิดลิงก์')
      : (options.unlockConfirmLabel || 'ยืนยันเปิดลิงก์')
  ));

  function openAdminActionDialog(linkId: string, action: TaskLinkAdminAction): void {
    adminActionDialog.linkId = linkId;
    adminActionDialog.action = action;
    adminActionDialog.reason = action === 'lock'
      ? (options.defaultLockReason || 'ปิดลิงก์โดยผู้ดูแลระบบ')
      : (options.defaultUnlockReason || 'เปิดลิงก์อีกครั้งโดยผู้ดูแลระบบ');
    adminActionDialog.show = true;
  }

  async function confirmAdminAction(): Promise<void> {
    if (!adminActionDialog.reason.trim()) {
      $q.notify({ message: 'กรุณาระบุเหตุผล', color: 'warning' });
      return;
    }

    adminActionDialog.loading = true;

    try {
      await taskService.updateTaskLinkAdminStatus(adminActionDialog.linkId, {
        action: adminActionDialog.action,
        reason: adminActionDialog.reason.trim(),
      });

      $q.notify({
        message: adminActionDialog.action === 'lock'
          ? (options.lockSuccessMessage || 'ปิดลิงก์เรียบร้อยแล้ว')
          : (options.unlockSuccessMessage || 'เปิดลิงก์เรียบร้อยแล้ว'),
        color: 'positive',
      });

      adminActionDialog.show = false;
      await options.onSuccess?.();
    } catch (error: unknown) {
      const nextError = error as { response?: { data?: { message?: string } } };
      $q.notify({
        message: nextError.response?.data?.message || options.errorMessage || 'ไม่สามารถอัปเดตสถานะลิงก์ได้',
        color: 'negative',
      });
    } finally {
      adminActionDialog.loading = false;
    }
  }

  return {
    adminActionDialog,
    adminDialogTitle,
    adminDialogHint,
    adminReasonLabel,
    adminConfirmLabel,
    openAdminActionDialog,
    confirmAdminAction,
  };
}

