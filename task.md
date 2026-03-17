# Implementation Plan: Missing Features for Quasar + NestJS

## Overview

เปรียบเทียบ Feature ระหว่าง STS_LINK_GENERATE (Express) vs Quasar + NestJS

| Feature | STS_LINK_GENERATE | NestJS | Quasar | Priority |
|---------|:-----------------:|:------:|:------:|:--------:|
| **1. Delegation** | ✅ | ✅ | ✅ | 🔴 High |
| **2. Report Submission (Photos + GPS)** | ✅ | ✅ | ✅ | 🔴 High |
| **3. Success Page** | ✅ | - | ✅ | 🟡 Medium |
| **4. Expired Page** | ✅ | - | ✅ | 🟡 Medium |
| **5. Task History API** | ✅ | ✅ | - | 🟢 Low |
| **6. Photo Upload API** | ✅ | ✅ | - | 🔴 High |
| **7. QR Code Generation** | ✅ | ✅ | - | 🟡 Medium |
| **8. Task Chain API** | ✅ | ✅ | - | 🟡 Medium |
| **9. Task Detail Page** | ✅ | - | ✅ | 🟡 Medium |

---

## Phase 1: Delegation Feature (มอบหมายให้ผู้อื่น) ✅ COMPLETED

### Status: ✅ COMPLETED

### Backend (NestJS)

**Files created/updated:**

| File | Status | Description |
|------|:------:|-------------|
| `nest-backend/src/task/delegation.service.ts` | ✅ | Service for delegation logic |
| `nest-backend/src/task/delegation.controller.ts` | ✅ | Controller with POST /api/tasks/:token/delegate |
| `nest-backend/src/task/task.module.ts` | ✅ | Updated to include DelegationController |

**API Endpoint:**
```
POST /api/tasks/:token/delegate
Body: {
  new_assignee_name: string (required),
  new_assignee_phone?: string,
  expires_in_hours?: number
}
Response: {
  magic_link: string,
  qr_code_data: string | null,
  expires_at: string,
  delegation_depth: number
}
```

### Frontend (Quasar)

**Files created/updated:**

| File | Status | Description |
|------|:------:|-------------|
| `quasar-frontend/src/pages/DelegatePage.vue` | ✅ | New page for delegation form and result |
| `quasar-frontend/src/router/routes.ts` | ✅ | Added route `/task/:token/delegate` |
| `quasar-frontend/src/pages/TaskGuestPage.vue` | ✅ | Added delegation button with canDelegate check |

**Features Implemented:**
- [x] Form: ชื่อผู้รับงาน, เบอร์โทร, อายุลิงก์
- [x] Result: แสดง magic link, QR code, ปุ่มคัดลอก, ปุ่มแชร์ LINE
- [x] Validation: max_delegation_depth, link status
- [x] QR Code generation with `qrcode` package

---

## Phase 2: Report Submission with Photos + GPS ✅ COMPLETED

### Status: ✅ COMPLETED

### Backend (NestJS)

**Files created/modified:**

| File | Status | Description |
|------|:------:|-------------|
| `nest-backend/src/common/interceptors/file-upload.interceptor.ts` | ✅ | Multer config for photo uploads |
| `nest-backend/src/task/submission.controller.ts` | ✅ | Controller for POST /api/tasks/:token/submit (multipart/form-data) |
| `nest-backend/src/task/task.service.ts` | ✅ | Updated to store photo_paths |
| `nest-backend/src/task/task.module.ts` | ✅ | Registered SubmissionController |

**API Endpoint:**
```
POST /api/tasks/:token/submit (multipart/form-data)
- photos: File[] (max 5 files, jpg/png/gif/webp, max 5MB each)
- cause_category: string (required)
- cause_detail: string
- visit_lat: number
- visit_lng: number
- recommendation: string
```

### Frontend (Quasar)

**Files created/modified:**

| File | Status | Description |
|------|:------:|-------------|
| `quasar-frontend/src/pages/ReportPage.vue` | ✅ | Report page with GPS + photo upload |
| `quasar-frontend/src/pages/SuccessPage.vue` | ✅ | Success confirmation page |
| `quasar-frontend/src/router/routes.ts` | ✅ | Added routes for /report and /success |
| `quasar-frontend/src/pages/TaskGuestPage.vue` | ✅ | Added "ลงพื้นที่เอง" button linking to report page |

