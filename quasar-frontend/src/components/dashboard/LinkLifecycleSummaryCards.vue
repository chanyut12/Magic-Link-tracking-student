<template>
  <div class="row q-col-gutter-md q-mb-md">
    <div class="col-6 col-md-3">
      <DashboardMetricCard
        label="ลิงก์ทั้งหมด"
        :value="stats.total"
        subtitle="ลิงก์ในระบบ"
        icon="fa-solid fa-link"
        tone="sky"
      />
    </div>
    <div class="col-6 col-md-3">
      <DashboardMetricCard
        label="ใช้งานอยู่"
        :value="stats.active"
        subtitle="พร้อมใช้งาน"
        icon="fa-solid fa-bolt"
        tone="cyan"
      />
    </div>
    <div class="col-6 col-md-3">
      <DashboardMetricCard
        label="ถูกล็อก"
        :value="stats.locked"
        subtitle="ถูกปิดโดยผู้ดูแล"
        icon="fa-solid fa-lock"
        tone="rose"
      />
    </div>
    <div class="col-6 col-md-3">
      <DashboardMetricCard
        label="หมดอายุ"
        :value="stats.expired"
        :subtitle="expiredSubtitle"
        icon="fa-solid fa-hourglass-end"
        tone="slate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardMetricCard from './DashboardMetricCard.vue';

interface LinkLifecycleStats {
  total: number;
  active: number;
  locked: number;
  expired: number;
}

withDefaults(defineProps<{
  stats: LinkLifecycleStats;
  expiredSubtitle?: string;
}>(), {
  expiredSubtitle: 'ต้องสร้างลิงก์ใหม่',
});
</script>
