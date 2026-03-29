<template>
  <div class="row q-col-gutter-md q-mb-md">
    <div class="col-6 col-md-3">
      <DashboardMetricCard
        label="เคสทั้งหมด"
        :value="stats.total"
        subtitle="รายการในระบบ"
        icon="fa-solid fa-layer-group"
        tone="sky"
      />
    </div>
    <div class="col-6 col-md-3">
      <DashboardMetricCard
        label="กำลังติดตาม"
        :value="stats.inProgress"
        subtitle="อยู่ระหว่างดำเนินการ"
        icon="fa-solid fa-hourglass-half"
        tone="amber"
      />
    </div>
    <div class="col-6 col-md-3">
      <DashboardMetricCard
        label="ปิดเคสสำเร็จ"
        :value="stats.resolved"
        subtitle="พร้อมสรุปผล"
        icon="fa-solid fa-circle-check"
        tone="emerald"
      />
    </div>
    <div class="col-6 col-md-3">
      <DashboardMetricCard
        label="เคสวันนี้"
        :value="stats.today"
        subtitle="สร้างล่าสุดวันนี้"
        icon="fa-solid fa-calendar-day"
        tone="slate"
      />
    </div>
    <div class="col-6 col-md-3">
      <DashboardMetricCard
        label="รอสร้างลิงค์"
        :value="stats.open"
        subtitle="รอการสร้างลิงค์"
        icon="fa-solid fa-link"
        tone="rose"
      />
    </div>
    <div class="col-6 col-md-3">
      <DashboardMetricCard
        label="รอผอ.ประเมิน"
        :value="stats.pendingReview"
        subtitle="รอการประเมินผล"
        icon="fa-solid fa-user-clock"
        tone="cyan"
      />
    </div>
    <div class="col-6 col-md-3">
      <DashboardMetricCard
        label="ลิงก์ที่ใช้งานอยู่"
        :value="stats.activeLinks"
        subtitle="ลิงก์ที่ยังไม่หมดอายุ"
        icon="fa-solid fa-arrow-up-right-from-square"
        tone="sky"
      />
    </div>
    <div class="col-6 col-md-3">
      <DashboardMetricCard
        label="ส่งต่อแล้วทั้งหมด"
        :value="stats.delegations"
        subtitle="เคสที่ส่งต่อหน่วยงาน"
        icon="fa-solid fa-share-nodes"
        tone="slate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CaseDashboardStats } from '../../types/case';
import DashboardMetricCard from './DashboardMetricCard.vue';

defineProps<{
  stats: CaseDashboardStats;
}>();
</script>