**Features Implemented:**
- [x] GPS auto-fetch with status indicator
- [x] Photo upload (camera/gallery, max 5 photos)
- [x] Photo preview with remove button
- [x] cause_category dropdown (7 categories)
- [x] cause_detail textarea
- [x] recommendation textarea
- [x] Submit button with loading state
- [x] Redirect to success page after submission

---

## Phase 3: Success & Expired Pages ✅ COMPLETED

### Status: ✅ COMPLETED

### Frontend (Quasar)

**Files created:**

| File | Status | Description |
|------|:------:|-------------|
| `quasar-frontend/src/pages/SuccessPage.vue` | ✅ | Success confirmation page |
| `quasar-frontend/src/pages/ExpiredPage.vue` | ✅ | Expired link page |
| `quasar-frontend/src/router/routes.ts` | ✅ | Added routes for /success and /expired |
| `quasar-frontend/src/pages/TaskGuestPage.vue` | ✅ | Handle EXPIRED status redirect |

**Features Implemented:**
- [x] Success page with checkmark animation
- [x] Expired page with pulse animation
- [x] Frontend checks for `status: 'EXPIRED'` and redirects to `/task/:token/expired`
- [x] Backend returns 410 GONE status for expired links

---

## Phase 4: Task History API ✅ COMPLETED

### Status: ✅ COMPLETED

### Backend (NestJS)

**Files modified:**

| File | Status | Description |
|------|:------:|-------------|
| `nest-backend/src/task/task.controller.ts` | ✅ | Added GET /api/tasks/:token/history endpoint |
| `nest-backend/src/task/task.service.ts` | ✅ | Added getTaskHistory method |

**API Endpoint:**
```
GET /api/tasks/:token/history?date=YYYY-MM-DD
- Returns attendance records for specific date
- Defaults to today if date not provided
Response: { success: true, data: [{ student_id, student_name, status }] }
```

---

## Phase 5: QR Code Generation for Create Task ✅ COMPLETED

### Status: ✅ COMPLETED

### Backend (NestJS)

**Files modified:**

| File | Status | Description |
|------|:------:|-------------|
| `nest-backend/src/task/task.service.ts` | ✅ | Added QR code generation in createTask() |

**API Response (createTask):**
```json
{
  "task_id": "uuid",
  "magic_link": "https://.../#/task/token",
  "qr_code_data": "data:image/png;base64,...",
  "expires_at": "2026-03-16T..."
}
```

---

## Phase 6: Task Chain API + Detail Page ✅ COMPLETED

### Status: ✅ COMPLETED

### Backend (NestJS)

**Files modified:**

| File | Status | Description |
|------|:------:|-------------|
| `nest-backend/src/task/task.controller.ts` | ✅ | Added GET /api/tasks/:taskId/chain endpoint |
| `nest-backend/src/task/task.service.ts` | ✅ | Added getTaskChain() method |

**API Endpoint:**
```
GET /api/tasks/:taskId/chain
Response: {
  task_id, case_id, task_type, target_grade, target_room,
  student_name, student_school, reason_flagged,
  task_status, case_status, result_summary,
  chain: [
    { id, assigned_to_name, delegation_depth, status, created_at, submission }
  ],
  reviews: [
    { id, review_action, reviewed_by, reviewed_at, review_note }
  ]
}
```

### Frontend (Quasar)

**Files created:**

| File | Status | Description |
|------|:------:|-------------|
| `quasar-frontend/src/pages/TaskDetailPage.vue` | ✅ | Admin detail page with timeline |
| `quasar-frontend/src/components/StatusBadge.vue` | ✅ | Reusable status badge component |
| `quasar-frontend/src/router/routes.ts` | ✅ | Added /task-detail/:taskId route |

**Features Implemented:**
- [x] Case info section (student_name, school, reason)
- [x] Delegation chain timeline visualization
- [x] Submission details (cause, photos, GPS)
- [x] Leaflet map for GPS coordinates
- [x] Review history display
- [x] Photo gallery with lightbox

