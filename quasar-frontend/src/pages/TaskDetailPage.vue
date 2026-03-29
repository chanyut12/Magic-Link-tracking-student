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

        <!-- ASSIST: สร้าง Link มอบหมายใหม่ -->
        <div v-if="canCreateNewLink" class="assist-card q-mb-md">
          <div class="assist-card__header">
            <q-icon name="volunteer_activism" size="1.6rem" color="white" />
            <div>
              <div class="assist-card__title">มอบหมายงานรอบใหม่</div>
              <div class="assist-card__sub">ผอ. อนุมัติให้ความช่วยเหลือ — กรุณาระบุผู้รับผิดชอบ</div>
            </div>
          </div>

          <div class="assist-card__body">
            <div class="assist-steps">
              <div class="assist-step">
                <div class="step-num">1</div>
                <div class="step-label">ระบุผู้รับมอบหมาย</div>
              </div>
              <div class="step-divider"></div>
              <div class="assist-step">
                <div class="step-num">2</div>
                <div class="step-label">กำหนดอายุ Link</div>
              </div>
              <div class="step-divider"></div>
              <div class="assist-step">
                <div class="step-num">3</div>
                <div class="step-label">ส่ง Link ให้ผู้รับ</div>
              </div>
            </div>

            <div class="assist-fields">
              <q-input
                v-model="newLinkForm.assigned_to_name"
                label="ชื่อผู้รับมอบหมาย *"
                outlined
                dense
                class="q-mb-sm"
                placeholder="ชื่อ-นามสกุล"
                bg-color="white"
              >
                <template #prepend><q-icon name="person" color="primary" /></template>
              </q-input>

              <q-input
                v-model="newLinkForm.assigned_to_phone"
                label="เบอร์โทรศัพท์"
                outlined
                dense
                class="q-mb-sm"
                placeholder="0xx-xxx-xxxx"
                bg-color="white"
              >
                <template #prepend><q-icon name="phone" color="primary" /></template>
              </q-input>

              <q-input
                v-model="newLinkForm.assigned_to_email"
                label="อีเมล (ไม่บังคับ)"
                outlined
                dense
                class="q-mb-sm"
                placeholder="example@email.com"
                bg-color="white"
              >
                <template #prepend><q-icon name="email" color="primary" /></template>
              </q-input>

              <div class="expires-row">
                <span class="expires-label"><q-icon name="timer" color="primary" class="q-mr-xs" />อายุ Link</span>
                <div class="expires-options">
                  <button
                    v-for="opt in [{ v: '24', l: '24 ชม.' }, { v: '48', l: '48 ชม.' }, { v: '72', l: '72 ชม.' }]"
                    :key="opt.v"
                    class="expires-btn"
                    :class="{ active: newLinkForm.expires_value === opt.v }"
                    @click="newLinkForm.expires_value = opt.v"
                  >{{ opt.l }}</button>
                </div>
              </div>
            </div>

            <q-btn
              unelevated
              color="primary"
              class="full-width q-mt-md assist-submit-btn"
              :loading="newLinkSaving"
              @click="submitNewLink"
            >
              <q-icon name="add_link" class="q-mr-sm" />
              สร้าง Magic Link มอบหมายงาน
            </q-btn>
          </div>
        </div>

        <!-- FORWARD: ปิดเคสหลังหน่วยงานช่วยแล้ว -->
        <div v-if="canCloseAwaiting" class="awaiting-card q-mb-md">
          <div class="awaiting-card__banner">
            <q-icon name="hourglass_top" size="1.4rem" />
            <div>
              <div class="awaiting-card__banner-title">รอรับความช่วยเหลือจากหน่วยงาน</div>
              <div class="awaiting-card__banner-sub">เคสนี้ถูกส่งต่อหน่วยงานภายนอกแล้ว</div>
            </div>
            <q-chip color="amber-8" text-color="white" dense icon="schedule" class="q-ml-auto">
              รอดำเนินการ
            </q-chip>
          </div>

          <div class="awaiting-card__body">
            <p class="awaiting-card__desc">
              เมื่อนักเรียนได้รับความช่วยเหลือจากหน่วยงานแล้ว กรุณาบันทึกผลและปิดเคส
            </p>

            <q-input
              v-model="closeAwaitingForm.reviewed_by"
              label="ผู้บันทึก"
              outlined
              dense
              class="q-mb-sm"
              placeholder="เช่น ผอ.โรงเรียน..."
              bg-color="white"
            >
              <template #prepend><q-icon name="badge" color="amber-8" /></template>
            </q-input>

            <q-input
              v-model="closeAwaitingForm.review_note"
              label="บันทึกผลการช่วยเหลือ"
              outlined
              type="textarea"
              rows="3"
              class="q-mb-md"
              placeholder="สรุปผลลัพธ์จากหน่วยงาน / สิ่งที่นักเรียนได้รับ..."
              bg-color="white"
            />

            <q-btn
              unelevated
              color="positive"
              class="full-width close-awaiting-btn"
              :loading="closeAwaitingSaving"
              @click="submitCloseAwaiting"
            >
              <q-icon name="check_circle" class="q-mr-sm" />
              ปิดเคส — ได้รับความช่วยเหลือแล้ว
            </q-btn>
          </div>
        </div>

        <!-- ประวัติการมอบหมายทั้งหมดในเคสนี้ -->
        <div v-if="caseTasks.length > 1" class="card q-mb-md">
          <div class="case-history-header">
            <div class="card-title" style="margin-bottom: 0">ประวัติการมอบหมาย</div>
            <q-badge color="primary" :label="`${caseTasks.length} รอบ`" class="q-ml-sm" />
          </div>
          <div class="case-history-timeline q-mt-md">
            <div v-for="(t, i) in caseTasks" :key="t.task_id" class="history-item">
              <div class="history-item__left">
                <div class="history-round-badge" :class="i === caseTasks.length - 1 ? 'current' : ''">
                  {{ i + 1 }}
                </div>
                <div v-if="i < caseTasks.length - 1" class="history-connector"></div>
              </div>
              <div class="history-item__right">
                <div class="history-item__row">
                  <span class="history-assignee">{{ t.initial_assignee || 'ไม่ระบุ' }}</span>
                  <q-chip
                    v-if="t.has_submission"
                    dense size="sm" color="green-1" text-color="green-8" icon="check"
                  >ส่งรายงานแล้ว</q-chip>
                  <q-chip v-else dense size="sm" color="blue-1" text-color="blue-8" icon="schedule">
                    รอดำเนินการ
                  </q-chip>
                </div>
                <div class="history-date">{{ formatDateTime(t.created_at) }}</div>
                <router-link :to="`/task-detail/${t.task_id}`" class="history-link">
                  ดูรายละเอียดรอบนี้ <q-icon name="arrow_forward" size="0.8rem" />
                </router-link>
              </div>
            </div>
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

    <q-dialog v-model="newLinkDialog" persistent>
      <q-card class="magic-link-dialog">
        <div class="magic-link-dialog__header">
          <q-icon name="check_circle" color="white" size="2rem" />
          <div class="magic-link-dialog__title">สร้าง Magic Link สำเร็จ!</div>
          <div class="magic-link-dialog__sub">ส่ง Link นี้ให้ผู้รับมอบหมาย</div>
        </div>

        <q-card-section class="q-pt-md q-pb-sm">
          <div class="link-display-label">Magic Link</div>
          <div class="link-display-box">
            <span class="link-display-text">{{ newMagicLink }}</span>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-btn
            unelevated
            color="primary"
            class="full-width q-mb-sm"
            icon="content_copy"
            label="คัดลอก Link"
            @click="copyLink"
          />
          <q-btn
            flat
            class="full-width"
            label="ปิด"
            v-close-popup
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import StatusBadge from 'components/StatusBadge.vue';
import { useCaseTaskDetail } from '../composables/useCaseTaskDetail';
import { copyText } from '../utils/clipboard';
import {
  formatCaseDateTime,
  getCaseCauseLabel,
  getCasePhotoUrl,
  getCaseReviewActionLabel,
  getCaseStatusSummaryLabel,
  getCaseTimelineActionText,
  getCaseTimelineDotClass,
  getCaseTimelineStatusText,
  parseCasePhotoPaths,
  toCaseLocationNumber,
} from '../utils/casePresentation';

