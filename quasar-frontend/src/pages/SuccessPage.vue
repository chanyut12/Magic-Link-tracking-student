<template>
  <q-page class="success-page">
    <div class="success-content">
      <div class="success-icon">
        <i class="fas fa-check-circle"></i>
      </div>
      <h1>บันทึกสำเร็จ!</h1>
      <p class="success-message">ขอบคุณสำหรับการรายงานข้อมูลการลงพื้นที่</p>
      <p class="info-text">ลิงก์นี้หมดอายุแล้ว สามารถปิดหน้านี้ได้</p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.success-page {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-content {
  text-align: center;
  color: white;
  padding: 2rem;
}

.success-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

h1 {
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 1rem;
}

.success-message {
  font-size: 1.1rem;
  opacity: 0.95;
  margin-bottom: 2rem;
}

.info-text {
  font-size: 0.9rem;
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 99px;
  display: inline-block;
}
</style>