---

## File Structure Summary

```
nest-backend/src/
├── task/
│   ├── task.controller.ts      ✅ updated (history + chain endpoints)
│   ├── task.service.ts         ✅ updated (photo_paths + QR code + chain)
│   ├── delegation.controller.ts ✅ NEW (Phase 1)
│   ├── delegation.service.ts    ✅ NEW (Phase 1)
│   ├── submission.controller.ts ✅ NEW (Phase 2)
│   ├── admin.controller.ts      ✅ exists
│   └── stats.controller.ts      ✅ exists
├── common/
│   ├── utils/
│   │   └── helpers.ts          ✅ exists
│   └── interceptors/
│       └── file-upload.interceptor.ts ✅ NEW (Phase 2)

quasar-frontend/src/
├── components/
│   └── StatusBadge.vue         ✅ NEW (Phase 6)
├── pages/
│   ├── TaskGuestPage.vue       ✅ updated (Phase 1, 2 & 3)
│   ├── DelegatePage.vue        ✅ NEW (Phase 1)
│   ├── ReportPage.vue          ✅ NEW (Phase 2)
│   ├── SuccessPage.vue         ✅ NEW (Phase 2/3)
│   ├── ExpiredPage.vue         ✅ NEW (Phase 3)
│   └── TaskDetailPage.vue      ✅ NEW (Phase 6)
└── router/
    └── routes.ts               ✅ updated
```

---

## Estimated Time

| Phase | Description | Status | Time |
|-------|-------------|:------:|------|
| Phase 1 | Delegation | ✅ DONE | 2-3 hrs |
| Phase 2 | Report + Photos + GPS | ✅ DONE | 3-4 hrs |
| Phase 3 | Success/Expired Pages | ✅ DONE | 1 hr |
| Phase 4 | Task History API | ✅ DONE | 1 hr |
| Phase 5 | QR Code in CreateTask | ✅ DONE | 30 min |
| Phase 6 | Task Chain + Detail Page | ✅ DONE | 2 hrs |

**Phases 1-6 Complete — Phase 7 (Delegation Flow Fix) และ Phase 8 (Attendance Fix) ยังไม่เริ่ม**

---

## Phase 7: Delegation Flow — Bug Fixes

### Status: 🔴 NOT STARTED

> Focus: แก้ไข flow การมอบหมายงาน (VISIT task) ให้ทำงานถูกต้องครบ cycle
> ตั้งแต่เปิดลิงค์ → OTP → เลือกลงพื้นที่/ส่งต่อ → submit → รอ ผอ.ประเมิน

---

### Checklist

| # | รายการ | File | Priority | Status |
|---|--------|------|----------|--------|
| 1 | `getTaskByToken()` เพิ่ม fields: `reason_flagged`, `auth_required`, `can_delegate`, `delegation_depth`, `max_delegation_depth` | task.service.ts | 🔴 | [ ] |
| 2 | `requestOtp()` — ส่ง OTP จริงทาง email (SMTP) แทน hardcode '123456' | task.service.ts + email.service.ts (NEW) | 🔴 | [ ] |
| 3 | `verifyOtp()` — เทียบ OTP กับ DB + เช็ค expiry แทน hardcode | task.service.ts | 🔴 | [ ] |
| 4 | `saveTaskSubmission()` — case status → `PENDING_REVIEW`, task status → `COMPLETED`, link status → `COMPLETED` | task.service.ts | 🔴 | [ ] |
| 5 | photo_paths format → JSON array string `["/uploads/f.jpg"]` แทน comma string | submission.controller.ts | 🔴 | [ ] |
| 6 | `submitVisit()` ใน TaskGuestPage — endpoint `/submission` → `/submit` | TaskGuestPage.vue | 🔴 | [ ] |
| 7 | DelegatePage — เพิ่ม `new_assignee_email` field (optional) | DelegatePage.vue | 🟡 | [ ] |
| 8 | Case Review System — สร้าง table + endpoints + UI สำหรับ ผอ. review ผลลงพื้นที่ | case.controller.ts + case.service.ts (NEW) | 🟠 | [ ] |

---

