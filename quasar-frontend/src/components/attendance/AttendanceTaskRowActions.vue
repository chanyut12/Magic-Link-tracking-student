<template>
  <div class="row-action-group">
    <q-btn
      v-if="isLinkReady"
      flat
      dense
      color="primary"
      label="เปิดลิงก์"
      class="action-btn action-btn--open"
      :href="publicLink"
      target="_blank"
    />
    <span v-else class="status-text status-text--muted">ไม่มีลิงก์ที่ใช้งานได้</span>

    <q-btn
      v-if="hasRowMenu"
      flat
      round
      dense
      color="grey-7"
      icon="fa-solid fa-ellipsis-vertical"
      class="action-menu-btn"
    >
      <q-menu auto-close>
        <q-list dense style="min-width: 190px">
          <q-item clickable class="action-menu-item action-menu-item--copy" @click="copyLink">
            <q-item-section avatar><i class="fa-regular fa-copy"></i></q-item-section>
            <q-item-section>คัดลอกลิงก์</q-item-section>
          </q-item>
          <q-item
            v-if="isLinkReady"
            clickable
            class="action-menu-item action-menu-item--share"
            tag="a"
            :href="shareUrl"
            target="_blank"
          >
            <q-item-section avatar><i class="fa-brands fa-line"></i></q-item-section>
            <q-item-section>แชร์ผ่าน LINE</q-item-section>
          </q-item>
          <q-separator v-if="task.active_link_id" />
          <q-item
            v-if="task.active_link_id && task.active_link_locked"
            clickable
            class="action-menu-item action-menu-item--unlock"
            @click="emit('admin-action', task.active_link_id, 'unlock')"
          >
            <q-item-section avatar><i class="fa-solid fa-lock-open"></i></q-item-section>
            <q-item-section>เปิดลิงก์อีกครั้ง</q-item-section>
          </q-item>
          <q-item
            v-if="task.active_link_id && !task.active_link_locked"
            clickable
            class="action-menu-item action-menu-item--lock"
            @click="emit('admin-action', task.active_link_id, 'lock')"
          >
            <q-item-section avatar><i class="fa-solid fa-lock"></i></q-item-section>
            <q-item-section>ปิดลิงก์</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { copyText } from '../../utils/clipboard';
import type { AttendanceTask, AttendanceTaskAdminAction } from '../../types/attendance';
import {
  getAttendanceTaskPublicLink,
  getAttendanceTaskShareUrl,
  isAttendanceTaskLinkReady,
} from '../../utils/attendancePresentation';

const props = defineProps<{
  task: AttendanceTask;
}>();

const emit = defineEmits<{
  (event: 'admin-action', linkId: string, action: AttendanceTaskAdminAction): void;
}>();

const $q = useQuasar();

const publicLink = computed(() => getAttendanceTaskPublicLink(props.task));
const shareUrl = computed(() => getAttendanceTaskShareUrl(publicLink.value));
const isLinkReady = computed(() => isAttendanceTaskLinkReady(props.task));
const hasRowMenu = computed(() => Boolean(props.task.active_link_id || props.task.active_link));

async function copyLink() {
  try {
    const method = await copyText(publicLink.value);
    $q.notify({
      message: method === 'manual'
        ? 'เบราว์เซอร์บล็อกการคัดลอกอัตโนมัติ กรุณาคัดลอกจากหน้าต่างที่เปิดขึ้นมา'
        : 'คัดลอกลิงก์สำเร็จ',
      color: method === 'manual' ? 'warning' : 'positive',
      position: 'top',
      timeout: 2000,
    });
  } catch {
    $q.notify({ message: 'ไม่สามารถคัดลอกลิงก์ได้', color: 'negative', position: 'top' });
  }
}
</script>
