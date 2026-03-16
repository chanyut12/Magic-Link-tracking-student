<template>
  <q-page class="task-detail-page">
    <div v-if="loading" class="loading-container">
      <q-spinner color="primary" size="3rem" />
      <p class="q-mt-md text-gray-500">กำลังโหลดข้อมูล...</p>
    </div>

    <template v-else-if="data">
      <div class="detail-header">
        <q-btn flat round icon="arrow_back" color="white" to="/dashboard" class="back-btn" />
        <h1>รายละเอียดภารกิจ</h1>
        <div class="subtitle">{{ headerInfo }}</div>
      </div>

      <div class="container q-pa-lg">
        <div class="card q-mb-md">
          <div class="card-title">ข้อมูลภารกิจ</div>
          <div class="info-row">
            <span class="label">สถานะภาพรวม</span>
            <span class="value"><StatusBadge :status="String(data.case_status || data.task_status)" /></span>
          </div>
          <template v-if="data.task_type === 'VISIT'">
            <div class="info-row">
              <span class="label">ชื่อนักเรียน</span>
              <span class="value">{{ data.student_name || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">โรงเรียน</span>
              <span class="value">{{ data.student_school || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">สาเหตุ</span>
              <span class="value text-negative">{{ data.reason_flagged || '-' }}</span>
            </div>
          </template>
          <template v-else>
            <div class="info-row">
              <span class="label">ประเภทภารกิจ</span>
              <span class="value">เช็คชื่อรายห้อง (Attendance)</span>
            </div>
            <div class="info-row">
              <span class="label">ระดับชั้น</span>
              <span class="value">{{ data.target_grade || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">ห้อง</span>
              <span class="value">{{ data.target_room || '-' }}</span>
            </div>
          </template>
        </div>

        <div class="card q-mb-md">
          <div class="card-title">เส้นทางการมอบหมาย (Delegation Chain)</div>
          <div class="timeline">
            <div v-for="(link, i) in chain" :key="String(link.id)" class="timeline-item">
              <div class="timeline-dot" :class="getDotClass(String(link.status))"></div>
              <div class="timeline-content">
                <div class="timeline-title">{{ link.assigned_to_name || 'ไม่ระบุ' }}</div>
                <div class="timeline-meta">
                  {{ getActionText(i, Number(link.delegation_depth)) }}{{ getStatusText(link) }}
                </div>
                <div class="timeline-meta">{{ formatDateTime(String(link.created_at)) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="submission" class="card q-mb-md">
          <div class="card-title">ข้อมูลรายงานการลงพื้นที่</div>
          <div class="info-row">
            <span class="label">สาเหตุ</span>
            <span class="value">{{ getCauseLabel(String(submission.cause_category)) }}</span>
          </div>
          <div class="info-row">
            <span class="label">รายละเอียด</span>
            <span class="value">{{ submission.cause_detail || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">ข้อเสนอแนะ</span>
            <span class="value">{{ submission.recommendation || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">พิกัดลงพื้นที่</span>
            <span class="value">
              <template v-if="hasVisitLocation">
                {{ visitLat }}, {{ visitLng }}
                <q-btn flat dense color="primary" icon="map" @click="openMap" class="q-ml-sm" />
              </template>
              <template v-else>-</template>
            </span>
          </div>
          <div class="info-row">
            <span class="label">เวลาส่งรายงาน</span>
            <span class="value">{{ formatDateTime(String(submission.submitted_at)) }}</span>
          </div>

          <div v-if="photos.length > 0" class="q-mt-md">
            <div class="text-weight-bold q-mb-sm">รูปภาพ</div>
            <div class="photo-grid">
              <img
                v-for="(photo, idx) in photos"
                :key="idx"
                :src="getPhotoUrl(photo)"
                @click="openPhoto(photo)"
                class="photo-item"
              />
            </div>
          </div>

          <div v-if="hasVisitLocation" class="q-mt-md">
            <div class="text-weight-bold q-mb-sm">แผนที่ลงพื้นที่</div>
            <iframe
              class="map-frame"
              :src="getEmbedMapUrl()"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div v-if="canReview" class="card q-mb-md">
          <div class="card-title">ประเมินผลเคส (ผอ.)</div>
          <div class="form-group">
            <label>การตัดสินใจ</label>
            <select v-model="reviewForm.review_action">
              <option v-for="option in reviewActionOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>ผู้ประเมิน</label>
            <input v-model="reviewForm.reviewed_by" type="text" placeholder="เช่น ผอ.โรงเรียน..." />
          </div>
          <div class="form-group">
            <label>บันทึกการประเมิน</label>
            <textarea v-model="reviewForm.review_note" placeholder="รายละเอียดการประเมิน/คำสั่งการเพิ่มเติม"></textarea>
          </div>
          <q-btn
            color="primary"
            unelevated
            label="บันทึกผลการประเมิน"
            icon="task_alt"
            :loading="reviewSaving"
            @click="submitReview"
          />
        </div>

        <div v-else-if="hasReviewCase" class="card q-mb-md">
          <div class="card-title">ประเมินผลเคส (ผอ.)</div>
          <div class="text-grey-7">
            เคสนี้ถูกประเมินแล้ว (สถานะปัจจุบัน: {{ getCaseStatusLabel(String(data.case_status || '-')) }})
          </div>
        </div>

        <div v-if="reviews.length > 0" class="card q-mb-md">
          <div class="card-title">ประวัติการประเมิน</div>
          <div v-for="review in reviews" :key="String(review.id)" class="review-item">
            <div class="info-row">
              <span class="label">{{ getReviewAction(String(review.review_action)) }} — {{ review.reviewed_by || 'ผอ.' }}</span>
              <span class="value">{{ formatDateTime(String(review.reviewed_at)) }}</span>
            </div>
            <div v-if="review.review_note" class="review-note">{{ review.review_note }}</div>
          </div>
        </div>
      </div>
    </template>

    <q-dialog v-model="photoDialog">
      <q-card>
        <q-card-section class="q-pa-none">
          <img :src="selectedPhoto" style="max-width: 90vw; max-height: 80vh;" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="ปิด" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import StatusBadge from 'components/StatusBadge.vue';

interface ChainLink {
  id: string;
  assigned_to_name: string;
  delegation_depth: number;
  status: string;
  created_at: string;
  admin_locked?: number;
  submission?: Submission | null;
}

interface Submission {
  cause_category: string;
  cause_detail: string;
  recommendation: string;
  visit_lat: number | null;
  visit_lng: number | null;
  photo_paths: string;
  submitted_at: string;
}

interface Review {
  id: string;
  review_action: string;
  reviewed_by: string;
  reviewed_at: string;
  review_note: string;
}

interface TaskChainData {
  task_id: string;
  case_id: number | null;
  task_type: string;
  target_grade: string;
  target_room: string;
  student_name: string;
  student_school: string;
  reason_flagged: string;
  task_status: string;
  case_status: string;
  chain: ChainLink[];
  reviews: Review[];
}

const $q = useQuasar();
const route = useRoute();
const taskId = route.params.taskId as string;

const loading = ref(true);
const data = ref<TaskChainData | null>(null);
const photoDialog = ref(false);
const selectedPhoto = ref('');
const reviewSaving = ref(false);

const reviewForm = reactive({
  review_action: 'ASSIST',
  review_note: '',
  reviewed_by: '',
});

const reviewActionOptions = [
  { label: 'ให้ความช่วยเหลือ', value: 'ASSIST' },
  { label: 'ส่งต่อหน่วยงาน/ผู้เกี่ยวข้อง', value: 'FORWARD' },
  { label: 'ปิดเคส', value: 'CLOSE' },
];

const chain = computed(() => data.value?.chain || []);

const submission = computed(() => {
  const chainLinks = data.value?.chain || [];
  const submissions = chainLinks
    .map((link) => link.submission)
    .filter((item): item is Submission => !!item);

  if (!submissions.length) return null;

  return submissions.sort((a, b) => {
    const timeA = new Date(String(a.submitted_at)).getTime();
    const timeB = new Date(String(b.submitted_at)).getTime();
    return timeB - timeA;
  })[0];
});

const reviews = ref<Review[]>([]);
const toFiniteNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const hasReviewCase = computed(
  () => data.value?.task_type === 'VISIT' && !!data.value?.case_id,
);
const canReview = computed(
  () => hasReviewCase.value && data.value?.case_status === 'PENDING_REVIEW',
);

const visitLat = computed(() => toFiniteNumber(submission.value?.visit_lat));
const visitLng = computed(() => toFiniteNumber(submission.value?.visit_lng));
const hasVisitLocation = computed(
  () => visitLat.value !== null && visitLng.value !== null,
);
const photos = computed(() =>
  parsePhotos(String(submission.value?.photo_paths || '')),
);

const headerInfo = computed(() => {
  if (!data.value) return '';
  if (data.value.task_type === 'ATTENDANCE') {
    return `ภารกิจเช็คชื่อ ${data.value.target_grade}/${data.value.target_room}`;
  }
  return `${data.value.student_name || ''} — ${data.value.student_school || ''}`;
});

const fetchData = async () => {
  try {
    const res = await api.get(`/api/tasks/${taskId}/chain`);
    data.value = res.data;
    if (data.value?.case_id) {
      await fetchCaseReviews(Number(data.value.case_id));
    } else {
      reviews.value = Array.isArray(data.value?.reviews) ? data.value.reviews : [];
    }
  } catch (err) {
    console.error(err);
    $q.notify({ message: 'ไม่สามารถโหลดข้อมูลได้', color: 'negative' });
  } finally {
    loading.value = false;
  }
};

const fetchCaseReviews = async (caseId: number) => {
  try {
    const res = await api.get(`/api/cases/${caseId}/reviews`);
    if (Array.isArray(res.data?.data)) {
      reviews.value = res.data.data;
      return;
    }
    reviews.value = Array.isArray(data.value?.reviews) ? data.value.reviews : [];
  } catch {
    reviews.value = Array.isArray(data.value?.reviews) ? data.value.reviews : [];
  }
};

const getDotClass = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'dot-active',
    DELEGATED: 'dot-delegated',
    COMPLETED: 'dot-completed',
    EXPIRED: 'dot-expired',
  };
  return map[status] || 'dot-active';
};

const getActionText = (index: number, depth: number) => {
  if (index === 0) return 'ได้รับมอบหมายจากต้นทาง';
  return `ได้รับการส่งต่อ (ทอดที่ ${depth})`;
};

const getStatusText = (link: ChainLink) => {
  if (link.status === 'DELEGATED') return ' — ส่งต่อให้คนอื่นแล้ว';
  if (link.status === 'COMPLETED') return ' — ลงพื้นที่สำเร็จ';
  if (link.status === 'ACTIVE') return ' — รอดำเนินการ';
  if (link.admin_locked) return ' — ถูกผู้ดูแลปิดลิงก์';
  return '';
};

const formatDateTime = (d: string) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const getCauseLabel = (category: string) => {
  const labels: Record<string, string> = {
    ECONOMIC: 'ปัญหาทางเศรษฐกิจ',
    FAMILY: 'ปัญหาครอบครัว',
    HEALTH: 'ปัญหาสุขภาพ',
    MIGRATION: 'ย้ายถิ่นฐาน',
    DISABILITY: 'ความพิการ',
    BEHAVIOR: 'ปัญหาพฤติกรรม',
    OTHER: 'อื่นๆ',
  };
  return labels[category] || category || '-';
};

const getReviewAction = (action: string) => {
  const map: Record<string, string> = {
    ASSIST: 'ให้ความช่วยเหลือ',
    FORWARD: 'ส่งต่อหน่วยงาน/ผู้เกี่ยวข้อง',
    CLOSE: 'ปิดเคส',
  };
  return map[action] || action;
};

const getCaseStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    PENDING_REVIEW: 'รอผอ.ประเมิน',
    IN_PROGRESS: 'กำลังดำเนินการ',
    RESOLVED: 'ปิดเคสแล้ว',
  };
  return map[status] || status || '-';
};

const submitReview = async () => {
  if (!data.value?.case_id || !canReview.value) return;
  if (!reviewForm.review_action) {
    $q.notify({ message: 'กรุณาเลือกการตัดสินใจ', color: 'warning' });
    return;
  }

  reviewSaving.value = true;
  try {
    await api.post(`/api/cases/${data.value.case_id}/review`, {
      review_action: reviewForm.review_action,
      review_note: reviewForm.review_note,
      reviewed_by: reviewForm.reviewed_by,
    });
    reviewForm.review_note = '';
    $q.notify({ message: 'บันทึกผลการประเมินสำเร็จ', color: 'positive' });
    await fetchData();
  } catch (err: unknown) {
    console.error(err);
    const error = err as { response?: { data?: { message?: string } } };
    $q.notify({
      message: error.response?.data?.message || 'ไม่สามารถบันทึกผลการประเมินได้',
      color: 'negative',
    });
  } finally {
    reviewSaving.value = false;
  }
};

const parsePhotos = (paths: string) => {
  const normalized = (paths || '').trim();
  if (!normalized) return [];
  if (normalized.startsWith('[')) {
    try {
      const parsed = JSON.parse(normalized);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const getPhotoUrl = (filename: string) => {
  const normalized = (filename || '').trim();
  if (!normalized) return '';
  if (
    normalized.startsWith('data:') ||
    normalized.startsWith('http') ||
    normalized.startsWith('/uploads/')
  ) {
    return normalized;
  }
  return `/uploads/${normalized}`;
};

const openPhoto = (photo: string) => {
  selectedPhoto.value = getPhotoUrl(photo);
  photoDialog.value = true;
};

const openMap = () => {
  if (!hasVisitLocation.value) return;
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${visitLat.value},${visitLng.value}`,
    '_blank',
  );
};

const getEmbedMapUrl = () => {
  if (!hasVisitLocation.value) return '';
  return `https://maps.google.com/maps?q=${visitLat.value},${visitLng.value}&z=15&output=embed`;
};

onMounted(() => {
  void fetchData();
});
</script>

<style lang="scss" scoped>
.task-detail-page {
  background-color: #f4f7fe;
  min-height: 100vh;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.detail-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
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
  max-width: 800px;
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

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child { border-bottom: none; }

  .label {
    color: #64748b;
    font-size: 0.9rem;
  }

  .value {
    font-weight: 600;
    color: #1e293b;
    text-align: right;
  }
}

.timeline {
  position: relative;
  padding-left: 30px;

  &::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e2e8f0;
  }
}

.timeline-item {
  position: relative;
  padding-bottom: 1.5rem;

  &:last-child { padding-bottom: 0; }
}

.timeline-dot {
  position: absolute;
  left: -26px;
  top: 4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 2px currentColor;

  &.dot-active { background: #3b82f6; color: #3b82f6; }
  &.dot-delegated { background: #f59e0b; color: #f59e0b; }
  &.dot-completed { background: #10b981; color: #10b981; }
  &.dot-expired { background: #94a3b8; color: #94a3b8; }
}

.timeline-content {
  padding-left: 0.5rem;
}

.timeline-title {
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.timeline-meta {
  font-size: 0.85rem;
  color: #64748b;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.photo-item {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover { transform: scale(1.05); }
}

.map-frame {
  height: 300px;
  width: 100%;
  border: 0;
  border-radius: 12px;
  overflow: hidden;
}

.review-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child { border-bottom: none; }
}

.review-note {
  background: #f8fafc;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #64748b;
}

.form-group {
  margin-bottom: 0.9rem;

  label {
    display: block;
    margin-bottom: 0.4rem;
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 700;
  }

  input,
  select,
  textarea {
    width: 100%;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 0.95rem;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }
  }

  textarea {
    min-height: 90px;
    resize: vertical;
  }
}
</style>
