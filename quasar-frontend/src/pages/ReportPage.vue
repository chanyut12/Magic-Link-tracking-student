<template>
  <q-page class="report-page">
    <div class="report-header">
      <q-btn flat round icon="arrow_back" color="white" :to="`/task/${token}`" class="back-btn" />
      <h1>รายงานการลงพื้นที่</h1>
      <div class="subtitle">กรอกข้อมูลและอัปโหลดรูปภาพ</div>
    </div>

    <div class="container q-pa-lg">
      <!-- GPS Status -->
      <div class="card q-mb-md">
        <div class="gps-status" :class="gpsStatus">
          <i class="fas fa-map-marker-alt"></i>
          <span>{{ gpsText }}</span>
        </div>
        <q-btn 
          v-if="gpsStatus !== 'ok'" 
          flat 
          color="primary" 
          label="ลองดึง GPS อีกครั้ง" 
          @click="fetchGPS" 
          class="q-mt-sm"
        />
      </div>

      <!-- Form -->
      <div class="card q-mb-md">
        <div class="card-title">ข้อมูลการลงพื้นที่</div>
        
        <div class="form-group">
          <label>ประเภทสาเหตุ <span class="required">*</span></label>
          <select v-model="form.cause_category" class="form-select">
            <option value="">-- เลือกประเภท --</option>
            <option value="ECONOMIC">ปัญหาทางเศรษฐกิจ</option>
            <option value="FAMILY">ปัญหาครอบครัว</option>
            <option value="HEALTH">ปัญหาสุขภาพ</option>
            <option value="MIGRATION">ย้ายถิ่นฐาน</option>
            <option value="DISABILITY">ความพิการ</option>
            <option value="BEHAVIOR">ปัญหาพฤติกรรม</option>
            <option value="OTHER">อื่นๆ</option>
          </select>
        </div>

        <div class="form-group">
          <label>รายละเอียด</label>
          <textarea v-model="form.cause_detail" placeholder="อธิบายรายละเอียดที่พบจากการลงพื้นที่..." rows="4"></textarea>
        </div>

        <div class="form-group">
          <label>ข้อเสนอแนะ</label>
          <textarea v-model="form.recommendation" placeholder="ข้อเสนอแนะในการช่วยเหลือ..." rows="3"></textarea>
        </div>
      </div>

      <!-- Address Update (UC18 included in UC17) -->
      <div class="card q-mb-md">
        <div class="card-title">แก้ไขที่อยู่ปัจจุบัน (ถ้าจำเป็น)</div>
        <q-toggle
          v-model="addressUpdate.enabled"
          label="ที่อยู่ในระบบไม่ตรงกับหน้างาน"
          color="orange"
        />

        <template v-if="addressUpdate.enabled">
          <div class="address-current q-mt-sm">
            <span class="text-weight-bold">ที่อยู่เดิม:</span>
            <span>{{ currentStudentAddress || '-' }}</span>
          </div>

          <div class="form-group q-mt-md">
            <label>ที่อยู่ปัจจุบัน <span class="required">*</span></label>
            <textarea
              v-model="addressUpdate.updated_student_address"
              placeholder="กรอกที่อยู่ปัจจุบันที่ตรวจพบจากการลงพื้นที่"
              rows="3"
            />
          </div>

          <q-btn
            outline
            color="primary"
            icon="my_location"
            label="ใช้พิกัดปัจจุบันเป็นพิกัดบ้าน"
            @click="useCurrentGpsForAddress"
          />

          <div class="coord-grid q-mt-md">
            <q-input
              v-model="addressUpdate.updated_lat"
              type="number"
              step="any"
              outlined
              dense
              label="ละติจูดใหม่ *"
            />
            <q-input
              v-model="addressUpdate.updated_lng"
              type="number"
              step="any"
              outlined
              dense
              label="ลองจิจูดใหม่ *"
            />
          </div>
        </template>
      </div>

      <!-- Photo Upload -->
      <div class="card q-mb-md">
        <div class="card-title">รูปภาพ (สูงสุด 5 รูป)</div>
        
        <div class="photo-upload">
          <input 
            ref="fileInput"
            type="file" 
            accept="image/*" 
            multiple 
            @change="handleFileChange"
            class="hidden-input"
          />
          <q-btn 
            outline 
            color="primary" 
            icon="camera_alt" 
            :label="photos.length >= 5 ? 'ถ่ายรูปเต็มแล้ว' : 'ถ่ายรูป / เลือกรูป'"
            @click="triggerFileInput"
            :disable="photos.length >= 5"
          />
        </div>

        <div class="photo-preview" v-if="photos.length > 0">
          <div v-for="(photo, index) in photos" :key="index" class="photo-item">
            <img :src="photo.preview" />
            <q-btn 
              round 
              dense 
              color="negative" 
              icon="close" 
              size="sm" 
              class="remove-btn"
              @click="removePhoto(index)"
            />
          </div>
        </div>
      </div>

      <!-- Submit -->
      <q-btn 
        unelevated 
        color="positive" 
        label="บันทึกและส่งรายงาน" 
        icon="check"
        class="full-width q-py-md submit-btn"
        :loading="submitting"
        :disable="!form.cause_category"
        @click="submitReport"
      />

      <p class="text-center text-gray-500 q-mt-md">
        กดปุ่มด้านบนเพื่อบันทึกข้อมูลการลงพื้นที่
      </p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const token = route.params.token as string;

