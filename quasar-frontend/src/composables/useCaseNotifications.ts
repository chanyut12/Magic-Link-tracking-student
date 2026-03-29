import { storeToRefs } from 'pinia';
import { getAppPinia } from 'boot/pinia';
import { useCaseNotificationsStore } from '../stores/case-notifications-store';

export function useCaseNotifications() {
  const notificationsStore = useCaseNotificationsStore(getAppPinia());
  const {
    notifications,
    loadError,
    displayedUnreadNotifications,
    displayedReadNotifications,
    hiddenNotificationsCount,
    dismissedNotificationsCount,
    unreadCount,
  } = storeToRefs(notificationsStore);

  return {
    notifications,
    loadError,
    displayedUnreadNotifications,
    displayedReadNotifications,
    hiddenNotificationsCount,
    dismissedNotificationsCount,
    unreadCount,
    markAsRead: () => notificationsStore.markAsRead(),
    markNotificationAsRead: (notificationId: number) =>
      notificationsStore.markNotificationAsRead(notificationId),
    dismissNotification: (notificationId: number) =>
      notificationsStore.dismissNotification(notificationId),
    restoreDismissedNotifications: () =>
      notificationsStore.restoreDismissedNotifications(),
    fetchNotifications: () => notificationsStore.fetchNotifications(),
  };
}
