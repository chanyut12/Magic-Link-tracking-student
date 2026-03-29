# quasar-frontend

Frontend ของระบบติดตามนักเรียน พัฒนาด้วย Quasar + Vue 3 + TypeScript โดยโครงสร้างปัจจุบันเน้น `service + composable + component` และใช้ Pinia เฉพาะ shared long-lived state

## Current Stack

- Quasar 2
- Vue 3
- TypeScript
- Vue Router
- Axios
- Pinia
- ESLint
- Prettier
- vite-plugin-checker

## Current Structure

โครงสร้างหลักใต้ `src/`

```text
src/
  boot/           app bootstrapping เช่น axios, pinia
  components/     shared UI components แยกตาม domain
  composables/    page logic และ reusable state logic
  constants/      permissions, menu, shared constants
  css/            global styles
  layouts/        app layouts
  pages/          route-level pages
  router/         route definitions และ auth/permission guard
  services/       API layer และ backend contracts
  stores/         Pinia stores สำหรับ shared long-lived state
  types/          shared TypeScript contracts
  utils/          pure helpers / mappers / presenters
```

โฟลเดอร์ domain component ที่มีใช้อยู่จริง:

- `src/components/attendance`
- `src/components/dashboard`
- `src/components/status`
- `src/components/students`
- `src/components/task`
- `src/components/users`

## State Management Policy

ปัจจุบันใช้แนวทาง `composable-first, Pinia-where-needed`

ใช้ Pinia แล้วใน state ที่เป็น shared และอยู่นานกว่าหน้าเดียว:

- `src/stores/auth-session-store.ts`
- `src/stores/attendance-lookup-store.ts`
- `src/stores/case-notifications-store.ts`

และยังคงห่อผ่าน composable เดิมเพื่อไม่บังคับให้ consumer แก้เยอะ:

- `src/composables/useAuthSession.ts`
- `src/composables/useAttendanceFilters.ts`
- `src/composables/useCaseNotifications.ts`
- `src/composables/useUserStore.ts`

state ที่ยังตั้งใจคงไว้ใน composable/local state:

- form state ของหน้าเดียว
- dialog open/close state
- page-local search/filter/pagination
- loading/error state ของ action เดียว

## Development Pattern

### 1. Pages

หน้าใน `src/pages` ควรเหลือหน้าที่ระดับ orchestration เป็นหลัก:

- bind UI sections
- เรียก composables
- wire events
- route awareness

หน้าไม่ควรยิง `api.*` หรือ `fetch(...)` ตรง

### 2. Services

`src/services` เป็น backend boundary:

- ส่ง request
- unwrap response
- normalize backend payload
- คง endpoint contract เดิม

services ไม่ควรถือ UI state

### 3. Composables

`src/composables` ใช้สำหรับ:

- page state
- reusable async flow
- domain-specific UI logic
- state facade เหนือ Pinia stores

ถ้า logic ใช้หลายหน้าจริงและ state ควรอยู่ยาวกว่าหนึ่งหน้า ค่อยพิจารณาย้ายส่วน state ไป Pinia

### 4. Stores

`src/stores` ใช้เฉพาะ shared long-lived state เช่น:

- auth/session
- shared lookup cache
- layout-shared notifications

ไม่ใช้ Pinia กับทุก state ในระบบ

### 5. Types and Utils

- `src/types` สำหรับ shared contracts ที่ใช้ข้ามไฟล์
- `src/utils` สำหรับ pure functions, formatters, presenters, normalizers

local type ที่ใช้เฉพาะไฟล์เดียวสามารถอยู่ในไฟล์นั้นได้

## Important Flows In Frontend

flow หลักที่มีอยู่จริงตอนนี้:

- normal login ผ่าน `/admin-access`
- magic login ผ่าน `/login/magic/:token`
- Mock ThaID student login ผ่าน `/admin-access`
- student self route ผ่าน `/my-attendance`
- attendance workflows ผ่าน `/attendance` และ `/attendance-dashboard`
- login link/task flows ผ่าน `/create`, `/login-links`, `/task/:token`, `/task/:token/report`, `/task/:token/delegate`

## Dev Commands

ติดตั้ง dependencies:

```bash
npm install
```

เริ่ม dev server:

```bash
npm run dev
```

ถ้าต้องการใช้ Quasar dev เดิมโดยตรง:

```bash
npm run dev:plain
```

lint:

```bash
npm run lint
```

format:

```bash
npm run format
```

production build:

```bash
npm run build
```

## Verification Tools

มี script สำหรับตรวจ regression/boundary ที่ใช้จริงใน repo:

```bash
npm run verify:refactor-boundaries
npm run verify:routes
npm run verify:auth-regression
npm run verify:pinia-migration
npm run verify:frontend-gate
```

ความหมายโดยย่อ:

- `verify:refactor-boundaries`
  ตรวจว่าไม่มี direct API call/hardcoded localhost/storage access หลุดนอก boundary ที่กำหนด
- `verify:routes`
  ตรวจ route contracts สำคัญ
- `verify:auth-regression`
  ตรวจ normal login / magic login / auth header precedence
- `verify:pinia-migration`
  ตรวจว่า Pinia migration ที่วางไว้ยังไม่ regress
- `verify:frontend-gate`
  รัน verification หลักของ frontend gate แบบรวม

## Environment Notes

env ที่ frontend ใช้อยู่หลัก ๆ:

- `API_BASE_URL`
- `BACKEND_URL`
- `THAID_MODE`

พฤติกรรมสำคัญ:

- ถ้าไม่ได้กำหนด `THAID_MODE` และกำลังรัน dev mode จะ default เป็น `mock`
- axios boot จะ resolve backend host ให้เองใน local/private network

## Recommended Workflow

เวลาพัฒนา feature ใหม่ แนะนำลำดับนี้:

1. เพิ่ม/ปรับ types
2. เพิ่ม/ปรับ service
3. เพิ่ม/ปรับ composable
4. แยก/ปรับ component ถ้ามี UI pattern ซ้ำ
5. ให้ page เหลือ orchestration
6. ถ้า state ใช้ข้ามหลาย route ค่อยพิจารณา Pinia
7. รัน `lint`, `build`, และ verification scripts ที่เกี่ยวข้อง

## Notes

- โครงสร้างปัจจุบันไม่ใช่ `page ทำทุกอย่างเอง` แล้ว
- ไม่แนะนำเพิ่ม direct storage access ใหม่ใน page/component
- ไม่แนะนำยิง backend ตรงจาก page/layout/component/composable ที่ควรวิ่งผ่าน service
- ถ้าจะเพิ่ม shared state ใหม่ ให้ประเมินก่อนว่าเหมาะกับ local state, composable, หรือ Pinia
