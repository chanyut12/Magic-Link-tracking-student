<template>
  <q-page class="locked-page">
    <div class="locked-content">
      <div class="locked-icon">
        <i class="fas fa-lock"></i>
      </div>
      <h1>ลิงก์ถูกปิดการใช้งาน</h1>
      <p class="locked-message">ลิงก์นี้ถูกปิดโดยผู้ดูแลระบบ ไม่สามารถเข้าใช้งานได้ในขณะนี้</p>
      <p v-if="reason" class="reason-box">
        <i class="fas fa-info-circle"></i> เหตุผล: {{ reason }}
      </p>
      <p class="info-text">กรุณาติดต่อผู้ส่งลิงก์เพื่อสอบถามข้อมูลเพิ่มเติม</p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const reason = route.query.reason as string | undefined;
</script>

<style lang="scss" scoped>
.locked-page {
  background: linear-gradient(135deg, #1e40af 0%, #60a5fa 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.locked-content {
  text-align: center;
  color: white;
  padding: 2rem;
}

.locked-icon {
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

.locked-message {
  font-size: 1.1rem;
  opacity: 0.95;
  margin-bottom: 1rem;
}

.reason-box {
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  display: inline-block;
  margin-bottom: 1rem;
}

.info-text {
  font-size: 0.9rem;
  opacity: 0.85;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.75rem 1.5rem;
  border-radius: 99px;
  display: inline-block;
}
</style>
