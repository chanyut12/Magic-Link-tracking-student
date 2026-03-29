# Magic-Link-tracking-student

ระบบติดตามนักเรียนแบบ monorepo ที่ประกอบด้วย frontend ฝั่ง Quasar/Vue และ backend ฝั่ง NestJS โดยปัจจุบัน codebase ผ่านรอบ refactor หลักแล้วและใช้โครงสร้างแบบ domain-oriented มากกว่าต้นฉบับ prototype เดิม

## Workspace Overview

repo นี้มี 2 แอปหลัก:

- [quasar-frontend](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/quasar-frontend/README.md)
  frontend สำหรับหน้า admin, dashboard, attendance, tasks, login links, student self และ status pages
- [nest-backend](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/README.md)
  backend สำหรับ auth, task domain, attendance, users, students, settings, imports, automation และ migrations

## Current Tech Stack

### Frontend

- Quasar 2
- Vue 3
- TypeScript
- Vue Router
- Axios
- Pinia

### Backend

- NestJS 11
- TypeScript
- TypeORM 0.3
- PostgreSQL
- class-validator / class-transformer
- Jest

## Current High-Level Architecture

### Frontend Direction

frontend ใช้แนวทาง:

- `page` เป็น orchestration layer
- `service` เป็น API boundary
- `composable` ถือ reusable UI/domain logic
- `Pinia` ใช้เฉพาะ shared long-lived state

Pinia ถูกใช้แล้วกับ:

- auth/session
- attendance lookup cache
- case notifications

แต่ page-local form/dialog/search state ยังตั้งใจเก็บไว้ใน composable/local state

### Backend Direction

backend ใช้แนวทาง:

- `controller + dto + focused services + repository`
- query/persistence อยู่ใน data layer ที่ชัด
- auth actor loading แยกออกจาก guards
- database ใช้ `TypeORM DataSource + migrations`
- ไม่ใช้ runtime schema bootstrap แล้ว

## Main Business Flows

flow หลักที่มีอยู่จริงในระบบตอนนี้:

- normal login ผ่าน `/admin-access`
- magic login ผ่าน login links
- Mock ThaID student login
- attendance classroom workflow
- attendance dashboard / attendance tasks
- student follow-up / case dashboard
- task delegation / guest report / review workflow
- student self attendance view ผ่าน `/my-attendance`

## Repository Structure

```text
Magic-Link-tracking-student/
  README.md
  REFACTOR_PLAN.md
  quasar-frontend/
  nest-backend/
  docs/
  scripts/
  db/
  markdown/
  docker-compose.yml
  render.yaml
```

โฟลเดอร์ที่ควรรู้:

- `REFACTOR_PLAN.md`
  แผน refactor หลักและ checklist ของงานที่ทำไปแล้ว
- `docs/`
  เอกสารประกอบระดับ repo
- `scripts/`
  scripts ระดับ root
- `db/`
  ข้อมูล/ไฟล์ฐานข้อมูลระดับเก่าใน repo เดิม

## Quick Start

### 1. Install dependencies

frontend:

```bash
cd quasar-frontend
npm install
```

backend:

```bash
cd nest-backend
npm install
```

### 2. Prepare backend database

จาก `nest-backend/`

```bash
npm run bootstrap:verify-parity
npm run migration:run
```

### 3. Start backend

จาก `nest-backend/`

```bash
npm run start:dev
```

### 4. Start frontend

จาก `quasar-frontend/`

```bash
npm run dev
```

## Current Development Workflow

เวลาพัฒนาใน repo นี้ แนะนำลำดับแบบนี้:

1. backend contract / DTO / service / repository ให้เสร็จก่อนถ้ากระทบ API
2. frontend types และ services
3. frontend composables
4. page/components
5. verification scripts
6. lint/build/manual smoke

## Verification Commands

### Frontend

จาก `quasar-frontend/`

```bash
npm run lint
npm run build
npm run verify:refactor-boundaries
npm run verify:routes
npm run verify:auth-regression
npm run verify:pinia-migration
npm run verify:frontend-gate
```

### Backend

จาก `nest-backend/`

```bash
npm run build
npm run lint
npm run test
npm run bootstrap:verify-parity
npm run migration:show
```

## Auth Notes

ระบบตอนนี้รองรับหลาย auth flow:

- normal login
- magic login
- Mock ThaID student login

ข้อสำคัญ:

- student login ตอนนี้ยังเป็น `Mock ThaID`
- ใช้ `PersonID_Onec` เพื่อ match กับ `student_term`
- ออก `virtual_auth_token` สำหรับ student virtual session

## Important Docs

เอกสารที่ควรเปิดคู่กัน:

- [REFACTOR_PLAN.md](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/REFACTOR_PLAN.md)
- [quasar-frontend/README.md](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/quasar-frontend/README.md)
- [nest-backend/README.md](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/README.md)
- [nest-backend/docs/typeorm-transition.md](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/docs/typeorm-transition.md)
- [quasar-frontend/docs/frontend-verification-gate.md](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/quasar-frontend/docs/frontend-verification-gate.md)

## Current Status

ตามสภาพ codebase ปัจจุบัน:

- frontend refactor หลักปิดแล้ว
- backend refactor หลักปิดแล้ว
- Mock ThaID phase ปิดแล้ว
- Deferred Pinia Migration ปิดแล้ว

สิ่งที่เหลือในแผนหลักตอนนี้เป็นงานลักษณะ verification/audit checklist มากกว่า phase feature ใหม่

## Notes For Contributors

- อย่าเพิ่ม direct API call จาก page/layout/component ถ้ายังควรวิ่งผ่าน service
- อย่าเพิ่ม direct storage access ใหม่ใน UI layer ถ้ายังควรอยู่ใน helper/store/composable กลาง
- ถ้าเพิ่ม shared long-lived state ให้ประเมินก่อนว่าจะอยู่ composable หรือ Pinia
- ถ้าเปลี่ยน schema backend ให้ทำผ่าน migration
- อย่าเอา runtime schema bootstrap กลับเข้าระบบ
