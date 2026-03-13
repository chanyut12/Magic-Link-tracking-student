<template>
  <q-page class="q-pa-lg">
    <div style="max-width: 800px; margin: 0 auto;">
      
      <!-- Back Button & Title -->
      <div class="row items-center justify-between q-mb-xl">
        <div>
          <h1 class="text-h4 text-weight-bolder text-gray-900 q-mb-xs">{{ pageTitle }}</h1>
          <div class="text-gray-500 font-weight-bold">เลือกประเภทและกรอกข้อมูลให้ครบถ้วน</div>
        </div>
        <q-btn flat class="btn-back-home" to="/" no-caps>
          <i class="fas fa-arrow-left q-mr-sm"></i> ย้อนกลับหน้าหลัก
        </q-btn>
      </div>

      <!-- Step Indicator -->
      <div class="step-indicator q-mb-xl" v-if="!showResult">
        <div class="step" :class="{ active: currentStep === 1 }">
          <span class="step-num">1</span> เลือกประเภท
        </div>
        <div class="step" :class="{ active: currentStep === 2 }">
          <span class="step-num">2</span> กรอกรายละเอียด
        </div>
      </div>

      <!-- Step 1: Type Selection -->
      <div v-if="currentStep === 1" class="type-selection">
        <div class="type-card" @click="selectType('VISIT')">
          <span class="type-icon">📍</span>
          <div class="type-title">ภารกิจลงพื้นที่</div>
          <div class="type-desc">สำหรับการส่งตัวแทนไปเยี่ยมบ้านนักเรียนที่ถูกระบุตัวเพื่อติดตามผล</div>
        </div>
        <div class="type-card" @click="selectType('ATTENDANCE')">
          <span class="type-icon">📋</span>
          <div class="type-title">ภารกิจเช็คชื่อ</div>
          <div class="type-desc">สำหรับการมอบหมายงานเช็คชื่อนักเรียนรายห้องให้กับครูประจำชั้นหรือตัวแทน</div>
        </div>
      </div>

      <!-- Step 2: Forms -->
      <div v-if="currentStep === 2 && !showResult">
        
        <!-- Visit Form -->
        <div v-if="formData.type === 'VISIT'" class="card q-mb-md">
          <div class="card-title">ข้อมูลนักเรียน (ลงพื้นที่)</div>
          <div class="form-group">
            <label>ชื่อ-สกุล นักเรียน *</label>
            <input type="text" v-model="formData.student_name" placeholder="เช่น ด.ช. สมชาย ดีใจ">
          </div>
          <div class="form-group">
            <label>โรงเรียน</label>
            <input type="text" v-model="formData.student_school" placeholder="เช่น โรงเรียนบ้านหนองไผ่">
          </div>
          <div class="form-group">
            <label>ที่อยู่</label>
            <textarea v-model="formData.student_address" placeholder="ที่อยู่บ้านนักเรียน"></textarea>
          </div>
          <div class="form-group">
            <label>สาเหตุที่ถูก Flag</label>
            <input type="text" v-model="formData.reason_flagged" placeholder="เช่น ขาดเรียนติดต่อกัน 5 วัน">
          </div>
        </div>

        <!-- Attendance Form -->
        <div v-if="formData.type === 'ATTENDANCE'" class="card q-mb-md">
          <div class="card-title">ข้อมูลชั้นเรียน</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="form-group">
                <label>ระดับชั้น *</label>
                <select v-model="formData.target_grade">
                  <option value="">-- เลือกชั้น --</option>
                  <option v-for="g in ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6']" :key="g" :value="g">{{ g }}</option>
                </select>
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="form-group">
                <label>ห้อง *</label>
                <select v-model="formData.target_room">
                  <option value="">-- เลือกห้อง --</option>
                  <option v-for="r in ['1', '2', '3', '4', '5', '6']" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="form-group q-mt-md">
            <label>วิชา *</label>
            <select v-model="formData.target_subject">
              <option value="">-- เลือกวิชา --</option>
              <option v-for="s in ['คณิตศาสตร์พื้นฐาน', 'ภาษาไทย', 'ภาษาอังกฤษ', 'วิทยาศาสตร์', 'สังคมศึกษา', 'พละศึกษา', 'ศิลปะ', 'การงานอาชีพ']" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <!-- Assignee Info -->
        <div class="card q-mb-lg">
          <div class="card-title">ผู้รับภารกิจ</div>
          <div class="form-group">
            <label>ชื่อผู้รับงาน *</label>
            <input type="text" v-model="formData.assigned_to_name" placeholder="เช่น อาจารย์สมเกียรติ">
          </div>
          <div class="form-group">
            <label>อีเมลผู้รับงาน (สำหรับรับรหัส OTP) *</label>
            <input type="email" v-model="formData.assigned_to_email" placeholder="เช่น teacher@school.ac.th">
          </div>
          <div class="form-group">
            <label>อายุลิงก์</label>
            <div class="expiry-row">
              <input type="number" v-model="formData.expires_value" min="1" max="90">
              <select v-model="formData.expires_unit">
                <option value="hours">ชั่วโมง</option>
                <option value="days">วัน</option>
                <option value="weeks">สัปดาห์</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="row q-col-gutter-md">
          <div class="col-4">
            <q-btn flat color="grey-7" label="ย้อนกลับ" class="full-width" @click="currentStep = 1" no-caps />
          </div>
          <div class="col-8">
            <q-btn color="primary" label="สร้างภารกิจ" class="full-width" unelevated padding="12px" :loading="loading" @click="submitForm" />
          </div>
        </div>
      </div>

      <!-- Result Section -->
      <div v-if="showResult" class="result-section">
        <div class="card q-pa-xl text-center">
          <div class="alert alert-success q-mb-lg">สร้างภารกิจสำเร็จ!</div>
          
          <div class="text-subtitle1 text-weight-bold text-gray-700 q-mb-sm">Magic Link</div>
          <div class="magic-link-box q-mb-md">{{ resultLink }}</div>
          
          <q-btn outline color="primary" label="📋 คัดลอกลิงก์" class="full-width q-mb-md" @click="copyLink" />
          
          <q-btn 
            unelevated 
            style="background: #06C755; color: white;" 
            label="💬 ส่งลิงก์ผ่าน LINE" 
            class="full-width" 
            :href="getLineUrl(resultLink)"
            target="_blank"
          />
        </div>

        <div class="card q-pa-xl text-center">
          <div class="text-subtitle1 text-weight-bold text-gray-700 q-mb-md">QR Code</div>
          <img :src="qrCodeUrl" alt="QR Code" style="max-width: 200px; margin: 0 auto; display: block;" />
          <p class="text-caption text-gray-500 q-mt-md">สแกนเพื่อเข้าถึงภารกิจ</p>
        </div>

        <q-btn flat color="grey-7" label="กลับหน้าหลัก" class="full-width q-mt-lg" to="/" />
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const currentStep = ref(1);
const loading = ref(false);
const showResult = ref(false);
const resultLink = ref('');
const qrCodeUrl = ref('');

