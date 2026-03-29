<template>
  <StatusPageView
    tone="warning"
    icon="schedule"
    title="ลิงก์หมดอายุแล้ว"
    message="ลิงก์นี้ใช้งานไม่ได้อีกแล้ว เนื่องจากเกินระยะเวลาที่กำหนด"
    note="กรุณาติดต่อผู้ส่งลิงก์เพื่อขอรับลิงก์ใหม่"
  />
</template>

<script setup lang="ts">
import StatusPageView from '../components/status/StatusPageView.vue';
</script>
