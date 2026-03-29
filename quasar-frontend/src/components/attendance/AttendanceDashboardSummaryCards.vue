<template>
  <LinkLifecycleSummaryCards :stats="stats" />
</template>

<script setup lang="ts">
import LinkLifecycleSummaryCards from '../dashboard/LinkLifecycleSummaryCards.vue';
import type { AttendanceTaskCardStats } from '../../types/attendance';

defineProps<{
  stats: AttendanceTaskCardStats;
}>();
</script>
