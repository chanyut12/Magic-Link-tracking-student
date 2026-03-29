<template>
  <StatusPageView
    code="404"
    tone="neutral"
    icon="search_off"
    title="ไม่พบหน้านี้"
    message="หน้าที่คุณค้นหาอาจถูกลบ ย้าย หรือไม่พร้อมใช้งานในเส้นทางนี้แล้ว"
    note="ตรวจสอบลิงก์อีกครั้ง หรือกลับไปเริ่มต้นจากหน้าหลักของระบบ"
    primary-label="กลับหน้าหลัก"
    primary-to="/"
  />
</template>

<script setup lang="ts">
import StatusPageView from '../components/status/StatusPageView.vue';
</script>
