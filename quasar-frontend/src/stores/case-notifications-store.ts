import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { caseService } from '../services/caseService';
import type { CaseRecord } from '../types/case';
import {
  readStoredDismissedCaseIds,
  readStoredReadCaseIds,
  writeStoredDismissedCaseIds,
  writeStoredReadCaseIds,
} from '../composables/caseNotificationState';

const MAX_UNREAD_NOTIFICATIONS = 8;
const MAX_READ_NOTIFICATIONS = 6;

export const useCaseNotificationsStore = defineStore(
  'case-notifications',
  () => {
    const notifications = ref<CaseRecord[]>([]);
    const loadError = ref('');
    const readCaseIds = ref<number[]>(readStoredReadCaseIds());
    const dismissedNotificationIds = ref<number[]>(
      readStoredDismissedCaseIds(),
    );

    const readCaseIdSet = computed(() => new Set(readCaseIds.value));
    const activeNotificationIdSet = computed(
      () => new Set(notifications.value.map((notification) => notification.id)),
    );
    const activeDismissedNotificationIds = computed(() =>
      dismissedNotificationIds.value.filter((notificationId) =>
        activeNotificationIdSet.value.has(notificationId),
      ),
    );
    const dismissedNotificationIdSet = computed(
      () => new Set(activeDismissedNotificationIds.value),
    );

    const sortedNotifications = computed(() =>
      [...notifications.value].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      }),
    );

    const visibleNotifications = computed(() =>
      sortedNotifications.value.filter(
        (notification) => !dismissedNotificationIdSet.value.has(notification.id),
      ),
    );

    const unreadNotifications = computed(() =>
      visibleNotifications.value.filter(
        (notification) => !readCaseIdSet.value.has(notification.id),
      ),
    );

    const readNotifications = computed(() =>
      visibleNotifications.value.filter((notification) =>
        readCaseIdSet.value.has(notification.id),
      ),
    );

    const displayedUnreadNotifications = computed(() =>
      unreadNotifications.value.slice(0, MAX_UNREAD_NOTIFICATIONS),
    );

    const displayedReadNotifications = computed(() =>
      readNotifications.value.slice(0, MAX_READ_NOTIFICATIONS),
    );

    const hiddenNotificationsCount = computed(
      () =>
        unreadNotifications.value.length
          - displayedUnreadNotifications.value.length
          + readNotifications.value.length
          - displayedReadNotifications.value.length,
    );

    const dismissedNotificationsCount = computed(
      () => activeDismissedNotificationIds.value.length,
    );
    const unreadCount = computed(() => unreadNotifications.value.length);

    async function fetchNotifications(): Promise<void> {
      try {
        const cases = await caseService.getCases();
        notifications.value = cases.filter((record) => record.status === 'OPEN');
        loadError.value = '';
        cleanupDismissedNotifications();
      } catch (error) {
        console.warn('Failed to fetch notifications', error);
        loadError.value = 'ไม่สามารถโหลดการแจ้งเตือนได้';
      }
    }

    function persistReadCaseIds(nextIds: number[]): void {
      readCaseIds.value = Array.from(new Set(nextIds));
      writeStoredReadCaseIds(readCaseIds.value);
    }

    function persistDismissedNotificationIds(nextIds: number[]): void {
      dismissedNotificationIds.value = Array.from(new Set(nextIds));
      writeStoredDismissedCaseIds(dismissedNotificationIds.value);
    }

    function markAsRead(): void {
      if (notifications.value.length === 0) {
        return;
      }

      persistReadCaseIds([
        ...readCaseIds.value,
        ...notifications.value.map((notification) => notification.id),
      ]);
    }

    function markNotificationAsRead(notificationId: number): void {
      if (readCaseIdSet.value.has(notificationId)) {
        return;
      }

      persistReadCaseIds([...readCaseIds.value, notificationId]);
    }

    function dismissNotification(notificationId: number): void {
      if (dismissedNotificationIdSet.value.has(notificationId)) {
        return;
      }

      persistDismissedNotificationIds([
        ...dismissedNotificationIds.value,
        notificationId,
      ]);
    }

    function restoreDismissedNotifications(): void {
      persistDismissedNotificationIds([]);
    }

    function cleanupDismissedNotifications(): void {
      const nextDismissedIds = dismissedNotificationIds.value.filter(
        (notificationId) => activeNotificationIdSet.value.has(notificationId),
      );

      if (nextDismissedIds.length === dismissedNotificationIds.value.length) {
        return;
      }

      persistDismissedNotificationIds(nextDismissedIds);
    }

    return {
      notifications,
      loadError,
      displayedUnreadNotifications,
      displayedReadNotifications,
      hiddenNotificationsCount,
      dismissedNotificationsCount,
      unreadCount,
      fetchNotifications,
      markAsRead,
      markNotificationAsRead,
      dismissNotification,
      restoreDismissedNotifications,
    };
  },
);
