<template>
  <StatusPageView
    tone="info"
    icon="lock"
    title="ลิงก์ถูกปิดการใช้งาน"
    message="ลิงก์นี้ถูกปิดโดยผู้ดูแลระบบ ไม่สามารถเข้าใช้งานได้ในขณะนี้"
    note="กรุณาติดต่อผู้ส่งลิงก์เพื่อสอบถามข้อมูลเพิ่มเติม"
  >
    <template v-if="reason" #meta>
      <div class="locked-reason">
        <q-icon name="info" size="sm" />
        <span><strong>เหตุผล:</strong> {{ reason }}</span>
      </div>
    </template>
  </StatusPageView>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import StatusPageView from '../components/status/StatusPageView.vue';

const route = useRoute();
const reason = route.query.reason as string | undefined;
</script>

<style lang="scss" scoped>
.locked-reason {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(219, 234, 254, 0.78);
  color: #1e3a8a;
  border: 1px solid rgba(59, 130, 246, 0.18);
  line-height: 1.6;
  text-align: left;
}
</style>