const $q = useQuasar();
const route = useRoute();
const taskId = route.params.taskId as string;
const {
  loading,
  data,
  reviews,
  caseTasks,
  reviewSaving,
  newLinkSaving,
  closeAwaitingSaving,
  reviewForm,
  newLinkForm,
  closeAwaitingForm,
  newLinkDialog,
  newMagicLink,
  reviewActionOptions,
  chain,
  submission,
  canReview,
  hasReviewCase,
  canCreateNewLink,
  canCloseAwaiting,
  headerInfo,
  fetchData,
  submitNewLink,
  submitCloseAwaiting,
  submitReview,
} = useCaseTaskDetail(taskId);
const photoDialog = ref(false);
const selectedPhoto = ref('');
const visitLat = computed(() => toCaseLocationNumber(submission.value?.visit_lat));
const visitLng = computed(() => toCaseLocationNumber(submission.value?.visit_lng));
const hasVisitLocation = computed(
  () => visitLat.value !== null && visitLng.value !== null,
);
const photos = computed(() =>
  parseCasePhotoPaths(String(submission.value?.photo_paths || '')),
);

const copyLink = async () => {
  try {
    const method = await copyText(newMagicLink.value);
    $q.notify({
      message: method === 'manual'
        ? 'เบราว์เซอร์บล็อกการคัดลอกอัตโนมัติ กรุณาคัดลอกจากหน้าต่างที่เปิดขึ้นมา'
        : 'คัดลอก Link แล้ว',
      color: method === 'manual' ? 'warning' : 'positive',
    });
  } catch {
    $q.notify({ message: 'ไม่สามารถคัดลอกได้', color: 'warning' });
  }
};
const getDotClass = getCaseTimelineDotClass;
const getActionText = getCaseTimelineActionText;
const getStatusText = getCaseTimelineStatusText;
const formatDateTime = formatCaseDateTime;
const getCauseLabel = getCaseCauseLabel;
const getReviewAction = getCaseReviewActionLabel;
const getCaseStatusLabel = getCaseStatusSummaryLabel;
const getPhotoUrl = getCasePhotoUrl;

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

