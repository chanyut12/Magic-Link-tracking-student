<template>
  <q-page class="expired-page">
    <div class="expired-content">
      <div class="expired-icon">
        <i class="fas fa-clock"></i>
      </div>
      <h1>ลิงก์หมดอายุแล้ว</h1>
      <p class="expired-message">ลิงก์นี้ไม่สามารถใช้งานได้อีกต่อไป</p>
      <p class="info-text">กรุณาติดต่อผู้ที่ส่งลิงก์ให้คุณเพื่อขอลิงก์ใหม่</p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.expired-page {
  background: linear-gradient(135deg, #dc2626 0%, #f87171 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expired-content {
  text-align: center;
  color: white;
  padding: 2rem;
}

.expired-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

h1 {
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 1rem;
}

.expired-message {
  font-size: 1.1rem;
  opacity: 0.95;
  margin-bottom: 1rem;
}

.info-text {
  font-size: 0.9rem;
  opacity: 0.85;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 99px;
  display: inline-block;
}
</style>