### รายละเอียด Bug แต่ละข้อ

#### Bug 1: `getTaskByToken()` ไม่ return fields ครบ
- **File:** `nest-backend/src/task/task.service.ts`
- เพิ่ม JOIN กับ tasks เพื่อดึง `max_delegation_depth`
- คำนวณ `auth_required = (task_type === 'VISIT' && otp_verified = false)`
- คำนวณ `can_delegate = (delegation_depth < max_delegation_depth && status = 'ACTIVE' && !admin_locked)`
- return `reason_flagged` จาก cases table

#### Bug 2 & 3: OTP mock → จริง
- **File:** `nest-backend/src/task/task.service.ts` + สร้าง `email.service.ts`
- nodemailer ติดตั้งแล้ว (`node_modules/nodemailer` มีอยู่)
- env vars พร้อมแล้วใน `.env`: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- `requestOtp()`: สุ่ม OTP 6 หลัก → UPDATE task_links (otp_code, otp_expires_at = +10min) → ส่ง email
- `verifyOtp()`: query DB เทียบ otp_code + ตรวจ otp_expires_at → UPDATE otp_verified = true

#### Bug 4: Case/Task status ผิดหลัง submit
- **File:** `nest-backend/src/task/task.service.ts` → `saveTaskSubmission()`
- บรรทัด 348: `finalStatus` → แก้เป็น `'PENDING_REVIEW'` เสมอ
- บรรทัด 358: `'DONE'` → แก้เป็น `'COMPLETED'`
- เพิ่ม: `UPDATE task_links SET status = 'COMPLETED'`

#### Bug 5: Photo paths format
- **File:** `nest-backend/src/task/submission.controller.ts`
- บรรทัด 41: `photoPaths.join(',')` → `JSON.stringify(photoPaths.map(f => '/uploads/' + f))`
- ตรวจสอบ TaskDetailPage.vue parse photo_paths ด้วย `JSON.parse()`

#### Bug 6: Endpoint ผิดใน TaskGuestPage
- **File:** `quasar-frontend/src/pages/TaskGuestPage.vue`
- บรรทัด 380: `/api/tasks/${token}/submission` → `/api/tasks/${token}/submit`

#### Feature 8: Case Review System
- สร้าง table `case_reviews` (id, case_id, review_action, review_note, reviewed_by, reviewed_at)
- `POST /api/cases/:caseId/review` → INSERT review + UPDATE case status
- `GET /api/cases/:caseId/reviews` → list reviews
- เพิ่ม UI review form ใน TaskDetailPage.vue

---

### Files สรุป — พร้อม Reference จาก STS_LINK_GENERATE

| Current File | Action | อ่าน Reference จาก STS_LINK_GENERATE |
|---|---|---|
| `nest-backend/src/task/task.service.ts` | แก้ Bug 1, 2, 3, 4 | `controllers/task.controller.js` → fn: `getTaskByToken`, `requestOTP`, `verifyOTP`, `submitTask` |
| `nest-backend/src/task/submission.controller.ts` | แก้ Bug 5 | `controllers/submission.controller.js` → fn: `submitTask` (ดู photo_paths format) |
| `nest-backend/src/task/email.service.ts` | NEW (Bug 2) | `services/email.service.js` → fn: `sendOTP` |
| `nest-backend/src/task/case.controller.ts` | NEW (Feature 8) | `routes/api.js` → routes: `POST /cases/:id/review`, `GET /cases/:id/reviews` |
| `nest-backend/src/task/case.service.ts` | NEW (Feature 8) | `controllers/case.controller.js` → fn: `reviewCase`, `getCaseReviews` |
| `nest-backend/src/task/task.module.ts` | register EmailService, CaseController, CaseService | — |
| `nest-backend/src/database/database.service.ts` | เพิ่ม table case_reviews | `db/init.js` → table: `case_reviews` |
| `quasar-frontend/src/pages/TaskGuestPage.vue` | แก้ Bug 6 | `views/task-view.html` + `public/js/task-view.js` |
| `quasar-frontend/src/pages/DelegatePage.vue` | แก้ Bug 7 | `views/delegate.html` + `public/js/delegate.js` |
| `quasar-frontend/src/pages/TaskDetailPage.vue` | เพิ่ม review UI (Feature 8) | `views/task-detail.html` + `controllers/case.controller.js` |

