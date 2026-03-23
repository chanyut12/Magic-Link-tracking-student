<template>
  <q-page class="flex flex-center forbidden-page">
    <div class="text-center">
      <div class="error-code">403</div>
      <div class="error-icon">
        <i class="fas fa-lock"></i>
      </div>
      <h1 class="error-title">ไม่มีสิทธิ์เข้าถึง</h1>
      <p class="error-message">คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้ หากต้องการเข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ</p>
      <q-btn 
        color="primary" 
        label="กลับหน้าหลัก" 
        to="/" 
        unelevated 
        class="back-btn"
        no-caps
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.forbidden-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.error-code {
  font-size: 8rem;
  font-weight: 900;
  color: #dc2626;
  opacity: 0.15;
  line-height: 1;
  margin-bottom: -3rem;
}

.error-icon {
  font-size: 4rem;
  color: #dc2626;
  margin-bottom: 1.5rem;
}

.error-title {
  font-size: 2rem;
  font-weight: 800;
  color: #991b1b;
  margin: 0 0 1rem;
}

.error-message {
  font-size: 1.1rem;
  color: #6b7280;
  max-width: 400px;
  margin: 0 auto 2rem;
  line-height: 1.6;
}

.back-btn {
  border-radius: 99px;
  padding: 0.75rem 2rem;
  font-weight: 700;
}
</style>
