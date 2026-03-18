<template>
  <q-page class="guest-page bg-grey-1">
    <!-- Header (Cloned from TaskGuestPage.vue) -->
    <div v-if="otpRequired || loading" class="guest-header">
      <h1>ลิงก์เข้าสู่ระบบ (Login Link)</h1>
      <div class="subtitle" v-if="assignedToName">
        ผู้ครอบครอง: {{ assignedToName }}
      </div>
      <div class="subtitle" v-else-if="emailToVerify">
        อีเมลสวมสิทธิ์: {{ emailToVerify }}
      </div>

      <div class="expiry-box" v-if="!isExpired && expiresAt">
        <i class="fas fa-clock"></i>
        <span>ลิงก์หมดอายุใน: {{ countdownText }}</span>
      </div>
      <div class="expiry-box expired" v-else-if="isExpired">
        <i class="fas fa-exclamation-circle"></i>
        <span>ลิงก์หมดอายุแล้ว</span>
      </div>
    </div>

    <div class="container q-pa-lg">
      <!-- Loading State -->
      <div v-if="loading && !otpRequired" style="padding: 4rem 0; text-align: center;">
        <q-spinner color="primary" size="3rem" />
        <p class="q-mt-md text-grey-6">กำลังยืนยันตัวตน...</p>
      </div>

      <!-- OTP Verification State -->
      <div v-else-if="otpRequired" class="otp-container">
        <div class="otp-icon"><i class="fas fa-shield-alt"></i></div>
        <div class="otp-title">ยืนยันตัวตน</div>
        <div class="otp-desc">
          {{ otpSent ? 'รหัส OTP ถูกส่งไปยังอีเมลของคุณแล้ว (โปรดตรวจสอบใน Log ระบบ)' : 'กรุณากดปุ่มด้านล่างเพื่อรับรหัส OTP ทางอีเมลที่ลงทะเบียนไว้' }}
          <div v-if="emailToVerify" class="text-weight-bold text-primary q-mt-xs" style="text-decoration: underline;">{{ emailToVerify }}</div>
        </div>

        <div v-if="!otpSent">
          <q-btn unelevated color="primary" label="รับรหัส OTP" class="full-width q-py-md" :loading="otpLoading" @click="sendOtp" />
        </div>

        <div v-else class="otp-input-group">
          <input type="text" v-model="otpInput" class="otp-input" maxlength="6" placeholder="000000" inputmode="numeric" />
          <q-btn unelevated color="primary" label="ตรวจสอบรหัส" class="full-width q-py-md" :loading="otpLoading" @click="verifyDirectOtp" :disabled="otpInput.length !== 6" />
          <div class="resend-link q-mt-md" @click="otpSent = false">ส่งรหัสอีกครั้ง</div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const token = route.params.token as string;

const loading = ref(true);
const otpRequired = ref(false);
const otpSent = ref(false);
const otpInput = ref('');
const otpLoading = ref(false);
const emailToVerify = ref('');
const assignedToName = ref('');
const expiresAt = ref<string | null>(null);

const countdownText = ref('--:--');
const isExpired = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const checkLoginStatus = async () => {
  loading.value = true;
  try {
    const savedToken = localStorage.getItem(`magic_session_${token}`);
    const res = await api.get(`/api/tasks/${token}/login-verify`, {
      headers: savedToken ? { 'x-magic-session': savedToken } : {}
    });
    if (res.data.otp_required) {
      otpRequired.value = true;
      emailToVerify.value = res.data.email || '';
      assignedToName.value = res.data.assigned_to_name || '';
      expiresAt.value = res.data.expires_at || null;
      if (res.data.expires_at) {
        startCountdown(res.data.expires_at);
      }
    } else if (res.data.id) {
      // Normal Login Flow (No OTP needed)
      sessionStorage.setItem('sts_user', JSON.stringify(res.data));
      sessionStorage.setItem('admin_access', 'true');
      $q.notify({ message: 'เข้าสู่ระบบสำเร็จ', color: 'positive', icon: 'check' });
      void router.push('/');
    }
  } catch (err) {
    console.error('Magic login error:', err);
    $q.notify({ message: 'ลิงก์เข้าสู่ระบบไม่ถูกต้องหรือหมดอายุ', color: 'negative', icon: 'error' });
    void router.push('/');
  } finally {
    loading.value = false;
  }
};