---

## Phase 8: Attendance Flow — Bug Fixes

### Status: 🔴 NOT STARTED

> Focus: แก้ไข flow การเช็คชื่อ (ATTENDANCE task) ให้ครบ cycle
> ตั้งแต่เปิดลิงค์ → เช็คชื่อ → auto-complete เมื่อครบ

---

### Checklist

| # | รายการ | File | Priority | Status |
|---|--------|------|----------|--------|
| 1 | `saveTaskAttendance()` — เพิ่ม logic auto-complete link เมื่อ mark ครบทุกคนในชั้น | task.service.ts | 🟠 | [ ] |
| 2 | return message แจ้งจำนวน เช่น `"บันทึกสำเร็จ (8/8 คน)"` | task.service.ts | 🟡 | [ ] |
| 3 | ตรวจสอบ ATTENDANCE task expire ใน 24 ชม. ถูก enforce หรือเปล่า | task.service.ts | 🟡 | [ ] |

---

### รายละเอียด

#### Fix 1: Attendance Auto-Complete
- **File:** `nest-backend/src/task/task.service.ts` → `saveTaskAttendance()`
- หลัง insert records: COUNT นักเรียนทั้งหมดในชั้น (target_grade + target_room)
- COUNT นักเรียนที่ถูก mark วันนี้
- ถ้า checked == total → `UPDATE task_links SET status = 'COMPLETED'`
- return `{ success: true, message: "บันทึกสำเร็จ (8/8 คน) ลิงก์เสร็จสิ้นแล้ว" }`

#### Fix 3: 24hr Expiry Enforcement
- **File:** `nest-backend/src/task/task.service.ts` → `createTask()`
- บรรทัด 32-34: ATTENDANCE task ควร force `expiresHours = 24` เสมอ ไม่ใช่แค่ `Math.max(1)`

---

### Files สรุป — พร้อม Reference จาก STS_LINK_GENERATE

| Current File | Action | อ่าน Reference จาก STS_LINK_GENERATE |
|---|---|---|
| `nest-backend/src/task/task.service.ts` | แก้ Fix 1, 2, 3 | `controllers/task.controller.js` → fn: `saveAttendance`, `createTask` (ดู expiry logic) |

---

## Phase 9: Dashboard UI Improvement (Execution)

### Status: ✅ COMPLETED (Iteration 2 Complete)

> Focus: ยกระดับ UX/UI ของ `/dashboard` และ `/attendance-dashboard`
> จาก "ใช้งานได้" → "อ่านเร็ว, จัดการเร็ว, บุคลิกชัด, รองรับ mobile/accessibility ดีขึ้น"
>
> Last update: 2026-03-16 (night)

---

### Progress Summary

- ปรับ hero section + stat cards + result counter ของทั้งสองหน้า
- เพิ่ม mobile card layout ให้ใช้งานบนจอเล็กได้ครบ flow หลัก
- เพิ่ม `lastUpdated`, `refreshData`, และ KPI rate (`completionRate` / `activeRate`)
- เปลี่ยน row actions เป็น `primary action + secondary menu` ทั้ง desktop/mobile
- ย้าย style ซ้ำไป `quasar-frontend/src/css/app.scss` เป็น shared dashboard style system
- เพิ่ม `:focus-visible` ให้ปุ่ม/ลิงก์/actionable controls
- ทำ lock/unlock flow ให้ใช้ dialog เดียวกัน พร้อมเหตุผล (ทั้ง `/dashboard` และ `/attendance-dashboard`)
- เติม loading/empty/error guidance สำหรับ table และ mobile cards
- ปรับ microcopy ให้เป็นไทยคงที่ และใช้ terminology เดียวกัน
- ตรวจ type safety ผ่าน `vue-tsc` แล้ว (หลัง Iteration 2)

---

### Checklist

