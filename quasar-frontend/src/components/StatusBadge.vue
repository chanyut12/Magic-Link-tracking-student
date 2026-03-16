<template>
  <span class="status-badge" :class="badgeClass">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string;
}>();

const badgeClass = computed(() => {
  const map: Record<string, string> = {
    PENDING: 'badge-pending',
    IN_PROGRESS: 'badge-progress',
    PENDING_REVIEW: 'badge-progress',
    RESOLVED: 'badge-resolved',
    COMPLETED: 'badge-completed',
    ACTIVE: 'badge-active',
    DELEGATED: 'badge-delegated',
    EXPIRED: 'badge-expired',
    DONE: 'badge-resolved',
  };
  return map[props.status] || 'badge-pending';
});

const label = computed(() => {
  const labels: Record<string, string> = {
    PENDING: 'รอดำเนินการ',
    IN_PROGRESS: 'กำลังดำเนินการ',
    PENDING_REVIEW: 'รอผอ.ประเมิน',
    RESOLVED: 'ปิดเคสแล้ว',
    COMPLETED: 'เสร็จสิ้น',
    ACTIVE: 'ใช้งานได้',
    DELEGATED: 'ส่งต่อแล้ว',
    EXPIRED: 'หมดอายุ',
    DONE: 'เสร็จสิ้น',
  };
  return labels[props.status] || props.status;
});
</script>

<style lang="scss" scoped>
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-pending { background: #f1f5f9; color: #64748b; }
.badge-progress { background: #dbeafe; color: #1d4ed8; }
.badge-resolved, .badge-completed { background: #d1fae5; color: #065f46; }
.badge-active { background: #fef3c7; color: #92400e; }
.badge-delegated { background: #fce7f3; color: #9d174d; }
.badge-expired { background: #fee2e2; color: #991b1b; }
</style>