const fileInput = ref<HTMLInputElement | null>(null);
const submitting = ref(false);
const currentStudentAddress = ref('');

const form = reactive({
  cause_category: '',
  cause_detail: '',
  recommendation: '',
});

const addressUpdate = reactive({
  enabled: false,
  updated_student_address: '',
  updated_lat: '',
  updated_lng: '',
});

const photos = ref<Array<{ file: File; preview: string }>>([]);

const gpsStatus = ref<'pending' | 'ok' | 'error'>('pending');
const gpsText = ref('กำลังดึงตำแหน่ง GPS...');
const gpsCoords = ref<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });

const fetchGPS = () => {
  gpsStatus.value = 'pending';
  gpsText.value = 'กำลังดึงตำแหน่ง GPS...';

  if (!navigator.geolocation) {
    gpsStatus.value = 'error';
    gpsText.value = 'อุปกรณ์ไม่รองรับ GPS (สามารถส่งรายงานได้โดยไม่มี GPS)';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      gpsCoords.value.lat = pos.coords.latitude;
      gpsCoords.value.lng = pos.coords.longitude;
      gpsStatus.value = 'ok';
      gpsText.value = `GPS: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
    },
    () => {
      gpsStatus.value = 'error';
      gpsText.value = 'ไม่สามารถดึงตำแหน่ง GPS (สามารถส่งรายงานได้โดยไม่มี GPS)';
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
};

const loadTaskContext = async () => {
  try {
    const response = await fetch(`/api/tasks/${token}`);
    if (!response.ok) return;

    const data = (await response.json()) as { student_address?: string };
    currentStudentAddress.value = data.student_address ?? '';
    if (currentStudentAddress.value && !addressUpdate.updated_student_address) {
      addressUpdate.updated_student_address = currentStudentAddress.value;
    }
  } catch (err) {
    console.error('Failed to load task context:', err);
  }
};

const useCurrentGpsForAddress = () => {
  if (gpsCoords.value.lat == null || gpsCoords.value.lng == null) {
    $q.notify({
      message: 'ยังไม่มีพิกัด GPS กรุณากดดึง GPS ก่อน',
      color: 'warning',
    });
    return;
  }

  addressUpdate.updated_lat = gpsCoords.value.lat.toFixed(6);
  addressUpdate.updated_lng = gpsCoords.value.lng.toFixed(6);
};

const parseCoordinate = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files) return;

  const remaining = 5 - photos.value.length;
  const toAdd = Array.from(files).slice(0, remaining);

  for (const file of toAdd) {
    const preview = URL.createObjectURL(file);
    photos.value.push({ file, preview });
  }

  target.value = '';
};

const removePhoto = (index: number) => {
  const photo = photos.value[index];
  if (photo) {
    URL.revokeObjectURL(photo.preview);
    photos.value.splice(index, 1);
  }
};

const submitReport = async () => {
  if (!form.cause_category) {
    $q.notify({ message: 'กรุณาเลือกประเภทสาเหตุ', color: 'warning' });
    return;
  }

  if (addressUpdate.enabled && !addressUpdate.updated_student_address.trim()) {
    $q.notify({ message: 'กรุณากรอกที่อยู่ปัจจุบัน', color: 'warning' });
    return;
  }

  const manualLat = parseCoordinate(addressUpdate.updated_lat);
  const manualLng = parseCoordinate(addressUpdate.updated_lng);
  if ((manualLat == null) !== (manualLng == null)) {
    $q.notify({
      message: 'กรุณากรอกพิกัดละติจูดและลองจิจูดให้ครบทั้งคู่',
      color: 'warning',
    });
    return;
  }

  let updatedLat = manualLat;
  let updatedLng = manualLng;
  if (
    addressUpdate.enabled &&
    (updatedLat == null || updatedLng == null) &&
    gpsCoords.value.lat != null &&
    gpsCoords.value.lng != null
  ) {
    updatedLat = gpsCoords.value.lat;
    updatedLng = gpsCoords.value.lng;
  }

  if (addressUpdate.enabled && (updatedLat == null || updatedLng == null)) {
    $q.notify({
      message: 'กรุณาระบุพิกัดบ้านใหม่ (GPS หรือกรอกเอง)',
      color: 'warning',
    });
    return;
  }

  submitting.value = true;

  try {
    const formData = new FormData();
    formData.append('cause_category', form.cause_category);
    formData.append('cause_detail', form.cause_detail);
    formData.append('recommendation', form.recommendation);
    
    if (gpsCoords.value.lat != null) formData.append('visit_lat', gpsCoords.value.lat.toString());
    if (gpsCoords.value.lng != null) formData.append('visit_lng', gpsCoords.value.lng.toString());

    if (addressUpdate.enabled) {
      formData.append('address_changed', 'true');
      formData.append(
        'updated_student_address',
        addressUpdate.updated_student_address.trim(),
      );
      formData.append('updated_lat', String(updatedLat));
      formData.append('updated_lng', String(updatedLng));
    } else {
      formData.append('address_changed', 'false');
    }

    photos.value.forEach((p) => {
      formData.append('photos', p.file);
    });

    const response = await fetch(`/api/tasks/${token}/submit`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      $q.notify({ message: 'บันทึกรายงานสำเร็จ', color: 'positive' });
      void router.push(`/task/${token}/success`);
    } else {
      $q.notify({ message: data.error || 'เกิดข้อผิดพลาด', color: 'negative' });
    }
  } catch (err) {
    console.error('Submit error:', err);
    $q.notify({ message: 'เกิดข้อผิดพลาดในการส่งรายงาน', color: 'negative' });
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchGPS();
  void loadTaskContext();
});
</script>

<style lang="scss" scoped>
.report-page {
  background-color: #f4f7fe;
  min-height: 100vh;
}

.report-header {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  padding: 2rem 1.5rem 3rem;
  text-align: center;
  position: relative;

  .back-btn {
    position: absolute;
    left: 8px;
    top: 12px;
  }

  h1 { font-size: 1.5rem; font-weight: 900; margin: 0 0 0.5rem; }
  .subtitle { opacity: 0.9; font-size: 0.95rem; }
}

.container {
  max-width: 600px;
  margin: -1.5rem auto 0;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e3a8a;
  margin-bottom: 1rem;
}

.gps-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-weight: 600;

  &.pending {
    background: #fef3c7;
    color: #92400e;
  }
  &.ok {
    background: #d1fae5;
    color: #065f46;
  }
  &.error {
    background: #fee2e2;
    color: #991b1b;
  }
}

.form-group {
  margin-bottom: 1rem;

  label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .required {
    color: #ef4444;
  }
}

.form-select,
textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
  background: #f9fafb;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
}

.photo-upload {
  text-align: center;
  margin-bottom: 1rem;
}

.hidden-input {
  display: none;
}

.photo-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
  }
}

.submit-btn {
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: 12px;
}

.address-current {
  font-size: 0.9rem;
  color: #475569;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.coord-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 640px) {
  .coord-grid {
    grid-template-columns: 1fr;
  }
}
</style>