| # | รายการ | File | Priority | Status |
|---|--------|------|----------|--------|
| 1 | แยก visual personality ของ `/dashboard` vs `/attendance-dashboard` (ไม่ใช่แค่เปลี่ยน gradient) | `IndexPage.vue`, `AttendanceDashboardPage.vue` | 🔴 | [x] ✅ Done |
| 2 | ลดจำนวน action ปุ่มในแต่ละ row: เหลือ primary 1 + secondary menu | `IndexPage.vue`, `AttendanceDashboardPage.vue` | 🔴 | [x] ✅ Done |
| 3 | ย้าย style ซ้ำไป shared token/utility (`hero`, `stat`, `table action`) | `src/css/app.scss` + page styles | 🟠 | [x] ✅ Done |
| 4 | ปรับสถานะ/สีให้สื่อความหมายโดยไม่พึ่งสีอย่างเดียว (เพิ่ม text semantics) | `IndexPage.vue`, `AttendanceDashboardPage.vue` | 🟠 | [x] ✅ Done |
| 5 | เพิ่ม keyboard focus-visible ที่ actionable controls หลัก | `app.scss`, page scoped styles | 🟠 | [x] ✅ Done |
| 6 | ทำ lock/unlock flow ให้ consistent: ใช้ dialog เดียวกัน + reason ที่ชัดเจน | `AttendanceDashboardPage.vue` (+ ใช้ pattern จาก `IndexPage.vue`) | 🔴 | [x] ✅ Done |
| 7 | ตรวจ empty/loading/error states ของ table และ mobile card ให้มี guidance ชัด | `IndexPage.vue`, `AttendanceDashboardPage.vue` | 🟡 | [x] ✅ Done |
| 8 | ปรับ microcopy ให้ภาษาคงที่ (ไทย/อังกฤษ) และ terminology เดียวกันทั้งระบบ | ทั้งสองหน้า + labels/options | 🟡 | [x] ✅ Done |

---

### Completed Workstreams

#### WS2: Interaction Simplification
- เปลี่ยน row actions เป็น progressive disclosure สำเร็จ
- รองรับ desktop + mobile ด้วย pattern เดียวกันแล้ว

#### WS3: Systemization & Consistency
- ย้าย style ซ้ำไป shared dashboard styles ใน `app.scss` แล้ว
- ลด hard-coded style รายหน้า เหลือเฉพาะ page identity

#### WS4: Accessibility & State Quality
- เพิ่ม `:focus-visible` และสถานะข้อความที่ไม่พึ่งสีอย่างเดียว
- เติม empty/loading/error guidance ครบทั้ง table และ mobile

---

### Files Updated

| File | Action |
|---|---|
| `quasar-frontend/src/pages/IndexPage.vue` | action menu, unified lock/unlock dialog, loading/empty/error guidance, microcopy |
| `quasar-frontend/src/pages/AttendanceDashboardPage.vue` | action menu, unified lock/unlock dialog, loading/empty/error guidance, microcopy |
| `quasar-frontend/src/css/app.scss` | shared dashboard style system + focus-visible tokens/utilities |

---

### Acceptance Criteria (Final)

- ผู้ใช้แยกบริบทสองหน้าได้ทันทีโดยไม่ต้องอ่านละเอียด
- บน mobile ยังทำงานครบ โดยไม่ซ่อนความสามารถสำคัญ
- จำนวนปุ่มต่อ row ลดลง แต่ความสามารถไม่หาย
- ผ่าน `vue-tsc` และไม่เกิด regression functional flow
- สถานะสำคัญและปุ่มหลักใช้งานได้ผ่าน keyboard/focus อย่างชัดเจน

---

### Estimated Time (Remaining)

| Workstream | Time |
|---|---|
| **Total Remaining** | **0 hrs (Phase 9 done)** |

---

## Commands to Run

### Backend (NestJS)
```bash
cd nest-backend
npm install qrcode @types/qrcode  # ✅ Already installed
npm run build
npm run start:dev
```

### Frontend (Quasar)
```bash
cd quasar-frontend
npm install
npm run dev
# or
npx quasar dev
```

---

## Notes

- Phase 1 implementation includes QR code generation for delegation
- The delegation validates max_delegation_depth before allowing delegation
- Parent link is marked as 'DELEGATED' after successful delegation
- New link gets delegation_depth + 1
