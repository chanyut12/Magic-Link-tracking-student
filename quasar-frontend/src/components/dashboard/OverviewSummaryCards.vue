<template>
  <div class="row q-col-gutter-lg q-mb-lg">
    <div class="col-12 col-md-4">
      <DashboardMetricCard
        label="เด็กทั้งหมด"
        :value="overviewData.totalStudents"
        subtitle="นักเรียนในระบบ"
        icon="fas fa-users"
        tone="emerald"
        size="hero"
      />
    </div>
    <div class="col-12 col-md-4">
      <DashboardMetricCard
        label="เด็กเสี่ยง"
        :value="overviewData.atRiskStudents"
        subtitle="ต้องติดตามเพิ่มเติม"
        icon="fas fa-meh"
        tone="amber"
        size="hero"
      />
    </div>
    <div class="col-12 col-md-4">
      <DashboardMetricCard
        label="เด็กหลุด"
        :value="overviewData.dropoutStudents"
        subtitle="หลุดจากระบบการศึกษา"
        icon="fas fa-person-running"
        tone="rose"
        size="hero"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OverviewStatsData } from '../../types/stats';
import DashboardMetricCard from './DashboardMetricCard.vue';

defineProps<{
  overviewData: OverviewStatsData;
}>();
</script>