const formData = reactive({
  type: '',
  student_name: '',
  student_school: '',
  student_address: '',
  reason_flagged: '',
  target_grade: '',
  target_room: '',
  target_subject: '',
  assigned_to_name: '',
  assigned_to_email: '',
  expires_value: 1,
  expires_unit: 'days'
});

const pageTitle = computed(() => {
  if (currentStep.value === 1) return 'สร้างภารกิจ';
  return formData.type === 'VISIT' ? 'สร้างภารกิจลงพื้นที่' : 'สร้างภารกิจเช็คชื่อ';
});

const selectType = (type: string) => {
  formData.type = type;
  currentStep.value = 2;
};

const submitForm = async () => {
  // Simple validation
  if (!formData.assigned_to_email || !formData.assigned_to_name) {
    $q.notify({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน', color: 'negative' });
    return;
  }

  loading.value = true;
  try {
    const res = await api.post('/api/tasks', formData);
    resultLink.value = res.data.magic_link_full;
    qrCodeUrl.value = res.data.qr_code;
    showResult.value = true;
  } catch {
    $q.notify({ message: 'เกิดข้อผิดพลาดในการสร้างภารกิจ', color: 'negative' });
  } finally {
    loading.value = false;
  }
};

const copyLink = () => {
  void navigator.clipboard.writeText(resultLink.value).then(() => {
    $q.notify({ message: 'คัดลอกลิงก์สำเร็จ', color: 'positive', timeout: 2000 });
  });
};

const getLineUrl = (link: string) => {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}`;
};
</script>

<style lang="scss" scoped>
.btn-back-home {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-weight: 700;
  color: #64748b;
  padding: 8px 16px;
  
  &:hover {
    background: #f8fafc;
    color: #2563eb;
  }
}

.step-indicator {
  display: flex;
  justify-content: center;
  gap: 3rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #94a3b8;
  font-weight: 700;
  
  &.active {
    color: #2563eb;
    
    .step-num {
      background: #2563eb;
      color: white;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
    }
  }
}

.step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

/* Type Selection */
.type-selection {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.type-card {
  background: white;
  border: 2px solid #f1f5f9;
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: $shadow;
  
  &:hover {
    transform: translateY(-6px);
    border-color: #2563eb;
    box-shadow: $shadow-md;
  }
}

.type-icon { font-size: 3.5rem; margin-bottom: 1.5rem; display: block; }
.type-title { font-weight: 800; font-size: 1.4rem; margin-bottom: 0.75rem; color: #1e3a8a; }
.type-desc { color: #64748b; font-size: 0.95rem; line-height: 1.5; }

/* Forms */
.form-group {
    margin-bottom: 20px;
    
    label {
        display: block;
        font-size: 0.85rem;
        font-weight: 700;
        color: #64748b;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    input, select, textarea {
        width: 100%;
        padding: 12px 16px;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        font-size: 1rem;
        transition: all 0.2s;
        
        &:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
    }
    
    textarea { min-height: 100px; resize: vertical; }
}

.expiry-row {
    display: flex;
    gap: 10px;
    
    input { flex: 1; }
    select { width: 120px; }
}

.magic-link-box {
    background: #f1f5f9;
    padding: 16px;
    border: 1.5px dashed #cbd5e1;
    border-radius: 12px;
    word-break: break-all;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.85rem;
    color: #334155;
}

.alert {
    padding: 12px 16px;
    border-radius: 12px;
    font-weight: 700;
}

@media (max-width: 600px) {
    .type-selection { grid-template-columns: 1fr; }
    .step-indicator { gap: 1rem; }
    .step { font-size: 0.9rem; }
}
</style>
