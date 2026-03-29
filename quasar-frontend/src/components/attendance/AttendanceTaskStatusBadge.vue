<template>
  <span :class="badgeClass">{{ badgeLabel }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AttendanceTask } from '../../types/attendance';
import { getAttendanceTaskStatus } from '../../utils/attendancePresentation';

const props = defineProps<{
  task: AttendanceTask;
  prefix?: string;
}>();

const status = computed(() => getAttendanceTaskStatus(props.task));

const badgeClass = computed(() => {
  if (status.value === 'ACTIVE') return 'badge badge-active';
  if (status.value === 'LOCKED') return 'badge badge-expired';
  return 'badge badge-neutral';
});

const badgeLabel = computed(() => {
  const prefix = props.prefix ? `${props.prefix}: ` : '';

  if (status.value === 'ACTIVE') return `${prefix}ใช้งานอยู่`;
  if (status.value === 'LOCKED') return `${prefix}ถูกปิดโดยผู้ดูแล`;
  return `${prefix}หมดอายุ`;
});
</script>

<style lang="scss" scoped>
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.badge-active {
  background: #fef3c7;
  color: #92400e;
}

.badge-expired {
  background: #fee2e2;
  color: #991b1b;
}

.badge-neutral {
  background: #f3f4f6;
  color: #6b7280;
}
</style>
