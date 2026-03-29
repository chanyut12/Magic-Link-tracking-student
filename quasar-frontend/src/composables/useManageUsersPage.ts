import { computed, onMounted, ref, watch } from 'vue';
import type { AxiosError } from 'axios';
import { useQuasar } from 'quasar';
import { userService } from '../services/userService';
import type { ManagedUser } from '../types/user';
import { notifyError } from '../utils/notify';
import { getUserDisplayName } from '../utils/userPresentation';

export function useManageUsersPage() {
  const $q = useQuasar();

  const searchText = ref('');
  const users = ref<ManagedUser[]>([]);
  const loading = ref(false);
  const rowsPerPageOptions = [10, 20, 50] as const;
  const pagination = ref({
    page: 1,
    rowsPerPage: 20,
  });

  const showUserDialog = ref(false);
  const showDeleteConfirm = ref(false);
  const editingUser = ref<ManagedUser | null>(null);
  const deleteTargetUser = ref<ManagedUser | null>(null);

  async function fetchUsers(): Promise<void> {
    loading.value = true;
    try {
      users.value = await userService.getUsers();
    } catch (error) {
      console.error('Error fetching users:', error);
      notifyError($q, error, 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้');
    } finally {
      loading.value = false;
    }
  }

  const filteredUsers = computed(() => {
    const sortedUsers = [...users.value].sort((a, b) => (
      getUserDisplayName(a).localeCompare(getUserDisplayName(b), 'th')
    ));

    if (!searchText.value) {
      return sortedUsers;
    }

    const lowerSearch = searchText.value.toLowerCase();
    return sortedUsers.filter((user) => (
      [
        getUserDisplayName(user),
        user.username,
        user.PersonID_Onec,
        user.labels?.join(', '),
        user.affiliation,
      ].some((value) => String(value || '').toLowerCase().includes(lowerSearch))
    ));
  });

  const deleteTargetName = computed(() => (
    deleteTargetUser.value ? getUserDisplayName(deleteTargetUser.value) : ''
  ));

  function openAddDialog(): void {
    editingUser.value = null;
    showUserDialog.value = true;
  }

  function openEditDialog(user: ManagedUser): void {
    editingUser.value = user;
    showUserDialog.value = true;
  }

  function closeUserDialog(): void {
    showUserDialog.value = false;
    editingUser.value = null;
  }

  async function handleUserSaved(): Promise<void> {
    closeUserDialog();
    await fetchUsers();
  }

  function confirmDelete(user: ManagedUser): void {
    deleteTargetUser.value = user;
    showDeleteConfirm.value = true;
  }

  async function performDelete(): Promise<void> {
    if (!deleteTargetUser.value?.id) {
      return;
    }

    const userId = deleteTargetUser.value.id;
    showDeleteConfirm.value = false;

    try {
      await userService.deleteUser(userId);
      users.value = users.value.filter((user) => user.id !== userId);
      $q.notify({
        color: 'positive',
        message: 'ลบข้อมูลสำเร็จ',
        position: 'top',
        icon: 'check',
        timeout: 2000,
      });
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      const nextError = error as AxiosError<{ message?: string }>;
      notifyError(
        $q,
        error,
        `เกิดข้อผิดพลาด: ${nextError.response?.data?.message || 'ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง'}`,
        { icon: 'error' },
      );
    } finally {
      deleteTargetUser.value = null;
    }
  }

  watch(searchText, () => {
    pagination.value.page = 1;
  });

  watch(() => pagination.value.rowsPerPage, () => {
    pagination.value.page = 1;
  });

  watch(() => filteredUsers.value.length, () => {
    const totalPages = Math.max(1, Math.ceil(filteredUsers.value.length / pagination.value.rowsPerPage));
    if (pagination.value.page > totalPages) {
      pagination.value.page = totalPages;
    }
  });

  onMounted(() => {
    void fetchUsers();
  });

  return {
    searchText,
    users,
    loading,
    rowsPerPageOptions,
    pagination,
    showUserDialog,
    showDeleteConfirm,
    editingUser,
    deleteTargetUser,
    filteredUsers,
    deleteTargetName,
    fetchUsers,
    openAddDialog,
    openEditDialog,
    closeUserDialog,
    handleUserSaved,
    confirmDelete,
    performDelete,
  };
}
