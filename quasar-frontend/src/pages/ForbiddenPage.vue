<template>
  <StatusPageView
    code="403"
    tone="danger"
    icon="gpp_bad"
    title="ไม่มีสิทธิ์เข้าถึง"
    message="คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้ หากต้องการเข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ"
    note="ถ้าคุณเชื่อว่านี่ไม่ถูกต้อง ให้ตรวจสอบสิทธิ์ของบัญชีหรือกลับไปหน้าหลัก"
    primary-label="กลับหน้าหลัก"
    primary-to="/"
  />
</template>

<script setup lang="ts">
import StatusPageView from '../components/status/StatusPageView.vue';
</script>