// ── ASSIST card ──────────────────────────────────────────
.assist-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  &__header {
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: white;
  }

  &__title {
    font-weight: 800;
    font-size: 1rem;
    line-height: 1.2;
  }

  &__sub {
    font-size: 0.8rem;
    opacity: 0.85;
    margin-top: 2px;
  }

  &__body {
    padding: 1.25rem;
  }
}

.assist-steps {
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
  background: #f0f7ff;
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

.assist-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.step-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  font-weight: 800;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-label {
  font-size: 0.72rem;
  color: #1e3a8a;
  font-weight: 600;
  text-align: center;
}

.step-divider {
  width: 24px;
  height: 2px;
  background: #bfdbfe;
  flex-shrink: 0;
}

.assist-fields {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.expires-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8fafc;
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
  margin-top: 0.25rem;
}

.expires-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.expires-options {
  display: flex;
  gap: 0.4rem;
}

.expires-btn {
  padding: 4px 14px;
  border-radius: 20px;
  border: 1.5px solid #e2e8f0;
  background: white;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;

  &.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }

  &:hover:not(.active) {
    border-color: #3b82f6;
    color: #3b82f6;
  }
}

.assist-submit-btn {
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.7rem;
}

// ── AWAITING card ─────────────────────────────────────────
.awaiting-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  &__banner {
    background: linear-gradient(135deg, #92400e 0%, #f59e0b 100%);
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: white;
  }

  &__banner-title {
    font-weight: 800;
    font-size: 1rem;
  }

  &__banner-sub {
    font-size: 0.8rem;
    opacity: 0.85;
    margin-top: 2px;
  }

  &__body {
    padding: 1.25rem;
  }

  &__desc {
    font-size: 0.88rem;
    color: #64748b;
    margin-bottom: 1rem;
    line-height: 1.5;
  }
}

.close-awaiting-btn {
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.7rem;
}

// ── Case history ─────────────────────────────────────────
.case-history-header {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.case-history-timeline {
  display: flex;
  flex-direction: column;
}

.history-item {
  display: flex;
  gap: 0.75rem;

  &__left {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 32px;
    flex-shrink: 0;
  }

  &__right {
    flex: 1;
    padding-bottom: 1.25rem;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 2px;
  }

  &:last-child .history-item__right {
    padding-bottom: 0;
  }
}

.history-round-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  font-weight: 800;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.current {
    background: #3b82f6;
    color: white;
  }
}

.history-connector {
  width: 2px;
  flex: 1;
  background: #e2e8f0;
  min-height: 20px;
  margin: 4px 0;
}

.history-assignee {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.9rem;
}

.history-date {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 4px;
}

.history-link {
  font-size: 0.82rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 2px;

  &:hover { text-decoration: underline; }
}

// ── Magic Link dialog ────────────────────────────────────
.magic-link-dialog {
  border-radius: 20px !important;
  overflow: hidden;
  min-width: 320px;
  max-width: 440px;

  &__header {
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    padding: 1.5rem 1.25rem 1.25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
    color: white;
  }

  &__title {
    font-weight: 800;
    font-size: 1.1rem;
  }

  &__sub {
    font-size: 0.85rem;
    opacity: 0.85;
  }
}

.link-display-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.link-display-box {
  background: #f1f5f9;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.9rem 1rem;
  word-break: break-all;
}

.link-display-text {
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  color: #1e3a8a;
  font-weight: 600;
  line-height: 1.5;
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