const sendOtp = async () => {
  otpLoading.value = true;
  try {
    await api.post(`/api/tasks/${token}/otp`);
    otpSent.value = true;
    $q.notify({ message: 'ส่งรหัส OTP เรียบร้อยแล้ว', color: 'positive', icon: 'check' });
  } catch (err) {
    console.error('Send OTP error:', err);
    $q.notify({ message: 'ไม่สามารถส่งรหัส OTP ได้', color: 'negative' });
  } finally {
    otpLoading.value = false;
  }
};

const verifyDirectOtp = async () => {
  if (otpInput.value.length !== 6) return;
  otpLoading.value = true;
  try {
    const res = await api.post(`/api/tasks/${token}/verify`, { otp: otpInput.value });
    if (res.data.session_token) {
      localStorage.setItem(`magic_session_${token}`, res.data.session_token);
    }
    $q.notify({ message: 'ยืนยันรหัสสำเร็จ', color: 'positive', icon: 'check' });
    // Retry login-verify to fetch virtual user payload
    await checkLoginStatus();
  } catch (err) {
    console.error('Verify OTP error:', err);
    $q.notify({ message: 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ', color: 'negative' });
  } finally {
    otpLoading.value = false;
  }
};

const startCountdown = (expiry: string) => {
  const expiryDate = new Date(expiry);
  const update = () => {
    const now = new Date().getTime();
    const diff = expiryDate.getTime() - now;
    if (diff <= 0) {
      isExpired.value = true;
      countdownText.value = 'หมดอายุแล้ว';
      if (timer) { clearInterval(timer); timer = null; }
      return;
    }
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    countdownText.value = `${h > 0 ? h + 'ชม. ' : ''}${m}นาที ${s}วินาที`;
  };
  update();
  if (timer) clearInterval(timer);
  timer = setInterval(update, 1000);
};

onMounted(() => {
  void checkLoginStatus();
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped lang="scss">
.guest-page {
  background-color: #f4f7fe;
  min-height: 100vh;
}

.guest-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  padding: 3rem 1.5rem;
  text-align: center;
  border-bottom-left-radius: 40px;
  border-bottom-right-radius: 40px;
  box-shadow: 0 10px 30px rgba(30, 64, 175, 0.2);
  position: relative;

  h1 { font-size: 1.5rem; font-weight: 900; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
  .subtitle { opacity: 0.9; font-size: 1rem; font-weight: 600; }
}

.expiry-box {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 10px 24px;
  border-radius: 99px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  color: #ef4444;
  font-weight: 800;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  border: 1.5px solid #fee2e2;

  &.expired { color: #94a3b8; border-color: #f1f5f9; }
}

.container {
  max-width: 600px;
  margin: 2.5rem auto 0;
}

.otp-container {
  background: white;
  padding: 2.5rem;
  border-radius: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.otp-icon { font-size: 3.5rem; color: #2563eb; margin-bottom: 1.5rem; }
.otp-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.75rem; }
.otp-desc { color: #64748b; font-size: 1rem; margin-bottom: 2.5rem; line-height: 1.6; }

.otp-input {
  width: 100%;
  padding: 1.25rem;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  font-size: 2rem;
  text-align: center;
  letter-spacing: 0.5rem;
  font-weight: 800;
  outline: none;
  margin-bottom: 1.5rem;
  transition: all 0.2s;

  &:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
}

.resend-link { color: #2563eb; font-weight: 700; cursor: pointer; text-decoration: underline; }
</style>
