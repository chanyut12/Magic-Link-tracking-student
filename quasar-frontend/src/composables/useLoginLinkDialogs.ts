import { computed, reactive, ref } from 'vue';
import type { TaskLinkAdminAction } from '../types/task';

export function useLoginLinkDialogs() {
  const addDialog = ref(false);
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
      ? 'ยืนยันปิดลิงก์เข้าสู่ระบบ'
      : 'ยืนยันเปิดลิงก์เข้าสู่ระบบ'
  ));

  const adminDialogHint = computed(() => (
    adminActionDialog.action === 'lock'
      ? 'ระบบจะปิดการใช้งานลิงก์นี้ทันที และบันทึกเหตุผลไว้'
      : 'ระบบจะเปิดใช้งานลิงก์นี้อีกครั้ง และบันทึกเหตุผลไว้'
  ));

  const adminReasonLabel = computed(() => (
    adminActionDialog.action === 'lock' ? 'เหตุผลที่ปิดลิงก์' : 'เหตุผลที่เปิดลิงก์'
  ));

  const adminConfirmLabel = computed(() => (
    adminActionDialog.action === 'lock' ? 'ยืนยันปิดลิงก์' : 'ยืนยันเปิดลิงก์'
  ));

  function openAddDialog(): void {
    addDialog.value = true;
  }

  function openAdminActionDialog(
    linkId: string,
    action: TaskLinkAdminAction,
  ): void {
    adminActionDialog.linkId = linkId;
    adminActionDialog.action = action;
    adminActionDialog.reason = action === 'lock'
      ? 'ปิดลิงก์โดยผู้ดูแลระบบ'
      : 'เปิดลิงก์อีกครั้งโดยผู้ดูแลระบบ';
    adminActionDialog.show = true;
  }

  return {
    addDialog,
    adminActionDialog,
    adminDialogTitle,
    adminDialogHint,
    adminReasonLabel,
    adminConfirmLabel,
    openAddDialog,
    openAdminActionDialog,
  };
}
