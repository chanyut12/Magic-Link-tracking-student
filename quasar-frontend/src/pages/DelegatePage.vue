<template>
  <q-page class="delegate-page">
    <div v-if="loading" style="padding: 4rem 0; text-align: center;">
      <q-spinner color="primary" size="3rem" />
      <p class="q-mt-md text-gray-500">กำลังโหลดข้อมูล...</p>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="guest-header">
        <h1>มอบหมายภารกิจให้ผู้อื่น</h1>
        <div class="subtitle">กรอกข้อมูลผู้รับงานคนใหม่</div>
      </div>

      <div class="container q-pa-lg">
        <!-- Form Section -->
        <div v-if="!showResult" class="form-section">
          <div class="card q-mb-lg">
            <div class="form-group">
              <label>ชื่อผู้รับงานคนใหม่ *</label>
              <q-input
                v-model="form.new_assignee_name"
                outlined
                placeholder="เช่น อสม. สมหญิง"
                class="q-mb-md"
              />
            </div>
            <div class="form-group">
              <label>เบอร์โทรศัพท์</label>
              <q-input
                v-model="form.new_assignee_phone"
                outlined
                placeholder="เช่น 089-876-5432"
                class="q-mb-md"
              />
            </div>
            <div class="form-group">
              <label>อายุลิงก์ใหม่</label>
              <div class="expiry-row">
                <q-input
                  v-model.number="form.expires_value"
                  type="number"
                  outlined
                  min="1"
                  max="90"
                  class="expiry-input"
                />
                <q-select
                  v-model="form.expires_unit"
                  :options="expiryOptions"
                  outlined
                  class="expiry-select"
                />
              </div>
            </div>
          </div>

          <q-btn
            unelevated
            color="warning"
            label="🔄 ส่งต่อภารกิจ"
            class="full-width q-py-md"
            :loading="submitting"
            @click="submitDelegation"
          />
          <q-btn
            flat
            color="grey"
            label="ย้อนกลับ"
            class="full-width q-mt-md"
            @click="goBack"
          />
        </div>

        <!-- Result Section -->
        <div v-else-if="result" class="result-section">
          <div class="card">
            <div class="alert alert-success q-mb-md">ส่งต่อภารกิจสำเร็จ!</div>
            <p class="hint-text q-mb-md">กรุณาส่งลิงก์ด้านล่างให้ผู้รับงานคนใหม่</p>
            
            <div class="card-title">Magic Link ใหม่</div>
            <div class="magic-link-box">{{ result.magic_link }}</div>
            
            <q-btn
              outline
              color="primary"
              :label="copied ? '✅ คัดลอกแล้ว!' : '📋 คัดลอกลิงก์'"
              class="full-width q-mt-md"
              @click="copyLink"
            />
            <q-btn
              outline
              color="green"
              label="💬 ส่งลิงก์ผ่าน LINE"
              class="full-width q-mt-md"
              :href="lineShareUrl"
              target="_blank"
            />
          </div>
          
          <div v-if="result.qr_code_data" class="card q-mt-md">
            <div class="card-title">QR Code</div>
            <img :src="result.qr_code_data" alt="QR Code" class="qr-image" />
          </div>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const token = route.params.token as string;

const loading = ref(true);
const submitting = ref(false);
const showResult = ref(false);
const copied = ref(false);

const form = reactive({
  new_assignee_name: '',
  new_assignee_phone: '',
  expires_value: 1,
  expires_unit: 'days'
});

const result = ref<{
  magic_link: string;
  qr_code_data: string | null;
  expires_at: string;
  delegation_depth: number;
} | null>(null);

const expiryOptions = [
  { label: 'ชั่วโมง', value: 'hours' },
  { label: 'วัน', value: 'days' },
  { label: 'สัปดาห์', value: 'weeks' }
];

const lineShareUrl = computed(() => {
  if (!result.value?.magic_link) return '#';
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(result.value.magic_link)}`;
});

const computeExpiryHours = () => {
  const val = form.expires_value || 1;
  const unit = form.expires_unit;
  if (unit === 'days') return val * 24;
  if (unit === 'weeks') return val * 168;
  return val;
};

const fetchData = async () => {
  try {
    const res = await api.get(`/api/tasks/${token}`);
    // Task data loaded, can be used for validation if needed
    console.log('Task loaded:', res.data);
  } catch (err) {
    console.error(err);
    $q.notify({ message: 'ไม่สามารถโหลดข้อมูลภารกิจได้', color: 'negative' });
    void router.push(`/task/${token}`);
  } finally {
    loading.value = false;
  }
};

const submitDelegation = async () => {
  if (!form.new_assignee_name.trim()) {
    $q.notify({ message: 'กรุณากรอกชื่อผู้รับงานคนใหม่', color: 'warning' });
    return;
  }

  submitting.value = true;
  try {
    const res = await api.post(`/api/tasks/${token}/delegate`, {
      new_assignee_name: form.new_assignee_name.trim(),
      new_assignee_phone: form.new_assignee_phone.trim() || null,
      expires_in_hours: computeExpiryHours()
    });
    
    result.value = res.data;
    showResult.value = true;
    $q.notify({ message: 'ส่งต่อภารกิจสำเร็จ!', color: 'positive' });
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } };
    $q.notify({ 
      message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งต่อ', 
      color: 'negative' 
    });
  } finally {
    submitting.value = false;
  }
};

const copyLink = async () => {
  if (!result.value?.magic_link) return;
  
  try {
    await navigator.clipboard.writeText(result.value.magic_link);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
    $q.notify({ message: 'คัดลอกลิงก์แล้ว!', color: 'positive' });
  } catch {
    $q.notify({ message: 'ไม่สามารถคัดลอกได้', color: 'negative' });
  }
};

const goBack = () => {
  void router.push(`/task/${token}`);
};

onMounted(() => {
  void fetchData();
});
</script>

<style lang="scss" scoped>
.delegate-page {
  background-color: #f4f7fe;
  min-height: 100vh;
}

.guest-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 3rem 1.5rem;
  text-align: center;
  border-bottom-left-radius: 40px;
  border-bottom-right-radius: 40px;
  box-shadow: 0 10px 30px rgba(245, 158, 11, 0.2);
  
  h1 { font-size: 1.5rem; font-weight: 900; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
  .subtitle { opacity: 0.9; font-size: 1rem; font-weight: 600; }
}

.container {
  max-width: 600px;
  margin: 1.5rem auto 0;
}

.card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
}

.card-title {
  font-size: 1rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
  
  label {
    display: block;
    font-size: 0.85rem;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.expiry-row {
  display: flex;
  gap: 0.5rem;
  
  .expiry-input {
    flex: 1;
  }
  
  .expiry-select {
    flex: 1;
  }
}

.alert {
  padding: 1rem;
  border-radius: 12px;
  font-weight: 700;
  text-align: center;
  
  &.alert-success {
    background: #dcfce7;
    color: #15803d;
  }
}

.hint-text {
  color: #64748b;
  font-size: 0.9rem;
  text-align: center;
}

.magic-link-box {
  background: #f1f5f9;
  padding: 1rem;
  border-radius: 12px;
  font-family: monospace;
  font-size: 0.85rem;
  word-break: break-all;
  color: #1e293b;
  border: 1px solid #e2e8f0;
}

.qr-image {
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  display: block;
  border-radius: 12px;
}

.full-width {
  width: 100%;
}

@media (max-width: 480px) {
  .guest-header { padding: 2rem 1rem; }
  .card { padding: 1rem; }
}
</style>
