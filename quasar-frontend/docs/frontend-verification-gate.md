# Frontend Verification Gate

เอกสารนี้ใช้ปิด verification หลัง refactor หลักของ `quasar-frontend` โดยแยกสิ่งที่ตรวจได้อัตโนมัติออกจากสิ่งที่ยังต้อง manual test

## Automated Checks

รันจาก `quasar-frontend/`

```bash
npm run lint
npm run build
npm run verify:refactor-boundaries
npm run verify:routes
npm run verify:auth-regression
```

สิ่งที่ automated checks ครอบ:

- ไม่มี direct `api.*` หรือ `fetch(...)` ค้างใน `pages/layouts/components/composables`
- ไม่มี hardcoded `localhost:3000` ค้างใต้ `src`
- storage access อยู่เฉพาะ helper/composable กลางที่อนุญาต
- route หลักและ status routes ยังอยู่ path เดิม และ route ที่ควร `hideNav` ยัง `hideNav`
- normal login, magic login, และ auth header precedence ไม่ regress หลังเพิ่ม `Mock ThaID`

## Manual Checks

### 1. Import Flow

route:

- `/import-data`

ขั้นต่ำที่ต้องเช็ก:

- upload CSV happy path
- check schools flow
- validation เมื่อไฟล์ไม่ถูกต้อง
- validation เมื่อ mapping ไม่พอ
- missing school flow และ submit พร้อม manual school records

### 2. Route / Behavior Smoke

route หลักที่ควรเปิดเช็ก:

- `/`
- `/dashboard`
- `/students`
- `/attendance`
- `/attendance-dashboard`
- `/create`
- `/login-links`
- `/task-detail/:taskId`
- `/task/:token`
- `/task/:token/delegate`
- `/task/:token/report`
- `/task/:token/success`
- `/task/:token/expired`
- `/task/:token/locked?reason=...`
- `/forbidden`
- path ที่ไม่มีจริงสำหรับ 404

ขั้นต่ำที่ต้องเช็ก:

- หน้าเปิดได้
- route ไม่ redirect แปลก
- nav แสดง/ซ่อนถูกหน้า
- loading และ empty state ยังขึ้นถูก
- action หลักยังทำงานได้

### 3. Payload Shape Regression

เปิด DevTools > Network แล้วเช็ก request payload ของ flow หลัก:

- login
- attendance save
- create task
- admin lock/unlock link
- role group create/update
- user create/update
- settings save
- import bulk

สิ่งที่ต้องดู:

- field names ยังตรง backend contract เดิม
- enums/status strings ยังเป็นชุดเดิม
- query params ที่ส่งจาก services ยังตรง path เดิม

### 4. Shared Helper / Composable Regression

flow ที่ควรแตะอย่างน้อย 1 รอบ:

- `useStudentList` consumer:
  - `/students` search
  - `/students` pagination
- `notifyError` consumers:
  - role groups load/save/delete
  - manage users load/delete
  - import check/import error path
- response normalization consumers:
  - students list
  - role groups list
  - roles catalog
  - login links list
  - settings list
  - master-data list

## Gate Definition

Frontend verification gate จะถือว่าผ่านเมื่อ:

- automated checks ผ่านทั้งหมด
- import flow ผ่าน manual test
- route/behavior smoke ผ่าน
- payload shape ที่ยิง backend ไม่ regress
- flow ที่ได้รับผลจาก shared helpers/composables รอบล่าสุดไม่ regress
