# Backend Foundation Inventory

## Scope

เอกสารนี้สรุปสถานะ `Phase 1: Platform Foundation` หลังรอบที่เพิ่ม typed config, global validation/filter, และ shared actor primitives

## Inventory Summary

### Endpoints / modules ที่ยังมี `any` หรือ legacy contracts

- runtime HTTP modules ที่อยู่ใน path หลักของระบบถูกย้ายเข้า DTO + controller + service + repository pattern แล้ว
- scripts กลุ่ม import/migration เก่า เช่น [import-excel.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/scripts/import-excel.ts) ยังใช้ `any` ได้ เพราะยังไม่ใช่ runtime HTTP path

### จุดที่ยังมี manual validation

- [submission.controller.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/task/submission.controller.ts) ยัง parse multipart fields เอง เพราะ payload มาจาก mixed text/file form
- [imports.controller.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/imports/imports.controller.ts) ยัง validate `file` presence เอง ซึ่งเป็นพฤติกรรมที่เหมาะกับ upload endpoint
- service/policy หลายตัว เช่น [attendance-write.service.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/attendance/attendance-write.service.ts), [task-policy.service.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/task/task-policy.service.ts), [users-policy.service.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/users/users-policy.service.ts) ยังมี domain validation ที่ควรอยู่ใน service/policy ต่อไป ไม่ควรย้ายไป controller

### จุดที่ยังมี manual `HttpException` mapping

- [task.controller.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/task/task.controller.ts), [delegation.controller.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/task/delegation.controller.ts), [case.controller.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/task/case.controller.ts), และ [submission.controller.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/task/submission.controller.ts) ยัง map status เองบาง route เพราะ route contract เดิมต้องแยก `404/410/403/400` ตาม business result

### จุดที่ยังโหลด config/runtime เอง

- runtime HTTP layer ถูกย้ายเข้า typed config แล้วที่ [app.config.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/config/app.config.ts), [email.config.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/config/email.config.ts), และ [database.config.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/config/database.config.ts)
- scripts ใต้ `src/scripts/**` ยังใช้ `dotenv.config(...)` และ `process.env` ตรงต่อไปได้ชั่วคราว เพราะไม่ใช่ app runtime path

### จุดที่ guard เคยแบก actor loading / permission resolution

- current state: actor loading ถูกย้ายมาที่ [auth-actor.service.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/auth/auth-actor.service.ts) แล้ว และ guard เหลือบทบาท auth/authz เป็นหลักใน [auth.guard.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/auth/auth.guard.ts)
- `students` module ถูกย้ายเข้า `AuthGuard + CurrentUser` แล้วที่ [students.controller.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/students/students.controller.ts)

## Responsibility Rules

- `controller`
  รับผิดชอบ route binding, decorators, DTO contracts, และเรียก service เท่านั้น
- `guard`
  รับผิดชอบ authentication/authorization; ห้าม query domain data เพิ่มนอก actor loading path กลาง
- `service`
  รับผิดชอบ orchestration/use case และ domain validation ที่ต้องรู้กติกาธุรกิจ
- `repository`
  รับผิดชอบ persistence, query composition, และ transaction helpers
- `config`
  runtime config ต้องผ่าน `ConfigModule` และ typed config functions เท่านั้น

## Response Serialization / Interceptor Policy

- backend นี้มี response contract เดิมหลายรูปแบบ เช่น `data envelope`, plain array, และ task guest routes ที่มี custom error semantics
- จึงยัง `ไม่` ควรบังคับ global response envelope/interceptor กับทุก route เพราะจะเสี่ยงทำให้ frontend drift
- อนุญาต interceptor เฉพาะกรณีที่มี response mapping ซ้ำจริงใน module ใหม่หรือ module ที่กำลัง refactor อยู่
- ถ้า route เดิมมี custom status contract อยู่แล้ว ให้ controller map เฉพาะ status semantics นั้นต่อไป และปล่อย unknown errors ให้ global exception filter จัดการ

## Next Priority After Foundation

1. ทำ manual/API smoke หลัง Phase 4 กับ flows หลักที่แตะ DB read/write
2. ตัดสินใจว่าจะย้าย scripts ใต้ `src/scripts/**` ออกจาก direct `pg` และ `any` หรือคงไว้เป็น tooling debt
3. ถ้าจะยกระดับต่อ ให้เริ่มจากแปลง raw SQL บางก้อนเป็น TypeORM repository/query builder แบบค่อยเป็นค่อยไป
