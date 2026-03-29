# Quasar Frontend Refactor

## Progress Update

### 2026-03-27

รอบ implement เริ่มจาก `Wave A: Auth / Session Group` แบบแคบก่อน เพื่อวาง shared foundation ให้รอบถัดไปใช้ต่อได้

ของที่ทำเสร็จแล้วถึงตอนนี้:

- สร้าง `src/types/auth.ts` สำหรับ `AuthUser`, auth session contracts และ magic login response contracts
- สร้าง `src/services/authService.ts` เพื่อรวม login, profile refresh, magic login verify, request OTP และ verify OTP
- สร้าง `src/composables/authSessionState.ts` เป็น auth/session source of truth กลางสำหรับ storage handling และ magic session token helpers
- สร้าง `src/composables/useAuthSession.ts` สำหรับ session load/save/clear/refresh
- ปรับ `src/composables/useUserStore.ts` ให้เป็น wrapper บน auth session กลาง แทนการอ่าน/เขียน storage เอง
- ปรับ `src/boot/axios.ts` ให้ inject auth headers จาก auth session source of truth เดียว
- ปรับ `src/router/index.ts` ให้ router guard อ่าน auth/admin access จาก auth session source of truth เดียว
- ปรับ `AdminAccessPage` ให้ใช้ `authService` + `useAuthSession`
- ปรับ `MagicLoginPage` ให้ใช้ `authService` + `useAuthSession`
- ปรับ `MainPage` ให้เลิกอ่าน `sessionStorage/localStorage` ตรง และใช้ `useUserStore`
- สร้าง `src/types/task.ts` สำหรับ task access contracts ที่ใช้ร่วมใน guest/report flow
- สร้าง `src/services/taskAccessService.ts` สำหรับ task token access, OTP, history, students และ submit flows
- สร้าง `src/composables/useMagicTaskSession.ts` สำหรับ magic session token state/helpers ของ task flow
- ปรับ `TaskGuestPage` ให้ย้าย task access API calls ออกจาก page ไปใช้ `taskAccessService` และ `useMagicTaskSession`
- ปรับ `ReportPage` ให้เลิกใช้ direct `fetch(...)` และย้ายไปใช้ `taskAccessService`
- สร้าง `src/types/attendance.ts` สำหรับ `AttendanceFilter` และ lookup contracts กลาง
- สร้าง `src/services/attendanceLookupService.ts` สำหรับ locations, schools, grade levels และ rooms
- สร้าง `src/composables/useAttendanceFilters.ts` สำหรับ dependent filters และ lookup state กลาง
- เพิ่ม `src/utils/attendanceLookupOptions.ts` สำหรับ map school/grade lookup ไปเป็น option shape ที่หลายหน้าใช้ร่วมกัน
- ปรับ `StudentsPage` ให้เริ่มใช้ `useAttendanceFilters` + `attendanceLookupService` เป็น pilot ของ lookup flow
- ปรับ `AttendancePage` ให้ย้าย lookup/filter state ไปใช้ `useAttendanceFilters` + `attendanceLookupService` โดยยังคง history polling และ attendance submit flow เดิมไว้ก่อน
- ปรับ `LoginLinksPage` ให้ใช้ shared attendance lookup loaders สำหรับ scope dialog แทนการยิง lookup API ตรงใน page
- ปรับ `ManageUserPage` ให้ใช้ shared attendance lookup loaders สำหรับ scope form แทนการยิง lookup API ตรงใน page
- ปรับ `CreateTaskPage` ให้ใช้ shared attendance lookup layer ทั้ง attendance target filters และ login scope room/school loaders โดยยังคง submit/business logic เดิมไว้
- ปรับ `AttendanceDashboardPage` ให้ใช้ shared attendance lookup layer สำหรับ school/grade/room filters และให้ task endpoint คืน school scope data ที่หน้าใช้งานได้จริง
- แก้ regression ที่ `/attendance-dashboard` ดึงงานข้ามประเภทจนเปิดลิงก์ไป flow `VISIT` ได้ โดยบังคับ endpoint ให้คืนเฉพาะ `ATTENDANCE` และถอด placeholder/sentinel `WHERE 1=1` ออกจาก runtime queries/helpers ที่เกี่ยวข้อง
- สร้าง `src/types/student.ts` และ `src/services/studentService.ts` สำหรับ student list/detail domain contracts และ API access กลาง
- สร้าง `src/composables/useStudentList.ts` สำหรับ student list state, search และ pagination
- แยก `StudentsPage` ให้ใช้ `studentService`/`useStudentList` และดึง table/mobile list ออกเป็น component ย่อย
- ปรับ `StudentInformationPage` ให้ใช้ `studentService` และ shared student types แทน direct `api.get(...)` กับ inline interfaces
- เพิ่ม helper cascade reset ใน `src/composables/useAttendanceFilters.ts` และปรับ `StudentsPage`/`AttendancePage`/`CreateTaskPage` ให้ใช้ flow เดียวกันตอน reset province/district/sub-district
- ปรับ `studentService.getStudentAttendanceSummary()` ให้คำนวณ self-attendance summary จาก endpoint ที่มีใช้อยู่จริง (`/api/students/attendance/:id`) แทนการพึ่ง endpoint ที่ยังไม่มีใน backend
- ปรับ `StudentSelfPage` ให้ใช้ `studentService`, shared student types และ `studentPresentation` utilities แทน direct `api.get(...)` กับ inline interfaces
- สร้าง `src/services/attendanceService.ts` สำหรับ attendance students/history/save/task list access กลาง
- สร้าง `src/composables/useAttendanceHistory.ts`, `src/composables/useAttendanceSubmission.ts`, และ `src/composables/useAttendanceDashboardData.ts`
- ปรับ `AttendancePage` ให้ย้าย history fetching และ attendance submit flow ออกไปใช้ shared composables/service
- ปรับ `AttendanceDashboardPage` ให้ย้าย task list/dashboard fetching ไปใช้ shared composable และดึง summary cards/status badge/row actions ออกเป็น component ใต้ `src/components/attendance`
- สร้าง `src/services/taskService.ts`, `src/utils/taskForm.ts`, และ `src/utils/taskPresentation.ts` สำหรับ task creation/list/admin lifecycle, shared form model/payload mapper, และ public-link presentation helpers
- สร้าง `src/composables/useTaskFormFlow.ts`, `src/composables/useLoginTaskForm.ts`, และ `src/composables/useLoginLinkDialogs.ts`
- ขยาย `src/services/taskAccessService.ts` ให้รวม delegate flow และปรับ `DelegatePage` ให้เลิกยิง task access API ตรง
- ปรับ `CreateTaskPage` ให้ย้าย task creation result/submission flow ไปใช้ `taskService` + `useTaskFormFlow` และดึง login role/scope/permission flow ไป composable กลาง
- ปรับ `LoginLinksPage` ให้ย้าย create/list/admin lifecycle ไปใช้ `taskService`, ใช้ `useTaskFormFlow` สำหรับ result state และใช้ `useLoginTaskForm` สำหรับ shared role/scope/permission flow
- สร้าง `src/types/case.ts`, `src/types/stats.ts`, `src/services/caseService.ts`, `src/services/statsService.ts` และ `src/utils/casePresentation.ts` สำหรับ case/detail/review contracts, dashboard stats read-model และ shared presentation helpers
- สร้าง `src/composables/useCaseDashboardData.ts`, `src/composables/useOverviewDashboardData.ts`, `src/composables/useCaseNotifications.ts`, `src/composables/useCaseTaskDetail.ts`, `src/composables/useTaskLinkAdminDialog.ts` และ `src/composables/caseNotificationState.ts`
- เพิ่ม shared UI สำหรับ dashboard/reporting ด้วย `src/components/dashboard/DashboardMetricCard.vue`, `src/components/dashboard/CaseDashboardSummaryCards.vue`, `src/components/dashboard/OverviewSummaryCards.vue` และ `src/components/task/TaskLinkAdminDialog.vue`
- ปรับ `MainPage` ให้ย้าย overview stats fetching ไป `statsService`/`useOverviewDashboardData` และแยก summary cards ออกเป็น shared dashboard widgets
- ปรับ `IndexPage` ให้ย้าย case list + stats fetching ไป `useCaseDashboardData`, ย้าย admin task-link dialog/action ไป shared composable/component, และให้ date range filter ใช้ logic กลาง
- ปรับ `TaskDetailPage` ให้ย้าย task chain/case review/case tasks/new-link flow ไป `caseService` + `useCaseTaskDetail`
- ปรับ `MainLayout` ให้ย้าย case notification polling/state/storage handling ไป `useCaseNotifications` และเลิกอ่าน `localStorage` ตรงใน layout
- ปรับ `AttendanceDashboardPage` ให้เลิกยิง admin task-link action ตรงใน page และใช้ shared admin dialog/action flow เดียวกับ `IndexPage`
- ผู้ใช้ manual smoke test flow `login / logout / session restore / magic login / task guest-report` แล้วผ่าน
- รัน local smoke check ผ่านสำหรับ `StudentsPage` filter cascade, `AttendancePage` filter cascade, `StudentInformationPage`, และ `StudentSelfPage`
- รัน local API smoke check ผ่านสำหรับ `AttendancePage` history, `AttendancePage` save attendance, และ `AttendanceDashboardPage` summary เมื่อวันที่ 27 มีนาคม 2026 ผ่าน backend local ด้วย authenticated admin context
- รัน local API smoke check ผ่านสำหรับ `LoginLinksPage` create/list/admin lock/unlock และ `DelegatePage` delegate เมื่อวันที่ 27 มีนาคม 2026 ผ่าน backend local
- รัน local API smoke check ผ่านสำหรับ `/api/cases`, `/api/stats`, `/api/stats/overview`, `/api/tasks/:taskId/chain`, `/api/cases/:caseId/tasks`, และ `/api/cases/:caseId/reviews` เมื่อวันที่ 27 มีนาคม 2026 ผ่าน backend local ด้วย authenticated admin context
- ตรวจแล้ว `npm run lint` ผ่าน
- ตรวจแล้ว `npm run build` ผ่าน

### 2026-03-28

รอบ implement นี้ปิด `Wave G: User / Role / Settings Group`, `Wave H: Import Group`, และ `Wave I: Static / Status / Final Polish` แล้ว

- สร้าง `src/types/settings.ts`, `src/types/user.ts`, `src/services/roleGroupService.ts`, `src/services/settingsService.ts`, `src/services/masterDataService.ts`, และ `src/services/userService.ts`
- สร้าง `src/composables/useRoleGroupsPage.ts`, `src/composables/useSystemSettingsPage.ts`, `src/composables/useManageUsersPage.ts`, และ `src/composables/useUserScopeForm.ts`
- สร้าง `src/components/users/UsersTable.vue` และ `src/components/users/UserFormDialog.vue`
- ปรับ `RoleGroupsPage` ให้ย้าย role group CRUD/state/permission menu logic ไป shared service + composable
- ปรับ `SystemSettingsPage` ให้ย้าย settings/master-data CRUD และ tab/page state ไป shared service + composable
- ปรับ `ManageUserPage` ให้เหลือ orchestration ระดับ page, แยก user table และ user form dialog ออก component, และย้าย scope/permission flow ไป `useUserScopeForm`
- ตรวจแล้ว `RoleGroupsPage`, `SystemSettingsPage`, และ `ManageUserPage` ไม่ยิง `api` หรือ `fetch(...)` ตรงใน page แล้ว
- ผู้ใช้ manual CRUD test flow `RoleGroupsPage`, `SystemSettingsPage`, และ `ManageUserPage` แล้วผ่าน
- สร้าง `src/types/import.ts`, `src/services/importService.ts`, `src/composables/useImportDataPage.ts`, `src/utils/importColumns.ts`, และ `src/utils/importFileParser.ts`
- ปรับ `ImportDataPage` ให้ย้าย upload/check-school/import state/result mapping ออกไปใช้ shared import layer
- ลบ hardcoded `http://localhost:3000` และ direct `fetch(...)` ออกจาก `ImportDataPage`
- ตรวจแล้ว `quasar-frontend/src` ไม่เหลือ `fetch(...)` หรือ hardcoded `localhost:3000`
- สร้าง `src/components/status/StatusPageView.vue` สำหรับ shared full-page status UI ของ `Success`, `Expired`, `Locked`, `Forbidden`, และ `404`
- ปรับ `SuccessPage`, `ExpiredPage`, `LockedPage`, `ForbiddenPage`, และ `ErrorNotFound` ให้เหลือ page-level config บน shared status component
- ปรับ `routes.ts` ให้ `/forbidden` ใช้ `hideNav: true` และอยู่ใน family เดียวกับ status pages อื่น
- สร้าง `src/types/role.ts` เพื่อแยก role contracts ออกจาก `constants/permissions.ts`
- สร้าง shared helpers ใน `src/utils/api.ts` และ `src/utils/notify.ts` สำหรับ request params, response normalization, และ error-to-notify mapping
- สร้าง generic composables `useAsyncState`, `usePaginationState`, และ `useSearchFilterState`
- ปรับ `useStudentList` ให้ใช้ generic async/search/pagination composables เป็น pilot ของ shared page state pattern
- ปรับ services หลักบางตัวให้ใช้ shared response normalization และ params helpers กลาง
- สร้าง `quasar-frontend/scripts/verify-refactor-boundaries.mjs` และ `quasar-frontend/scripts/verify-route-contracts.mjs` สำหรับ automated verification gate
- เพิ่ม `npm run verify:refactor-boundaries`, `npm run verify:routes`, และ `npm run verify:frontend-gate`
- สร้าง `quasar-frontend/docs/frontend-verification-gate.md` เพื่อสรุป automated checks และ manual checks ที่ยังต้องรัน
- ตรวจแล้ว `npm run verify:refactor-boundaries` ผ่าน
- ตรวจแล้ว `npm run verify:routes` ผ่าน
- ผู้ใช้ manual verification gate สำหรับ `ImportDataPage`, route/runtime smoke, และ payload regression check แล้วผ่าน
- implement `Phase 5: Mock ThaID + virtual student session` แล้ว โดยเพิ่ม backend mock endpoint, signed `x-virtual-auth` flow, login UI ฝั่ง `AdminAccessPage`, และ own-only enforcement สำหรับ student virtual session บน `students` APIs
- ตรวจแล้ว targeted backend `eslint` สำหรับ `src/auth/**` และ `src/students/**` ผ่าน
- ตรวจแล้ว `npm run lint` ผ่าน
- ตรวจแล้ว `npm run build` ผ่าน

สิ่งที่ยังเหลือใกล้สุดหลังรอบนี้:

- frontend verification gate ปิดแล้ว
- `Phase 5: Mock ThaID + virtual student session` implement แล้ว แต่ยังควร manual verify
- หลังผ่าน manual verify ของ Phase 5 ค่อยเริ่ม `Deferred Pinia Migration Pass`

## Summary

แนวทางที่เหมาะกับ `quasar-frontend` คือ `incremental refactor` ไม่ใช่ rewrite ทั้งระบบในรอบเดียว เพราะตอนนี้หลายหน้าเป็นลักษณะ page เดียวรับผิดชอบทั้ง UI, data fetching, data mapping, dialog state, session handling และ submit logic พร้อมกัน ทำให้แก้ยากและเสี่ยง regression สูง

หลังตรวจโครงสร้าง `src/pages`, `src/layouts`, `src/composables`, `src/router`, `src/boot/axios.ts` และ endpoint usage จริง แผน frontend ควรเปลี่ยนจากการคิดแบบ service-list ก่อน ไปเป็น `group by หน้าที่เชื่อมโยงกัน` เพื่อให้ refactor shared logic ได้เป็นกลุ่มและลดการย้ายโค้ดซ้ำ

ข้อเท็จจริงที่แผนต้องสะท้อน:

- หน้าใหญ่หลายหน้าแบกหลาย concern พร้อมกัน เช่น `ManageUserPage`, `CreateTaskPage`, `RoleGroupsPage`, `LoginLinksPage`, `AttendancePage`, `TaskDetailPage`, `StudentsPage`
- มี API call ฝังใน page/layout/composable จำนวนมาก
- shared auth/session logic กระจายอยู่ใน `useUserStore`, `router/index.ts`, `boot/axios.ts`, `AdminAccessPage`, `MagicLoginPage`
- `MainPage` ยังอ่าน `sessionStorage/localStorage` เองและมี user presentation logic ซ้ำกับ auth source of truth
- attendance lookups และ dependent filters ซ้ำหลายหน้า
- `/dashboard` และ `/attendance-dashboard` เป็น aggregate/reporting use case ไม่ควรถูกรวมไว้ใน `taskService` ปลายทาง
- `IndexPage` และ `AttendanceDashboardPage` ยังมี admin task-link actions ปะปนอยู่กับ dashboard/reporting logic
- repo ยังไม่มี `src/stores` จริง จึงควรใช้ `composables-first` ก่อน Pinia

## Baseline Inventory Snapshot

inventory นี้คือ baseline ที่ใช้ขับ refactor รอบ frontend ก่อนแยก waves:

- หน้าและ layout ที่เคยมี API call ฝังอยู่ในไฟล์:
  `AdminAccessPage`, `MagicLoginPage`, `MainPage`, `StudentsPage`, `StudentInformationPage`, `StudentSelfPage`, `AttendancePage`, `AttendanceDashboardPage`, `CreateTaskPage`, `LoginLinksPage`, `TaskGuestPage`, `DelegatePage`, `ReportPage`, `IndexPage`, `TaskDetailPage`, `RoleGroupsPage`, `SystemSettingsPage`, `ManageUserPage`, `ImportDataPage`, `MainLayout`
- จุดที่เคยอ่าน `sessionStorage/localStorage` เอง:
  `MainPage`, `MainLayout`, `router/index.ts`, `boot/axios.ts`, `useUserStore`, `AdminAccessPage`, `MagicLoginPage`
- logic ที่ซ้ำกันหลายหน้า:
  attendance lookups + dependent filters, student list search/pagination, role/scope/permission form flow, task link admin dialog/actions, magic token/session flow, loading/error/notify flow
- หน้า reporting/dashboard ที่เคยมี cross-domain actions ปะปน:
  `IndexPage`, `AttendanceDashboardPage`, `MainLayout`, และบางส่วนของ `TaskDetailPage`

## Naming And Responsibility Conventions

- `src/services/*Service.ts`
  สำหรับ API access, payload/response mapping, และ transport-level normalization
- `src/composables/use*.ts`
  สำหรับ reusable page logic, shared side effects, และ composable stores
- `src/types/*.ts`
  สำหรับ domain contracts ที่ใช้ข้ามหลายไฟล์
- `src/components/**/*.vue`
  สำหรับ reusable/presentational UI blocks
- `src/pages/**/*.vue`
  สำหรับ page composition และ orchestration เท่านั้น
- local interface/type ที่ใช้เฉพาะไฟล์เดียวให้อยู่ใกล้ไฟล์นั้นก่อน
- ถ้า type เป็น public domain contract, API payload/response, หรือ shared model ให้ย้ายไป `src/types`

## Page / Component / Composable Split

- page:
  route-level orchestration, page layout composition, wiring ระหว่าง service/composable/component
- component:
  reusable UI block, table/card/dialog section, หรือ rendering logic ที่ไม่ควรค้างใน page
- composable:
  state machine, submit flow, shared filters/search/pagination, dialog state, polling, auth/session, cross-page side effects
- service:
  API calls, request param mapping, response normalization, transport concerns
- utility:
  pure mapping/formatting/helper functions ที่ไม่ควรถือ Vue reactivity

## Pinia Trigger หลังปิดทุก Wave

state จะถูกพิจารณาย้ายจาก composable ไป Pinia ก็ต่อเมื่อเข้าเงื่อนไขอย่างน้อยหนึ่งข้อ:

- เป็น cross-route shared state ที่หลายหน้าใช้พร้อมกัน
- ต้องมี cache อายุยาวกว่าช่วงชีวิตของ page เดียว
- มี consumer หลายส่วนที่ไม่ควรรู้จักกันตรง ๆ
- ต้องการ devtools/debug story ที่ดีกว่าการเก็บไว้ใน composable
- มี derived state/actions กลางจำนวนมากจน composable เริ่มกลายเป็น global singleton แบบไม่เป็นทางการ

หลักการ refactor รอบนี้:

- แยก `UI` ออกจาก `business/data logic`
- ย้าย API call ออกจาก page/layout ไปอยู่ใน `services`
- ย้าย shared side effects ไปอยู่ใน `composables`
- ใช้แนวทาง `composable-first` สำหรับ shared state ระหว่างรอบ refactor หลัก
- defer การย้าย state ไป `Pinia` ไว้หลังปิดทุก wave และหลัง verification flow หลักผ่านก่อน
- รวม `types` กลางให้ชัดตาม domain
- ออกแบบ service ตาม `frontend domain` ไม่ใช่ตาม backend class ปัจจุบัน
- refactor ทีละกลุ่มหน้าที่เชื่อมโยงกันและ merge ได้ทีละรอบ
- query ใหม่ที่ต้องประกอบเงื่อนไขแบบ dynamic ให้ใช้ condition list/string builder ที่ explicit แทน placeholder/sentinel `WHERE 1=1`

## เป้าหมายโครงสร้าง

โครงสร้างเป้าหมายที่ควรค่อย ๆ ปรับไปหา:

- `src/services` สำหรับ API layer
- `src/composables` สำหรับ reusable page logic และ composable stores
- `src/types` สำหรับ domain contracts
- `src/components` สำหรับ presentational/reusable UI
- `src/pages` ให้เหลือ orchestration และ page composition
- `src/stores` ยังไม่ต้องสร้างทันที

กติกาหลัก:

- page และ layout ไม่ควรยิง `api.get/post/put/delete` หรือ `fetch` ตรงหลัง refactor
- page ไม่ควรมี business logic ก้อนใหญ่
- shared auth/session ต้องมี source of truth เดียว
- shared state ข้ามหลายหน้าระหว่างรอบ refactor หลักให้เริ่มที่ `composable` ก่อน ไม่ข้ามไป `Pinia` ทันที
- lookups เช่น location/school/grade/room ต้องมีแหล่งเดียว
- service ต้องแยกตาม domain ชัดเจน ไม่ใช้ `taskService` เป็นถังรวม
- `fetch('http://localhost:3000/...')` ต้องย้ายมาใช้ axios boot กลางทั้งหมด

### กติกา Vue 3 + Quasar ที่ต้องถือเป็นมาตรฐาน

- component/page/composable ใหม่ใช้ `<script setup lang="ts">`
- form ใช้ `QForm` + `QInput`/`QSelect` + `:rules` เป็น baseline ก่อนทำ manual validation เอง
- table/list ใช้ `QTable` เป็น baseline และต้องมี `row-key`; ถ้าเป็น server-side pagination/sort/filter ให้รวมผ่าน `@request` หรือ composable กลาง
- dialog/notify/loading ให้ใช้ `$q.dialog`, `$q.notify`, `$q.loading` หรือ wrapper กลางที่เรียก Quasar ต่อ ไม่สร้างระบบซ้ำเอง
- page รับผิดชอบ orchestration; rendering block ที่ reuse ได้หรือยาวเกินควรถูกแยกเป็น `src/components`
- state local ของ page/dialog อยู่ใน component; state ที่ reuse ข้ามหลายหน้าอยู่ใน composable; จะเลื่อนเป็น Pinia ก็ต่อเมื่อมี cross-route shared state, cache อายุยาว, หรือ consumer หลายส่วนที่ไม่ควรรู้จักกันตรง ๆ
- การอ่าน/เขียน `sessionStorage/localStorage` ต้องรวมไว้ใน auth/session composable หรือ persistence helper กลาง ไม่กระจายตาม page/layout
- หลีกเลี่ยง `document.querySelector`, direct DOM manipulation และการ override Quasar internals ด้วย `!important`

## ลำดับการทำงาน

### Phase 1: Baseline และวางกติกา

#### Task 1.1: Inventory จุดที่ต้อง refactor

- list หน้าและ layout ที่มี API call ฝังอยู่ในไฟล์
- ระบุหน้าที่มี session/storage logic ฝังอยู่
- ระบุ logic ที่ซ้ำกัน เช่น filters, pagination, dialog state, submit flow, magic token flow
- ระบุหน้า reporting/dashboard ที่มี cross-domain actions ปะปนอยู่ เช่น admin lock flow
- ระบุหน้าใหญ่ที่ควรแยกก่อนตามขนาดและความเชื่อมโยงของ workflow

#### Task 1.2: กำหนด refactor rules

- แยก convention การตั้งชื่อ `service`, `composable`, `types`, `components`
- กำหนด Definition of Done ของแต่ละ page group
- ระบุว่าอะไรอยู่ใน page ได้ และอะไรต้องย้ายออก
- กำหนดกติกาว่าเมื่อไรใช้ composable store และเมื่อไรค่อยเพิ่ม Pinia
- กำหนดเกณฑ์แยก `page` / `component` / `composable` ให้ชัด
- กำหนด Quasar-native conventions สำหรับ `QForm`, `QTable`, dialog, notify, loading
- กำหนด trigger ที่ทำให้ state ถูกเลื่อนจาก composable ไป Pinia

#### Task 1.3: วาง internal contracts

- สร้าง type กลางสำหรับ `AuthUser`, `Student`, `Task`, `Case`, `Stats`, `Role`, `Setting`, `AttendanceFilter`, `ImportResult`
- กำหนดรูปแบบ return ของ service ให้ consistent
- กำหนดรูปแบบ loading/error handling ให้เหมือนกัน
- กำหนดหลักการ map aggregate/reporting data แยกจาก task lifecycle data

### Phase 2: Shared Infrastructure

#### Task 2.1: สร้าง services กลางตาม domain จริง

- `authService`
- `studentService`
- `attendanceService`
- `attendanceLookupService`
- `taskService`
- `taskAccessService`
- `caseService`
- `statsService`
- `userService`
- `roleGroupService`
- `settingsService`
- `masterDataService`
- `importService`

กติกาการ map:

- `task lifecycle/action` ไป `taskService`
- `magic token/guest/report/delegate access` ไป `taskAccessService`
- `case/review` ไป `caseService`
- `dashboard/summary/reporting` ไป `statsService`
- `lookups` ไป `attendanceLookupService`
- `attendance read/write` ไป `attendanceService`
- `student detail/list/self` ไป `studentService`

#### Task 2.2: สร้าง composables กลาง

- `useAuthSession`
- composable สำหรับ async state
- composable สำหรับ pagination/search/filter state
- `useAttendanceFilters`
- `useTaskFormFlow`
- `useMagicTaskSession`
- composable สำหรับ notification/case summary state ถ้าต้องใช้ซ้ำใน layout/dashboard

#### Task 2.3: รวม helper ที่ซ้ำกัน

- map request params
- parse/normalize response
- error-to-notify mapping
- reset dependent filters
- query-string mapping
- storage key handling

#### Task 2.4: เก็บ shared state ที่ต้องใช้ข้ามหน้า

- auth/session state
- lookup cache ที่ใช้บ่อย
- user scope หรือ filter scope ที่เกี่ยวข้อง
- case notification state ถ้าย้ายออกจาก layout

หมายเหตุ:

- ใช้ `composables-first`
- ยังไม่บังคับสร้าง `src/stores`
- ถ้าจะเพิ่ม Pinia ให้เริ่มเฉพาะ auth/session หรือ lookup cache

### Phase 3: Refactor แบบ Group By หน้าที่เชื่อมโยงกัน

#### Wave A: Auth / Session Group

กลุ่มไฟล์:

- `AdminAccessPage`
- `MagicLoginPage`
- `MainPage` เฉพาะส่วน user/session source of truth
- `router/index.ts`
- `boot/axios.ts`
- `useUserStore`

เป้าหมาย:

- รวม login, magic login, session restore, profile refresh ให้อยู่ใน flow เดียวกันมากขึ้น
- ลดการอ่าน `sessionStorage/localStorage` กระจายหลายจุด
- ทำให้ auth service/composable เป็น source of truth เดียว
- ทำให้ `MainPage` เลิกอ่าน user/session ตรงจาก storage และใช้ source of truth เดียวกับส่วนอื่น

tasks:

- แยก logic จาก `AdminAccessPage`
- แยก logic จาก `MagicLoginPage`
- ย้าย user/session bootstrap ใน `MainPage` ไปใช้ auth source of truth กลาง
- ย้าย storage/session handling ไปอยู่ `useAuthSession` หรือ composable store กลาง
- รวม auth-related API calls เข้า `authService`
- ตรวจสอบ header injection และ profile refresh flow
- ทำให้ router guard อ่าน auth state จากแหล่งเดียว

#### Wave B: Attendance Lookup / Shared Filters Group

กลุ่มไฟล์:

- `StudentsPage`
- `AttendancePage`
- `CreateTaskPage`
- `LoginLinksPage`
- `ManageUserPage`
- `AttendanceDashboardPage`

เป้าหมาย:

- เอา logic filter จังหวัด/อำเภอ/ตำบล/โรงเรียน/ชั้น/ห้อง ออกจากหลายหน้าให้เหลือแหล่งเดียว
- แยก lookup service ออกจาก attendance record service

tasks:

- สร้าง `AttendanceFilter` types
- สร้าง `attendanceLookupService` สำหรับ locations, schools, grade levels, rooms
- สร้าง `useAttendanceFilters`
- ย้ายหน้าในกลุ่มมาใช้ logic เดียว
- ทำ dependent dropdown reset เป็นมาตรฐานเดียว

#### Wave C: Student Group

กลุ่มไฟล์:

- `StudentsPage`
- `StudentInformationPage`
- `StudentSelfPage`

เป้าหมาย:

- แยก student list/detail/self flows ให้อยู่ domain เดียวกัน
- reuse student contracts และ formatting logic ร่วมกัน

tasks:

- เริ่ม pilot ที่ `StudentsPage`
- สร้าง `studentService`
- แยก student list fetching ออกจาก page
- แยก filter/search/pagination ออกเป็น composable
- แยก table และ mobile card เป็น component ย่อย
- refactor `StudentInformationPage`
- refactor `StudentSelfPage`

#### Wave D: Attendance Group

กลุ่มไฟล์:

- `AttendancePage`
- `AttendanceDashboardPage`

เป้าหมาย:

- แยก attendance read/write ออกจาก lookup logic
- ย้าย history/stats/task list ไป service/composable

tasks:

- สร้าง `attendanceService`
- แยก history fetching ออกจาก `AttendancePage`
- แยก attendance submit flow ออกจาก `AttendancePage`
- ย้าย attendance dashboard data fetching ออกจาก `AttendanceDashboardPage`
- แยก cards/table/summary sections เป็น component ย่อยเมื่อ pattern ชัด

#### Wave E: Task Creation / Access Group

กลุ่มไฟล์:

- `CreateTaskPage`
- `LoginLinksPage`
- `TaskGuestPage`
- `DelegatePage`
- `ReportPage`
- `MagicLoginPage` เฉพาะส่วน task access flow หลัง auth source of truth ถูกจัดกลางแล้ว

เป้าหมาย:

- แยก `task creation/form flow` ออกจาก `task access/magic session flow` ให้ชัด
- ลดความเสี่ยงที่จะสร้าง service ก้อนใหญ่ใหม่โดยรวม create flow กับ token/session flow ไว้ถังเดียว
- แยก direct fetch ออกจาก page

tasks:

- ดึง task form model และ payload mapper ออกมากลาง
- รวม create/list/admin lifecycle API เข้า `taskService`
- รวม fetch/verify/submit/delegate/report-context API เข้า `taskAccessService`
- สร้าง `useTaskFormFlow`
- สร้าง `useMagicTaskSession`
- แยก implementation เป็น 2 sub-streams: `CreateTaskPage` + `LoginLinksPage` และ `TaskGuestPage` + `ReportPage` + `DelegatePage` + `MagicLoginPage`
- ย้าย `ReportPage` จาก `fetch` ไป API layer
- แยก dialog state และ result/QR logic ออกจาก page

#### Wave F: Case / Dashboard Group

กลุ่มไฟล์:

- `IndexPage`
- `MainPage` เฉพาะส่วน dashboard stats/overview หลัง auth bootstrap ถูกย้ายออกแล้ว
- `TaskDetailPage`
- ส่วน notification ที่เกี่ยวกับ cases ใน `MainLayout`

เป้าหมาย:

- แยก aggregate/reporting ออกจาก task lifecycle
- ทำให้ `/dashboard` และ overview stats อยู่คนละ domain จาก task create/submit
- แยก admin task-link actions ออกจาก reporting service เพื่อไม่ให้ `statsService` กลายเป็น cross-domain bucket

tasks:

- สร้าง `caseService`
- สร้าง `statsService`
- ย้าย summary/statistics fetch logic ออกจาก dashboard pages
- แยก shared admin task-link action เช่น lock/unlock ออกจาก `IndexPage` และ `AttendanceDashboardPage`
- ย้าย case/review read-model logic ออกจาก `TaskDetailPage`
- แยก reusable cards/widgets
- รวม loading/error/notify behavior ให้เป็น pattern เดียว

#### Wave G: User / Role / Settings Group

กลุ่มไฟล์:

- `ManageUserPage`
- `RoleGroupsPage`
- `SystemSettingsPage`

เป้าหมาย:

- แยก user CRUD, role groups, settings, master-data ให้ขอบเขตชัด
- ลด page ขนาดใหญ่โดยแยก table/dialog/form sections

tasks:

- สร้าง `userService`
- สร้าง `roleGroupService`
- สร้าง `settingsService`
- สร้าง `masterDataService`
- refactor `RoleGroupsPage`
- refactor `SystemSettingsPage`
- refactor `ManageUserPage`
- แยก table, form dialog, scope form และ page state เป็นคนละส่วน

#### Wave H: Import Group

กลุ่มไฟล์:

- `ImportDataPage`

เป้าหมาย:

- แยก import/upload/check/report flow ออกจาก page
- ลบ hardcoded backend host

tasks:

- สร้าง `importService`
- ย้าย upload/check school API ไป service
- แยก import result state ออกจาก page
- ทำให้ทุก request ผ่าน axios boot กลาง

#### Wave I: Static / Status Pages Group

กลุ่มไฟล์:

- `SuccessPage`
- `ExpiredPage`
- `LockedPage`
- `ForbiddenPage`
- `ErrorNotFound`

เป้าหมาย:

- ตรวจสอบความสอดคล้องของ route/meta/navigation
- ปรับให้เบาและไม่แบก logic เกินจำเป็น

tasks:

- ตรวจ consistency ของ static pages
- แยก shared status page UI ถ้ามี pattern ซ้ำ
- ทำให้ routes และ redirect flow ชัดเจน

## ลำดับ implement ที่แนะนำ

1. Baseline + rules
2. `authService` + `useAuthSession` + router/axios cleanup
3. `attendanceLookupService` + `useAttendanceFilters`
4. `studentService` + `StudentsPage`
5. `attendanceService` + `AttendancePage`
6. `caseService` + `statsService` + dashboard pages
7. `taskService` + `taskAccessService` + task pages
8. `userService` + `roleGroupService`
9. `settingsService` + `masterDataService`
10. `importService`
11. final cleanup ของ `MainLayout`, remaining fetches, static/status pages

## Public APIs / Internal Interfaces

รอบนี้ไม่ควรเปลี่ยน backend contract ถ้าไม่จำเป็น

สิ่งที่เพิ่มภายใน frontend:

- domain types กลางแยกเป็น `auth`, `student`, `attendance`, `task`, `case`, `stats`, `user`, `settings`, `master-data`, `import`
- service layer กลางตาม domain จริง
- composables กลางสำหรับ auth/session, async state, filters, task form flow, task access/session flow
- optional composable store สำหรับ shared state

หลักคือเปลี่ยน architecture ภายใน frontend โดยไม่เปลี่ยน route และไม่เปลี่ยน response shape ที่ backend คาดหวัง

## Test Plan

ทุก wave ควรมี acceptance แบบเดิม:

- หน้าเปิดได้
- route ไม่พัง
- loading state ถูก
- error state ถูก
- submit flow ยังส่ง payload shape เดิม
- filter reset ถูกต้อง
- pagination/search ยังทำงานเหมือนเดิม

กรณีที่ควรทดสอบเฉพาะ:

- login / logout / session restore / profile refresh
- magic link verify และ OTP flow
- attendance filters แบบ dependent dropdown
- students list / detail / self view
- attendance history / save / task list
- dashboard stats / cases / overview
- task creation / submission / delegation / report
- user management CRUD
- role group CRUD
- settings CRUD
- master-data CRUD
- import upload / school check / bulk import

acceptance เพิ่มเติม:

- `ImportDataPage` ไม่มี hardcoded localhost URL
- `ReportPage` ไม่มี direct `fetch`
- `/dashboard` และ `/attendance-dashboard` ไม่ใช้ `taskService` เป็น aggregate bucket
- `statsService` ไม่แบก admin task-link actions
- `MainPage` ไม่อ่าน user/session ตรงจาก storage อีก
- shared lookups ไม่ถูกยิงซ้ำด้วย logic copy-paste หลายหน้า

หมายเหตุสำคัญของ frontend ตอนนี้:

- script `test` ใน `quasar-frontend` ยังเป็น placeholder และยังไม่มี automated frontend test suite ที่ใช้เช็ค behavior ได้จริง
- ดังนั้นในระยะนี้เกณฑ์ตรวจหลักของ frontend ต้องเป็น `lint` + `build` + manual smoke/acceptance test ของ flow ที่แตะ

Execution ต่อ 1 wave ของ frontend:

- รัน `npm run lint` ใน `quasar-frontend`
- รัน `npm run build` ใน `quasar-frontend`
- เปิด flow หลักของหน้าที่แก้และทำ smoke test ตาม acceptance ที่เกี่ยวข้อง
- ถ้า wave นั้นแตะ shared logic เช่น service/composable/helper mapper ให้ตรวจทั้ง consumer เดิมและ consumer ใหม่อย่างน้อย 1 flow ต่อฝั่ง

## Definition of Done ต่อ 1 Task

task ใดจะถือว่าเสร็จเมื่อ:

- page file สั้นลงอย่างมีนัยสำคัญ
- API call ถูกย้ายออกจาก page/layout
- logic ที่ reuse ได้ถูกย้ายไป service/composable
- type ชัดเจนขึ้น
- page เหลือ orchestration เป็นหลัก และ UI block ที่ reuse ได้ถูกแยกออก
- storage/session logic ไม่กระจายอยู่นอก composable/helper กลาง
- behavior เดิมไม่เปลี่ยน
- smoke test ของ flow ที่ได้รับผลกระทบผ่าน
- `lint` ผ่าน
- `build` ผ่าน

## Sequencing หลังปิด Frontend Waves

หลังปิด waves หลักของ frontend แล้ว ให้เดินงานต่อในลำดับนี้:

1. ปิด `frontend verification gate`
2. implement `Mock ThaID + virtual student session`
3. ค่อยเริ่ม `Pinia migration pass`

เหตุผล:

- verification ต้องมาก่อนเพื่อยืนยันว่า composable-first refactor รอบหลักนิ่งจริง
- `Mock ThaID` ยังต่ออยู่บน auth/session path ปัจจุบัน จึงควรทำก่อนเปลี่ยน state container ใหญ่
- `Pinia` เป็น architecture pass รอบถัดไป ไม่ใช่ส่วนหนึ่งของการปิด refactor หลัก

### Frontend Verification Gate

งานขั้นต่ำก่อนเริ่ม phase ถัดไป:

- manual test `ImportDataPage` สำหรับ upload + validation flow
- ยืนยันว่า payload shape ที่ยิง backend ยังตรง contract เดิม
- ยืนยันว่า route และ behavior เดิมยังทำงาน
- ทำ smoke test ของ flow ที่ได้รับผลกระทบจาก shared services/composables/helpers รอบล่าสุด

### Deferred Pinia Migration Pass

phase นี้จะเริ่มได้ก็ต่อเมื่อ:

- frontend verification gate ผ่าน
- `Mock ThaID + virtual student session` ผ่าน
- ไม่มี regression สำคัญจาก auth/session flow ปัจจุบัน

ขอบเขตเริ่มต้นของ Pinia pass:

- `auth/session` shared state
- lookup cache ที่ใช้หลายหน้า
- case notification / dashboard shared state

สิ่งที่ยังไม่ควรรีบย้ายในรอบแรก:

- form state ของหน้าเดียว
- dialog state ของหน้าเดียว
- search/filter/pagination ที่ยังเป็น page-scoped ชัดเจน

เกณฑ์ Definition of Done สำหรับ Pinia pass:

- Pinia ถูกใช้เฉพาะ shared state ที่มีคุณสมบัติระดับ cross-route หรือ long-lived จริง
- composable เดิมยังคงเป็น public orchestration layer ได้ถ้าช่วยลด churn ของ consumer
- consumer เดิมไม่ต้องแก้เกินจำเป็น
- auth/session และ lookup cache behavior ไม่ regress
- `lint` ผ่าน
- `build` ผ่าน

## หน้าแนะนำสำหรับเริ่มรอบแรก

หน้าแรกที่เหมาะที่สุดสำหรับ pilot ยังเป็น `StudentsPage` เพราะมีครบทั้ง:

- filter
- search
- pagination
- data fetching
- table/mobile split

แต่ในแผนใหม่ `StudentsPage` จะไม่ถูกมองเป็นหน้าเดี่ยวอีกต่อไป จะเป็นจุดเริ่มของ `Student Group` และใช้ร่วมกับ `Attendance Lookup / Shared Filters Group`

## Checklist

### Foundation Checklist

- [x] ทำ inventory หน้าและ layout ที่มี API call ฝังอยู่ในไฟล์
- [x] ทำ inventory จุดที่อ่าน `sessionStorage/localStorage` เอง
- [x] ระบุ logic ที่ซ้ำกันระหว่างหลายหน้า เช่น filters, pagination, dialog state, submit flow, token flow
- [x] ระบุหน้า reporting/dashboard ที่มี cross-domain actions ปะปนอยู่
- [x] สรุป convention การตั้งชื่อ `service`, `composable`, `types`, `components`
- [x] กำหนด Definition of Done สำหรับการ refactor ต่อ 1 group
- [x] กำหนดเกณฑ์แยก `page` / `component` / `composable`
- [x] กำหนด Quasar-native conventions สำหรับ form/table/dialog/notify/loading
- [x] กำหนด trigger สำหรับการย้าย state จาก composable ไป Pinia หลังปิดทุก wave
- [x] สร้างโฟลเดอร์ `src/services`
- [x] สร้างโฟลเดอร์ `src/types`
- [x] ตรวจสอบว่าจุดที่ใช้ `fetch('http://localhost:3000/...')` ถูกย้ายมาอยู่บน axios boot กลางทั้งหมด

### Shared Types And Services Checklist

- [x] สร้าง type กลางสำหรับ `AuthUser`
- [x] สร้าง type กลางสำหรับ `Student`
- [x] สร้าง type กลางสำหรับ `Task`
- [x] สร้าง type กลางสำหรับ `Case`
- [x] สร้าง type กลางสำหรับ `Stats`
- [x] สร้าง type กลางสำหรับ `Role`
- [x] สร้าง type กลางสำหรับ `Setting`
- [x] สร้าง type กลางสำหรับ `AttendanceFilter`
- [x] สร้าง type กลางสำหรับ `ImportResult`
- [x] สร้าง `authService`
- [x] สร้าง `studentService`
- [x] สร้าง `attendanceService`
- [x] สร้าง `attendanceLookupService`
- [x] สร้าง `taskService`
- [x] สร้าง `taskAccessService`
- [x] สร้าง `caseService`
- [x] สร้าง `statsService`
- [x] สร้าง `userService`
- [x] สร้าง `roleGroupService`
- [x] สร้าง `settingsService`
- [x] สร้าง `masterDataService`
- [x] สร้าง `importService`
- [x] รวม helper สำหรับ map request params และ normalize response
- [x] รวม helper สำหรับ error-to-notify mapping

### Shared Composables Checklist

- [x] สร้าง `useAuthSession`
- [x] สร้าง composable สำหรับ async state
- [x] สร้าง composable สำหรับ pagination state
- [x] สร้าง composable สำหรับ search/filter state
- [x] สร้าง `useAttendanceFilters`
- [x] สร้าง `useTaskFormFlow`
- [x] สร้าง `useMagicTaskSession`
- [x] แยก shared auth/session state ไป composable store ที่ชัดเจน

### Wave A: Auth / Session Group Checklist

- [x] แยก logic จาก `AdminAccessPage`
- [x] แยก logic จาก `MagicLoginPage`
- [x] ย้าย user/session bootstrap ใน `MainPage` ไป auth source of truth กลาง
- [x] ปรับ `useUserStore` ให้เหลือบทบาท auth-session store ชัดเจน
- [x] ย้าย session persistence logic ออกจาก page
- [x] รวม login / verify / refresh profile API calls เข้า `authService`
- [x] ตรวจสอบ flow ของ header injection
- [x] รวม router auth bootstrap ให้ใช้แหล่งข้อมูลเดียว
- [x] ทดสอบ login, logout, session restore, magic login

### Wave B: Attendance Lookup / Shared Filters Group Checklist

- [x] สร้าง lookup service สำหรับ `locations`
- [x] สร้าง lookup service สำหรับ `schools`
- [x] สร้าง lookup service สำหรับ `grade levels`
- [x] สร้าง lookup service สำหรับ `rooms`
- [x] สร้าง `useAttendanceFilters`
- [x] ย้าย `StudentsPage` มาใช้ `useAttendanceFilters`
- [x] ย้าย `AttendancePage` มาใช้ `useAttendanceFilters`
- [x] ย้าย `CreateTaskPage` มาใช้ `useAttendanceFilters`
- [x] ย้าย `LoginLinksPage` มาใช้ `useAttendanceFilters`
- [x] ย้าย `ManageUserPage` มาใช้ `useAttendanceFilters`
- [x] ย้าย `AttendanceDashboardPage` มาใช้ lookup layer กลาง
- [x] ทดสอบ dependent dropdown reset ทุกขั้น

### Wave C: Student Group Checklist

- [x] เริ่ม pilot ที่ `StudentsPage`
- [x] แยก student list API ออกจาก `StudentsPage`
- [x] แยก filter/search/pagination state ออกจาก `StudentsPage`
- [x] แยก table view ออกจาก `StudentsPage`
- [x] แยก mobile card list ออกจาก `StudentsPage`
- [x] ลดขนาด `StudentsPage.vue` ให้เหลือ orchestration เป็นหลัก
- [x] Refactor `StudentInformationPage`
- [x] Refactor `StudentSelfPage`
- [x] ทดสอบ student list, detail, self view

### Wave D: Attendance Group Checklist

- [x] แยก attendance history fetching ออกจาก `AttendancePage`
- [x] แยก attendance submit flow ออกจาก `AttendancePage`
- [x] ย้าย attendance task list ไป `attendanceService`
- [x] ย้าย attendance dashboard fetching ออกจาก `AttendanceDashboardPage`
- [x] แยก summary cards/table sections ที่ใช้ซ้ำ
- [x] ทดสอบ history, save attendance, dashboard summary

### Wave E: Task Creation / Access Group Checklist

- [x] เปรียบเทียบ logic ซ้ำระหว่าง `CreateTaskPage` และ `LoginLinksPage`
- [x] สร้าง task form model กลาง
- [x] สร้าง task payload mapper กลาง
- [x] รวม create/list/admin lifecycle API เข้า `taskService`
- [x] รวม fetch/verify/submit/delegate/report-context API เข้า `taskAccessService`
- [x] สร้าง `useTaskFormFlow`
- [x] สร้าง `useMagicTaskSession`
- [x] แยก dialog state ออกจาก `CreateTaskPage`
- [x] แยก dialog state ออกจาก `LoginLinksPage`
- [x] แยก task creation/form flow ออกจาก page
- [x] แยก guest token/session flow ออกจาก page
- [x] ย้าย `ReportPage` จาก `fetch` ไป API layer
- [x] Refactor `CreateTaskPage`
- [x] Refactor `LoginLinksPage`
- [x] Refactor `TaskGuestPage`
- [x] Refactor `DelegatePage`
- [x] Refactor `MagicLoginPage`
- [x] ทดสอบ task creation, OTP, verify, submit, delegate, report

### Wave F: Case / Dashboard Group Checklist

- [x] สร้าง `caseService`
- [x] สร้าง `statsService`
- [x] ย้าย statistics fetch logic ออกจาก `MainPage`
- [x] ย้าย statistics fetch logic ออกจาก `IndexPage`
- [x] แยก shared admin task-link actions ออกจาก `IndexPage` และ `AttendanceDashboardPage`
- [x] ย้าย case list/review logic ออกจาก `TaskDetailPage`
- [x] แยก dashboard widgets ที่ใช้ซ้ำ
- [x] แยก notification/case summary state ออกจาก `MainLayout`
- [x] ทดสอบ dashboard data loading และ empty/error states

### Wave G: User / Role / Settings Group Checklist

- [x] Refactor `RoleGroupsPage`
- [x] แยก role group CRUD ไป `roleGroupService`
- [x] แยก role group page state ไป composable
- [x] Refactor `SystemSettingsPage`
- [x] แยก settings CRUD ไป `settingsService`
- [x] แยก master-data CRUD ไป `masterDataService`
- [x] แยก settings page state ไป composable
- [x] Refactor `ManageUserPage`
- [x] แยก user table ออกจาก `ManageUserPage`
- [x] แยก user form dialog ออกจาก `ManageUserPage`
- [x] แยก scope form/logic ออกจาก `ManageUserPage`
- [x] แยก user CRUD ไป `userService`
- [x] ทดสอบ role groups, settings, master-data, users CRUD

### Wave H: Import Group Checklist

- [x] Refactor `ImportDataPage`
- [x] แยก upload/check school API ไป `importService`
- [x] ลบ hardcoded `localhost:3000`
- [x] แยก import state และ result mapping ออกจาก page
- [x] ทดสอบ import upload และ validation flow

### Wave I: Static / Status Pages Checklist

- [x] ตรวจ consistency ของ `SuccessPage`
- [x] ตรวจ consistency ของ `ExpiredPage`
- [x] ตรวจ consistency ของ `LockedPage`
- [x] ตรวจ consistency ของ `ForbiddenPage`
- [x] ตรวจ consistency ของ `ErrorNotFound`
- [x] แยก shared status UI ถ้ามี pattern ซ้ำ

### Verification Checklist ต่อ 1 Wave

- [x] ไม่มี API call ตรงใน page/layout ที่ refactor แล้ว
- [x] ไม่มี hardcoded localhost URL ค้างอยู่
- [x] type ชัดเจนขึ้นและลด `any`
- [x] loading/error handling อยู่ใน pattern เดียวกัน
- [x] component/page ที่แก้ใหม่ใช้ `<script setup lang="ts">`
- [x] form/table/dialog/notify ใช้ Quasar pattern เดียวกัน
- [x] storage access เหลือเฉพาะ composable/helper กลางตามที่กำหนด
- [x] payload ที่ยิง backend shape เดิม
- [x] route และ behavior เดิมยังทำงาน
- [x] smoke test ของ flow ที่ได้รับผลกระทบผ่าน
- [x] `lint` ผ่าน
- [x] `build` ผ่าน

### Deferred Pinia Migration Checklist

- [x] ปิด frontend verification gate ให้ครบก่อนเริ่ม
- [x] ปิด `Mock ThaID + virtual student session` ก่อนเริ่ม Pinia pass
- [x] ย้าย auth/session shared state ไป Pinia
- [x] ย้าย lookup cache ที่ใช้หลายหน้าไป Pinia
- [x] ประเมิน case notification / dashboard shared state และย้าย case notifications ไป Pinia เพราะเป็น layout-shared long-lived state
- [x] คง page-scoped form/dialog/search state ไว้ใน composable หรือ local state ถ้ายังไม่ใช่ shared long-lived state
- [x] ยืนยันว่า consumer เดิมไม่ถูกบังคับให้แก้เกินจำเป็น
- [x] ยืนยันว่า auth/session และ lookup behavior ไม่ regress
- [x] `lint` ผ่าน
- [x] `build` ผ่าน

# NestJS Backend Refactor

## Progress Update

### 2026-03-28

รอบ implement นี้ปิด `Wave A: Task Domain` ของ backend แล้ว โดยยังคง API contract เดิมไว้และใช้ `pg` เดิมเป็น persistence ใต้ repository layer ชั่วคราวก่อนเข้าสู่ phase TypeORM จริง

- สร้าง `src/task/task.repository.ts` เพื่อรวม query ของ task domain, login-link access, submissions, stats read-model, case review, และ delegation ไว้ที่ data layer เดียว
- สร้าง `src/task/task.types.ts` และ `src/task/task-policy.service.ts` สำหรับ actor/scope/role normalization, permission checks, และ login-link assignment rules กลาง
- สร้าง `src/task/task-lifecycle.service.ts` เพื่อแยก task creation / delete flow ออกจาก façade เดิม
- สร้าง `src/task/task-access.service.ts` เพื่อแยก task token resolution, magic login verify, OTP, login-link list, และ admin lock/unlock flow
- สร้าง `src/task/task-read.service.ts` เพื่อแยก read flows ของ task students, task history, และ task chain
- สร้าง `src/task/task-submission.service.ts` เพื่อแยก attendance submit และ report submission flow
- สร้าง `src/task/task-stats.service.ts` เพื่อแยก cases/stats/overview read-model
- ปรับ `src/task/task.service.ts` ให้เหลือ façade บาง ๆ ที่ delegate ไป focused services แทน service ก้อนใหญ่เดิม
- ปรับ `src/task/delegation.service.ts` และ `src/task/case.service.ts` ให้เลิกยิง `DatabaseService` ตรงและใช้ repository layer เดียวกับ task domain
- ปรับ `src/task/task.module.ts` ให้ register repository + focused services ชุดใหม่ครบ
- ตรวจแล้ว `npm run build` ผ่านใน `nest-backend`

สิ่งที่ยังเหลือใกล้สุดหลังรอบนี้:

- เก็บ `Wave B: Users และ Auth`
- เพิ่ม DTO/validation rollout สำหรับ task/controllers ที่ยังใช้ `any` และ manual error mapping
- ทำ backend lint cleanup ของ task controllers/services ให้ผ่านกติกา `@typescript-eslint/no-unsafe-*` แบบยกชุดในรอบถัดไป
- เดินต่อ Phase 2 สำหรับ TypeORM foundation และ migration baseline

### 2026-03-28

รอบ implement นี้ปิด `Wave B: Users และ Auth` แล้ว โดยคง public routes เดิมไว้และแยก concern ของ users/auth ออกจากกันชัดขึ้น

- สร้าง `src/auth/auth.types.ts`, `src/auth/current-user.decorator.ts`, และ `src/auth/auth-actor.service.ts`
- ปรับ `src/auth/auth.guard.ts` และ `src/auth/auth.module.ts` ให้ guard เลิก query/load actor เอง และใช้ `AuthActorService` เป็น actor loader กลางแทน
- สร้าง `src/users/dto/users.dto.ts` สำหรับ login, user CRUD, และ role-group payload contracts
- สร้าง `src/users/users.types.ts`, `src/users/users.repository.ts`, และ `src/users/users-policy.service.ts`
- ปรับ `src/users/users.service.ts` ให้เหลือเฉพาะ user CRUD + role listing
- สร้าง `src/users/role-groups.service.ts` เพื่อแยก role-group management ออกจาก user CRUD
- สร้าง `src/users/user-auth.service.ts` เพื่อแยก login validation ออกจาก `UsersService`
- สร้าง `src/users/password-migration.service.ts` เพื่อแยก password migration concern ออกจาก `UsersService`
- ปรับ `src/users/users.controller.ts` ให้ใช้ DTOs, `ParseIntPipe`, และ `CurrentUser` decorator แทน request typing/manual parse เดิม
- ปรับ `src/users/users.module.ts` ให้ register repository/policy/focused services ชุดใหม่ครบ
- ตรวจแล้ว `npx eslint` ผ่านสำหรับไฟล์ `src/users/**` และ `src/auth/**` ที่แตะใน wave นี้
- ตรวจแล้ว `npm run build` ผ่านใน `nest-backend`

สิ่งที่ยังเหลือใกล้สุดหลังรอบนี้:

- เก็บ `Wave C: Attendance`
- เพิ่ม DTO/validation rollout ให้ครบกับ controller กลุ่มเก่าที่นอกเหนือจาก `users/auth`
- ทำ lint cleanup ต่อใน `task` module ที่ยังมี raw-query `no-unsafe-*` debt ค้างอยู่
- เดินต่อ Phase 2 สำหรับ TypeORM foundation และ migration baseline

### 2026-03-28

รอบ implement นี้ปิด `Wave C: Attendance` แล้ว โดยคง attendance routes และ response shapes เดิมไว้ แต่แยก lookup/read/write/persistence ออกจาก service ก้อนเดียวเดิม

- สร้าง `src/attendance/dto/attendance.dto.ts` สำหรับ query/body contracts ของ attendance endpoints
- สร้าง `src/attendance/attendance.types.ts` และ `src/attendance/attendance.repository.ts`
- สร้าง `src/attendance/attendance-lookup.service.ts`, `src/attendance/attendance-read.service.ts`, และ `src/attendance/attendance-write.service.ts`
- ปรับ `src/attendance/attendance.service.ts` ให้เหลือ façade บาง ๆ ที่ delegate ไป focused services
- ปรับ `src/attendance/attendance.controller.ts` ให้ใช้ DTOs, `AuthGuard`, และ `CurrentUser` แทนการ parse `x-user-scope` ตรงใน controller
- ปรับ `src/attendance/attendance.module.ts` ให้ register repository + focused services และ import `DatabaseModule`/`AuthModule`
- ตรวจแล้ว `npm run build` ผ่านใน `nest-backend`
- ตรวจแล้ว `npx eslint` ผ่านสำหรับไฟล์ `src/attendance/**` ที่แตะใน wave นี้

สิ่งที่ยังเหลือใกล้สุดหลังรอบนี้:

- เก็บ `Wave D: Supporting Modules`
- เพิ่ม DTO/validation rollout ให้ครบกับ controller กลุ่มเก่าที่นอกเหนือจาก `users/auth/attendance`
- ทำ lint cleanup ต่อใน `task` module ที่ยังมี raw-query `no-unsafe-*` debt ค้างอยู่
- เดินต่อ Phase 2 สำหรับ TypeORM foundation และ migration baseline

### 2026-03-28

รอบ implement นี้ปิด `Wave D: Supporting Modules` แล้ว โดยคง public REST routes เดิมของ `settings`, `master-data`, และ `imports` ไว้ พร้อมแยก `automation` ออกเป็น scheduler/use-case/repository ที่ชัดขึ้น

- สร้าง `src/settings/dto/settings.dto.ts`, `src/settings/settings.types.ts`, และ `src/settings/settings.repository.ts`
- ปรับ `src/settings/settings.controller.ts` ให้ใช้ DTO body contract และ `AuthGuard` + `PermissionsGuard` + `RequirePermission('settings')`
- ปรับ `src/settings/settings.service.ts` ให้เลิกยิง `DatabaseService` ตรงและใช้ repository layer พร้อมคง behavior refresh cron หลัง update ค่า `ALERT_TRIGGER_TYPE`/`ALERT_SCHEDULE_TIME`
- สร้าง `src/master-data/dto/master-data.dto.ts`, `src/master-data/master-data.types.ts`, และ `src/master-data/master-data.repository.ts`
- ปรับ `src/master-data/master-data.controller.ts` ให้เลิกใช้ `any` กับ body และผูก permission `settings` ที่ controller level
- ปรับ `src/master-data/master-data.service.ts` ให้รวม table/value validation ไว้ที่ service และย้าย persistence ไป repository
- สร้าง `src/imports/dto/imports.dto.ts`, `src/imports/imports.types.ts`, และ `src/imports/imports.repository.ts`
- ปรับ `src/imports/imports.controller.ts` ให้ใช้ typed multipart body contracts และผูก permission `import-data`
- ปรับ `src/imports/imports.service.ts` ให้เหลือ orchestration ของ workbook parsing / mapping / transaction flow และย้าย DB writes ไป repository
- สร้าง `src/automation/automation.types.ts`, `src/automation/automation.repository.ts`, `src/automation/absence-monitor.service.ts`, และ `src/automation/automation-scheduler.service.ts`
- ปรับ `src/automation/automation.service.ts` ให้เหลือ façade บาง ๆ ที่ delegate ไป absence monitor กับ scheduler services
- ปรับ `src/automation/automation.module.ts` ให้ register repository + focused services ชุดใหม่ครบ
- ตรวจแล้ว `npm run build` ผ่านใน `nest-backend`
- ตรวจแล้ว `npx eslint` ผ่านสำหรับไฟล์ `src/settings/**`, `src/master-data/**`, `src/imports/**`, และ `src/automation/**` ที่แตะใน wave นี้

สิ่งที่ยังเหลือใกล้สุดหลังรอบนี้:

- ทำ API/manual smoke ของ settings/master-data/imports flows และ automation schedule/immediate trigger อีก 1 รอบ
- ทำ lint cleanup ต่อใน `task` module ที่ยังมี raw-query `no-unsafe-*` debt ค้างอยู่
- เดินต่อ Phase 2 สำหรับ TypeORM foundation และ migration baseline

### 2026-03-28

รอบ implement นี้เก็บ `task lint/typing debt` ชุดหลักและเริ่ม `TypeORM Foundation` แล้ว โดยยังคง backend runtime ปัจจุบันให้ทำงานแบบ hybrid ร่วมกับ `DatabaseService` เดิม

- ปรับ `src/task/**` ให้ใช้ DTO/type contracts ชัดขึ้นสำหรับ create/delegate/review/admin-lock/attendance/submission payloads
- ปรับ `src/task/task.controller.ts`, `src/task/admin.controller.ts`, `src/task/delegation.controller.ts`, และ `src/task/case.controller.ts` ให้เลิกใช้ `any` ใน controller contracts และใช้ error helpers กลางแทน manual unsafe mapping
- ปรับ `src/task/task-lifecycle.service.ts`, `src/task/task-submission.service.ts`, `src/task/delegation.service.ts`, และ `src/task/case.service.ts` ให้ใช้ typed normalization แทน member access บน `any`
- ปรับ `src/task/task.repository.ts` ให้ใช้ generic query/result typing แทน direct `db.query(...)` แบบปล่อย `any`
- ตรวจแล้ว `npx eslint src/task/**/*.ts` ผ่าน
- ติดตั้ง `typeorm` และ `@nestjs/typeorm`
- สร้าง `src/config/database.config.ts` สำหรับ typed database config กลาง
- เพิ่ม `TypeOrmModule.forRootAsync(...)` ใน [app.module.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/app.module.ts) โดยตั้ง `synchronize: false` และยังไม่เปิด `migrationsRun`
- สร้าง naming strategy ที่ [legacy.naming-strategy.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/database/legacy.naming-strategy.ts) และ data source ที่ [typeorm.datasource.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/database/typeorm.datasource.ts)
- สร้าง baseline entities ใต้ `src/database/entities/**`
- ย้าย SQL bootstrap เดิมไปเป็น shared source ที่ [bootstrap-sql.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/database/bootstrap-sql.ts) เพื่อให้ runtime bootstrap กับ migration ใช้ definition เดียวกัน
- สร้าง baseline migration ที่ [20260328145500-CreateBaselineSchema.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/database/migrations/20260328145500-CreateBaselineSchema.ts)
- เพิ่ม TypeORM CLI scripts ใน `nest-backend/package.json`
- สร้าง transition runbook ที่ [typeorm-transition.md](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/docs/typeorm-transition.md)
- ตรวจแล้ว `npm run build` ผ่านใน `nest-backend`
- ตรวจแล้ว `npx eslint src/task/**/*.ts src/config/**/*.ts src/database/**/*.ts src/app.module.ts` ผ่าน
- ตรวจแล้ว `npm run migration:show` โหลด TypeORM data source ได้และเห็น pending migration `CreateBaselineSchema20260328145500`

สิ่งที่ยังเหลือใกล้สุดหลังรอบนี้:

- ยังไม่ได้รัน `migration:run` จริงบนฐานข้อมูลเป้าหมาย
- ยังไม่ได้ย้าย runtime seed/bootstrapping ออกจาก `DatabaseService` ทั้งหมด เพราะยังต้องเก็บ hybrid transition ไว้ก่อน
- ยังไม่ได้ทำ parity verification ระหว่าง schema ที่สร้างจาก migration กับ runtime bootstrap แบบเต็มชุด
- ถัดไปคือเก็บ Phase 1/2 checklist ที่ยังค้าง เช่น global `ValidationPipe`, exception filter, และแผนถอด `DatabaseService`

### 2026-03-28

รอบ implement นี้ปิด `Phase 1: Platform Foundation` ชุดหลักที่ยังค้าง โดยเน้น shared runtime primitives และ inventory ที่ต้องมีเอกสารรองรับก่อนจะเดินต่อไป `Legacy Removal`

- เพิ่ม typed runtime config สำหรับ app bootstrap ที่ [app.config.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/config/app.config.ts) และ email transport ที่ [email.config.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/config/email.config.ts)
- ปรับ [main.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/main.ts) ให้ใช้ typed config, เปิด global `ValidationPipe`, และเปิด global exception filter
- เพิ่ม global exception filter ที่ [app-exception.filter.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/common/filters/app-exception.filter.ts) โดยคง `HttpException` response เดิมและเก็บ unknown errors แบบกลาง
- เพิ่ม validation exception factory ที่ [validation-exception.factory.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/common/validation/validation-exception.factory.ts)
- รวม request actor และ `data_scope` typing ไว้กลางใน [auth.types.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/auth/auth.types.ts) และให้ `auth`/`task`/`users` ใช้ contract เดียวกัน
- รวม scope parsing/normalization ผ่าน utility กลาง และให้ actor loading/attendance path ใช้ normalization เดียวกันแล้ว
- เพิ่ม DTO decorators ให้ `task`, `users`, `attendance`, `settings`, `imports`, และ `master-data` เพื่อให้ global validation ใช้งานได้จริง
- ลด manual validation ใน controller ที่ DTO ครอบแล้ว เช่น `attendance`, `settings`, `imports`, และ admin lock action
- ย้าย runtime env access ออกจาก `EmailService` และ request base-url resolution ออกจาก controller duplication ไป utility กลาง
- สร้าง inventory/runbook ที่ [backend-foundation-inventory.md](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/docs/backend-foundation-inventory.md) เพื่อบันทึก residual debt, controller/guard/service/repository responsibility, และ response serialization policy
- ตรวจแล้ว `npm run build` ผ่านใน `nest-backend`
- ตรวจแล้ว targeted `eslint` ผ่านสำหรับไฟล์ foundation/module ที่แตะในรอบนี้

สิ่งที่ยังเหลือใกล้สุดหลังรอบนี้:

- `students` module ยังเป็น legacy path หลักที่เหลือทั้ง `any` และ `x-user-scope`
- `DatabaseService` ยังอยู่ใน hybrid transition และยังไม่ถึงจุดถอด runtime bootstrap
- route บางตัวใน `task` ยังมี manual status mapping ต่อไปตาม API contract เดิม

### 2026-03-28

รอบ implement นี้ปิด `TypeORM Foundation` ที่ค้างสองจุดหลักแล้ว โดยทำให้ migration path กับ legacy bootstrap path ใช้ bootstrap executor flow เดียวกัน และย้าย system role/system setting seeds ไปอยู่บน definition กลาง

- เพิ่ม `SYSTEM_SETTING_DEFINITIONS` และ `runDatabaseBootstrap(...)` ใน [bootstrap-sql.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/database/bootstrap-sql.ts) เพื่อรวม schema bootstrap + role seed + system setting seed ไว้ใน source of truth เดียว
- เปลี่ยน role/system setting seed จาก hardcoded SQL แยกก้อน มาเป็น generated SQL + sync helpers ที่อิง definition กลางแทน
- ปรับ baseline migration ที่ [20260328145500-CreateBaselineSchema.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/database/migrations/20260328145500-CreateBaselineSchema.ts) ให้เรียก `runDatabaseBootstrap(queryRunner)` ตรง
- ปรับ legacy runtime bootstrap ใน [database.service.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/database/database.service.ts) ให้เรียก `runDatabaseBootstrap(client)` ตรงเช่นกัน เพื่อบังคับ parity ด้วย shared path
- เพิ่ม parity verifier script ที่ [verify_bootstrap_parity.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/scripts/verify_bootstrap_parity.ts) และ script `npm run bootstrap:verify-parity`
- อัปเดต transition runbook ที่ [typeorm-transition.md](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/docs/typeorm-transition.md) ให้ล็อกแนวทาง parity แบบ shared helper + verifier command
- ตรวจแล้ว `npm run build` ผ่านใน `nest-backend`
- ตรวจแล้ว `npm run bootstrap:verify-parity` ผ่าน

สิ่งที่ยังเหลือใกล้สุดหลังรอบนี้:

- ยังไม่ได้รัน `migration:run` จริงบนฐานข้อมูลเป้าหมาย
- `DatabaseService` ยังอยู่ใน hybrid transition เพราะยังไม่เริ่ม `Phase 4: Legacy Removal`
- จุดถัดไปตามแผนคือถอด runtime bootstrap / `DatabaseService` / direct `pg` usage ออกทีละโมดูล

### 2026-03-28

รอบ implement นี้ปิด `Phase 4: Legacy Removal` ฝั่ง runtime backend แล้ว โดยตัด runtime schema bootstrap เดิมออก, ย้าย query execution ไป `TypeORM DataSource/QueryRunner`, และถอด `DatabaseModule`/`DatabaseService` ออกจาก app graph ทั้งหมด

- เพิ่ม helper กลางที่ [sql-query.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/database/sql-query.ts) เพื่อให้ raw SQL และ transaction boundaries เดิมวิ่งผ่าน `TypeORM QueryRunner` พร้อมคง `rows/rowCount` contract สำหรับ repository layer
- ปรับ runtime repositories/services ที่เคย inject `DatabaseService` ให้ใช้ `DataSource` แทนแล้วใน `task`, `users`, `attendance`, `settings`, `master-data`, `imports`, `automation`, `auth`, และ `students`
- ถอด `DatabaseModule` ออกจาก [app.module.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/app.module.ts) และจาก feature modules ทั้งหมด
- ลบ [database.service.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/database/database.service.ts) และ [database.module.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/database/database.module.ts) ออกจาก runtime codebase
- ยืนยันแล้วว่า app runtime ใต้ `src/**` ไม่มี direct `pg` usage ค้างอยู่; direct `pg` ที่เหลืออยู่มีเฉพาะ scripts ใต้ `src/scripts/**` ซึ่งไม่ใช่ HTTP/runtime path
- อัปเดต runbook ที่ [typeorm-transition.md](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/docs/typeorm-transition.md), inventory ที่ [backend-foundation-inventory.md](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/docs/backend-foundation-inventory.md), และ backend setup docs ที่ [README.md](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/README.md) ให้ชัดว่า schema ต้องถูก apply ผ่าน `npm run migration:run` ก่อน start app
- ตรวจแล้ว `npm run build` ผ่านใน `nest-backend`
- ตรวจแล้ว targeted `eslint` ผ่านสำหรับไฟล์ runtime/database/module ที่แตะในรอบนี้

สิ่งที่ยังเหลือใกล้สุดหลังรอบนี้:

- ยังไม่ได้รัน manual/API smoke หลัง cutover `DataSource` ทั้งระบบ
- `students` module ยังเป็น legacy path ที่เหลือเรื่อง `x-user-scope` และ `any` บางส่วน แม้จะไม่พึ่ง `DatabaseService` แล้ว
- scripts migration/import เก่าบางตัวใต้ `src/scripts/**` ยังใช้ `pg` ตรงต่อไปได้ชั่วคราว เพราะไม่ใช่ app runtime path

### 2026-03-28

รอบ implement นี้เก็บ residual debt ของ `students` module แล้ว เพื่อให้ runtime HTTP path หลักทั้งหมดเข้าสู่ pattern เดียวกับ modules ที่ refactor มาก่อนหน้า

- เพิ่ม query DTO ที่ [students.dto.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/students/dto/students.dto.ts) สำหรับ student list filters
- เพิ่ม [students.repository.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/students/students.repository.ts) และ [students.types.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/students/students.types.ts) เพื่อย้าย query/persistence และ row typing ออกจาก service
- ปรับ [students.controller.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/students/students.controller.ts) ให้ใช้ `AuthGuard + CurrentUser` และเลิกอ่าน `x-user-scope` ตรง
- ปรับ [students.service.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/students/students.service.ts) ให้เหลือ orchestration และ filter normalization เป็นหลัก
- ปรับ [students.module.ts](/Users/chanyut/STS_ALL/STS_main_1/Magic-Link-tracking-student/nest-backend/src/students/students.module.ts) และ specs ให้รับ repository dependency ใหม่

ผลหลังรอบนี้:

- runtime HTTP modules ใต้ `nest-backend/src/**` ไม่เหลือ `x-user-scope` parsing หรือ `query: any` ใน path หลักแล้ว
- จุด residual หลักที่เหลือตาม practical scope คือ manual/API verification และ tooling scripts ใต้ `src/scripts/**`

## Summary

แนวทางที่เหมาะกับ `nest-backend` คือ `incremental refactor` โดยปลายทางเป็น `TypeORM full cutover` ไม่ใช่ rewrite ทั้งระบบทีเดียว เพราะตอนนี้ backend มีทั้ง raw SQL, runtime schema bootstrap, controller ที่ parse/validate เอง, หลาย endpoint ที่ยังรับ `any` ตรง, service ขนาดใหญ่, และ auth guard ที่แบก logic มากเกินไป

หลักการ refactor รอบนี้:

- ทำให้ controller บางลง
- ค่อย ๆ ทำ DTO + validation ให้เป็นมาตรฐาน
- แยก service ตาม bounded concern
- ย้าย persistence จาก `pg.Pool` ไป `TypeORM`
- ใช้ migration เป็น source of truth ของ schema
- คง API contract เดิมทั้งหมด

## เป้าหมายโครงสร้าง

โครงสร้างเป้าหมายที่ควรค่อย ๆ ปรับไปหา:

- `src/common` สำหรับ decorators, filters, guards, interceptors, pipes
- `src/config` สำหรับ typed config
- `src/database` สำหรับ TypeORM bootstrap, migrations, seeds
- `src/modules/<feature>/dto`
- `src/modules/<feature>/entities`
- `src/modules/<feature>/repositories`
- `src/modules/<feature>/services`

กติกาหลัก:

- service ไม่ควรโหลด `.env` เอง
- controller ไม่ควรใช้ `any` กับ body/query/param สำคัญ
- controller ไม่ควร parse `int`, validate required fields, หรือ map error เองซ้ำ ๆ
- runtime ไม่ควร bootstrap schema ตอน app start
- module ที่ refactor แล้วไม่ควรใช้ `pg.Pool` ตรง
- `TypeORM` ต้องใช้ `synchronize: false`

### กติกา NestJS ที่ต้องถือเป็นมาตรฐาน

- controller รับผิดชอบ route binding, decorators, pipes, guards และเรียก service เท่านั้น; ห้าม query DB ตรง
- endpoint ใหม่หรือ endpoint ที่ถูกแตะต้องต้องมี DTO + validation สำหรับ body/query/param ก่อนจะเพิ่ม manual checks เพิ่มเติม
- response shaping หรือ cross-cutting concerns ให้ใช้ interceptor/filter/decorator/pipes ก่อน helper เฉพาะจุดใน controller
- guard ต้องเหลือบทบาท authentication/authorization เป็นหลัก; actor loading, permission hydration, และ domain-specific checks ควรถูกผลักไป service/provider ที่ชัด
- service ทำ orchestration ของ use case; repository/data layer ถือ ownership เรื่อง persistence/query
- หลีกเลี่ยง `forwardRef` และ circular dependency; ถ้ามี logic ใช้ร่วมหลายโมดูลให้แยก shared provider แทน
- config ทั้งหมดต้องไหลผ่าน typed `ConfigModule`

### กติกา TypeORM ระหว่าง Transition

- entity ต้อง map ชื่อตาราง/คอลัมน์ legacy แบบ explicit เมื่อ schema ปัจจุบันไม่ตรง convention ปกติ
- default path คือ repository/query builder; raw SQL ใช้เฉพาะ query ซับซ้อนหรือ reporting จริง ๆ และต้องรันผ่าน TypeORM `DataSource`/`QueryRunner`
- transaction boundary ต้องถูกนิยามตาม use case ไม่กระจาย ad hoc ในหลาย service
- migration ทุกตัวต้อง deterministic, reviewable, และห้ามพึ่ง `synchronize`
- seed/runtime bootstrap ต้องถูกแยกจาก app startup ชัดเจน

## ลำดับการทำงาน

### Phase 1: Platform Foundation

#### Task 1.1: จัดระเบียบ config และ app bootstrap

- ย้าย config ไปอยู่ `ConfigModule` แบบ typed
- ย้ายค่าที่เกี่ยวกับ CORS, static assets, port ไป config กลาง
- เอา `dotenv.config(...)` ออกจาก service
- ทำ inventory endpoint/controller ที่ยังใช้ `any` และ manual validation ก่อนเริ่มทยอยแก้
- ทำ inventory จุดที่ guard แบก actor loading หรือ permission resolution มากเกินไป

#### Task 1.2: เพิ่ม NestJS cross-cutting primitives

- เพิ่ม global `ValidationPipe`
- เพิ่ม global exception filter
- เพิ่ม shared request actor type
- เพิ่ม `CurrentUser` decorator
- รวม scope parsing/normalization ไว้จุดเดียว
- กำหนด rollout ว่า endpoint ไหนจะถูกย้ายจาก `any` ไป DTO ก่อนหลัง
- กำหนด responsibility ของ controller / guard / service / repository ให้ชัดก่อนแตกโมดูล
- กำหนดแนวทาง response serialization/interceptor สำหรับจุดที่มี mapping ซ้ำ

#### Task 1.3: กำหนด Definition of Done ของ backend

- endpoint ที่ refactor แล้วต้องมี DTO ชัดเจน
- controller ไม่ใช้ `any`
- controller ไม่ทำ manual validation ซ้ำ
- service concern แคบลง
- API behavior เดิมไม่เปลี่ยน

### Phase 2: TypeORM Foundation

#### Task 2.1: วาง persistence layer ใหม่

- ติดตั้ง `typeorm` และ `@nestjs/typeorm`
- สร้าง `TypeOrmModule.forRootAsync(...)`
- สร้าง entities ให้ครอบคลุม schema ปัจจุบัน
- inventory schema objects และ seed ที่ตอนนี้ถูกสร้างจาก `runMigrations()` ให้ครบก่อน
- กำหนด entity/table/column naming strategy สำหรับ legacy schema
- สร้าง baseline migration
- ย้าย seed คงที่ เช่น roles และ system settings ออกจาก runtime startup
- ปิด `synchronize`

#### Task 2.2: วาง transition strategy

- อนุญาต hybrid ชั่วคราวระหว่าง raw SQL กับ TypeORM
- โมดูลที่ refactor แล้วให้ใช้ repository หรือ `DataSource`
- query ซับซ้อนที่ยังย้ายไม่หมดให้ผ่าน `DataSource` แทน `pg.Pool`
- กำหนดเกณฑ์ว่า query ไหนใช้ repository, query builder, หรือ raw SQL ผ่าน `DataSource`
- กำหนด transaction boundary ของ use case หลักก่อนย้ายของจริง
- ถอด `DatabaseService` ได้ก็ต่อเมื่อ baseline migration ครอบคลุม schema/runtime seed เดิมแล้ว

### Phase 3: Refactor แบบเป็น Domain

#### Wave A: Task Domain

เป้าหมาย:

- ลดขนาด `task.service.ts`
- แยก concern ของ task lifecycle, submission, case review, login-link/admin, stats ออกจากกัน

tasks:

- แตก `task.service.ts`
- แยก task creation flow
- แยก OTP/login-link flow
- แยก submission flow
- แยก stats read-model
- ย้าย queries ไป repository หรือ data source layer

#### Wave B: Users และ Auth

เป้าหมาย:

- แยก user CRUD, role-group management, password migration, login validation
- ลดภาระของ guard ให้เหลือ authentication/authorization จริง ๆ

tasks:

- เพิ่ม DTOs ให้ users endpoints
- แยก role-group management ออกจาก user CRUD
- ย้าย actor loading และ permission resolution ออกจาก guard
- แยก password migration concern

#### Wave C: Attendance

เป้าหมาย:

- แยก lookup queries, read flows, write flows ออกจากกัน
- ทำ contracts ของ query/body ให้ชัด

tasks:

- เพิ่ม query/body DTOs
- แยก lookup/read/write concerns
- ย้าย attendance persistence ไป repository layer

#### Wave D: Supporting Modules

เป้าหมาย:

- ทำให้ modules รองใช้ pattern เดียวกันกับ modules หลัก

tasks:

- refactor `settings`
- refactor `master-data`
- refactor `imports`
- refactor `automation`

### Phase 4: Legacy Removal

#### Task 4.1: ถอด legacy database runtime

- ถอด runtime schema bootstrap
- ถอด `DatabaseModule`
- ถอด `DatabaseService`
- ถอด direct `pg` runtime usage ในโมดูลที่ย้ายแล้ว

#### Task 4.2: ปรับเอกสารและ runbook

- update README
- update migration/runbook
- กำหนด flow ของ schema change ให้ผ่าน migration เท่านั้น

### Phase 5: Deferred Student Auth หลังปิดทุก Wave

หมายเหตุ:

- phase นี้เป็นงานถัดไปหลังจาก implement/refactor ทุก wave หลักเสร็จแล้ว
- เป้าหมายคือปลดล็อก `student-self` flow ระหว่างที่ยังไม่มี ThaID beta mock จริง

#### Task 5.1: Student Login ผ่าน Mock ThaID

เป้าหมาย:

- ทำ mock ThaID login เพื่อพัฒนา student session และ `/my-attendance` ได้ก่อน
- ใช้ `PersonID_Onec` เป็น key หลักในการ link กับ `student_term`
- ใช้ `virtual session` สำหรับนักเรียน โดยไม่บังคับให้มี `users` row

tasks:

- เพิ่ม mock auth endpoint เช่น `POST /api/auth/thaid/mock/login`
- match `PersonID_Onec` จาก mock payload กับ `student_term`
- คืน `AuthUser` shape พร้อม `virtual_auth_token`
- เพิ่ม header auth ใหม่ เช่น `x-virtual-auth` สำหรับ virtual student session
- ปรับ auth actor loading ให้ verify virtual token และ hydrate student actor ได้
- ปรับปุ่ม ThaID บนหน้า login ให้เข้า mock flow เมื่ออยู่ใน mock mode
- ใช้ข้อมูลชื่อ/นามสกุลจาก `student_term` เป็น source of truth
- ยังไม่ใช้ `external_users` ใน v1 นี้
- ไม่ auto-create `users` row สำหรับนักเรียน

## ลำดับ implement ที่แนะนำ

1. Foundation
2. TypeORM bootstrap + migrations
3. `task`
4. `users` + `auth`
5. `attendance`
6. `settings` / `master-data` / `imports`
7. legacy cleanup
8. deferred `student login + ThaID mock`
9. deferred `Pinia migration pass`

## Public APIs / Internal Interfaces

public REST routes:

- สำหรับ phases หลักเดิม: ไม่เปลี่ยน
- สำหรับ deferred student auth: เพิ่ม `POST /api/auth/thaid/mock/login`

response shapes:

- สำหรับ phases หลักเดิม: ไม่เปลี่ยน
- สำหรับ deferred student auth: เพิ่ม `virtual_auth_token` ใน session `AuthUser` shape

internal changes:

- constructors เปลี่ยนจาก `DatabaseService` ไป repository หรือ `DataSource`
- เพิ่ม DTOs สำหรับ body/query/param contracts
- เพิ่ม entity classes
- ย้าย transaction handling ไป TypeORM primitives
- ช่วง transition อนุญาต `DataSource` สำหรับ query ซับซ้อนที่ยังไม่พร้อมย้ายเข้า repository เต็มรูปแบบ
- deferred student auth เพิ่ม virtual student session transport ผ่าน header เช่น `x-virtual-auth`

## Test Plan

regression coverage สำหรับ:

- login
- users CRUD
- role groups
- create task
- fetch task by token
- OTP verify
- delegation
- submission
- attendance save
- settings CRUD
- mock ThaID login
- `/my-attendance` ด้วย virtual student session

migration tests:

- DB ว่าง
- DB ที่มีข้อมูลเดิม

transaction rollback tests:

- create task
- attendance batch write
- create/update user

acceptance:

- API contract เดิม
- ไม่มี runtime schema bootstrap
- ไม่มี direct `pg.Pool` usage ในโมดูลที่ย้ายแล้ว
- student mock login ไม่กระทบ normal login หรือ magic login เดิม

Execution ต่อ 1 wave ของ backend:

- รัน `npm run lint` ใน `nest-backend`
- รัน `npm run build` ใน `nest-backend`
- รัน `npm run test` เมื่อมีการแตะ service/controller/guard/utility ที่มี unit test รองรับหรือควรมี regression check
- รัน `npm run test:e2e` เมื่อมีการเปลี่ยน route contract, auth flow, middleware/guard behavior, หรือ flow ที่กระทบ HTTP integration
- ถ้ายังไม่มี automated test ครอบจุดที่แก้ ให้เพิ่ม targeted tests ใน wave นั้นหรืออย่างน้อยทำ manual API smoke test ก่อนปิดงาน

## Definition of Done ต่อ 1 Task

- controller ใช้ DTOs และ pipes แทน manual parsing
- controller บางและไม่ query DB ตรง
- service concern แคบลง
- guard ไม่แบก business/data loading เกินบทบาท auth/authz
- persistence อยู่ใน repository หรือ data layer ที่ชัด
- error handling สอดคล้องกัน
- API behavior เดิม
- regression/smoke test ที่เกี่ยวข้องผ่าน
- `lint` ผ่าน
- `build` ผ่าน
- tests ที่เกี่ยวข้องผ่าน

## จุดเริ่มต้นที่แนะนำ

- เริ่มจาก backend foundation ก่อน
- feature pilot แรกคือ `task` เพราะเป็นจุดรวม complexity สูงสุดของระบบ

## Checklist

### Foundation Checklist

- [x] inventory endpoints/modules ที่ใช้ `any`
- [x] inventory จุดที่มี manual validation
- [x] inventory จุดที่มี manual `HttpException` mapping
- [x] inventory จุดที่ service โหลด `.env` เองหรือ bootstrap runtime config เอง
- [x] inventory จุดที่ guard แบก actor loading/permission resolution
- [x] เพิ่ม typed config
- [x] เพิ่ม global `ValidationPipe`
- [x] เพิ่ม global exception filter
- [x] สร้าง `CurrentUser` decorator และ actor type กลาง
- [x] กำหนด responsibility ของ controller / guard / service / repository
- [x] กำหนดแนวทาง response serialization/interceptor สำหรับจุดที่มี mapping ซ้ำ

### TypeORM Foundation Checklist

- [x] ติดตั้ง TypeORM packages
- [x] ตั้งค่า `TypeOrmModule.forRootAsync`
- [x] สร้าง baseline entities
- [x] inventory schema objects/seed ที่ `runMigrations()` สร้างอยู่ในปัจจุบัน
- [x] กำหนด entity/table/column naming strategy สำหรับ legacy schema
- [x] สร้าง baseline migration
- [x] ย้าย seed roles/system settings
- [x] ตั้ง `synchronize: false`
- [x] กำหนด query policy: repository vs query builder vs raw SQL ผ่าน `DataSource`
- [x] กำหนด transaction boundary สำหรับ use cases หลัก
- [x] ตรวจ parity ระหว่าง baseline migration กับ runtime bootstrap เดิมก่อนถอด `DatabaseService`

### Wave A: Task Domain Checklist

- [x] แตก `task.service.ts`
- [x] แยก task create flow
- [x] แยก OTP/login-link flow
- [x] แยก submission flow
- [x] แยก stats read-model
- [x] ย้าย queries ไป repository/data source layer

### Wave B: Users And Auth Checklist

- [x] เพิ่ม DTOs ให้ users endpoints
- [x] แยก role-group management จาก user CRUD
- [x] ย้าย actor loading/permission resolution ออกจาก guard
- [x] แยก password migration concern

### Wave C: Attendance Checklist

- [x] เพิ่ม query/body DTOs
- [x] แยก lookup/read/write concerns
- [x] ย้าย attendance persistence ไป repository layer

### Wave D: Supporting Modules Checklist

- [x] refactor `settings`
- [x] refactor `master-data`
- [x] refactor `imports`
- [x] refactor `automation`

### Legacy Removal Checklist

- [x] ถอด runtime schema bootstrap
- [x] ถอด `DatabaseService`
- [x] ถอด runtime direct `pg` usage
- [x] update README/runbook

### Phase 5: Deferred Student Auth Checklist

- [x] เพิ่ม mock ThaID login endpoint
- [x] match `PersonID_Onec` กับ `student_term`
- [x] เพิ่ม `virtual_auth_token` ใน session user shape
- [x] เพิ่ม `x-virtual-auth` request header path
- [x] hydrate student actor จาก virtual token
- [x] ปรับ login page ให้เข้า mock ThaID flow ได้
- [x] `/my-attendance` ใช้งานได้ด้วย virtual student session
- [x] ยืนยันว่า normal login และ magic login ไม่ regress

### Verification Checklist ต่อ 1 Wave

- [ ] API contract เดิม
- [ ] DTO/validation ครบใน endpoints ที่ย้ายแล้ว
- [ ] ไม่มี `any` ใหม่ใน controller contracts
- [ ] controller ของโมดูลที่ย้ายแล้วไม่ query DB ตรง
- [ ] guard ของโมดูลที่ย้ายแล้วเหลือบทบาท auth/authz เป็นหลัก
- [ ] query/persistence อยู่ใน repository/data layer ที่ชัด
- [ ] ไม่มี direct `pg` usage ในโมดูลที่ย้ายแล้ว
- [ ] regression/smoke test ที่เกี่ยวข้องผ่าน
- [ ] `lint` ผ่าน
- [ ] `build` ผ่าน
- [ ] tests ที่เกี่ยวข้องผ่าน

## Git Commit Plan

เป้าหมายของ section นี้คือแยก commit ตาม concern เพื่อให้อ่านย้อนหลังง่าย, revert ได้เฉพาะก้อน, และไม่ต้องรวมทุกอย่างไว้ใน commit เดียว

ขอบเขตของ plan นี้:

- commit เฉพาะไฟล์ที่เป็น `refactor code/config/docs` ของรอบนี้
- ไม่รวมไฟล์ data dump, ไฟล์ export, ไฟล์รูป, เอกสารแนบ, และ runtime upload artifacts

กติกาก่อนเริ่ม stage:

- อย่าเอาไฟล์พวก `SBP_RTM_UML.xlsx`, `Software Requirements Specification (SRS).docx`, `export_data.sql`, `sts_backup_1.sql`, `*.sql`, `*.docx`, `*.xlsx`, `*.png`, `*.jpg`, `*.jpeg`, `nest-backend/uploads/*` เข้า refactor commits ชุดนี้ เว้นแต่ตั้งใจจะ commit artifacts เหล่านั้นแยกต่างหาก
- ถ้า `.gitignore` ถูกแก้เพื่อรองรับ workflow ใหม่จริง ให้ commit ไปกับชุด `infrastructure/docs` หรือ `legacy removal`
- ใช้ `git add <paths...>` แบบระบุ path ชัดเจน ไม่ใช้ `git add .`
- ถ้ามีไฟล์เดียวกันถูกแตะจากหลาย concern ให้ stage ตาม concern หลักของไฟล์นั้น ไม่ต้องพยายามแยก hunk เว้นแต่จำเป็นจริง

### ชุด Commit ที่แนะนำ

1. `docs: capture refactor plan and repository architecture`

ไฟล์หลัก:

- `REFACTOR_PLAN.md`
- `README.md`
- `quasar-frontend/README.md`
- `nest-backend/README.md`
- `quasar-frontend/docs/**`
- `nest-backend/docs/**`

หมายเหตุ:

- commit นี้เป็นเอกสารล้วน ควรแยกจาก code changes เพื่อให้ review ง่าย

2. `refactor(frontend): add shared types, services, and utility helpers`

ไฟล์หลัก:

- `quasar-frontend/src/types/**`
- `quasar-frontend/src/services/**`
- `quasar-frontend/src/utils/**`
- `quasar-frontend/src/constants/permissions.ts`
- `quasar-frontend/package.json`
- `quasar-frontend/package-lock.json`

หมายเหตุ:

- ชุดนี้คือรากฐานของ frontend refactor
- ถ้า `package.json` มีทั้ง service/refactor และ Pinia อยู่ด้วย ให้ย้าย `package.json` ไป commit Pinia แทน แล้วปล่อยชุดนี้เป็น code-only ได้

3. `refactor(frontend): extract shared composables and student flows`

ไฟล์หลัก:

- `quasar-frontend/src/composables/useAsyncState.ts`
- `quasar-frontend/src/composables/usePaginationState.ts`
- `quasar-frontend/src/composables/useSearchFilterState.ts`
- `quasar-frontend/src/composables/useAttendanceFilters.ts`
- `quasar-frontend/src/composables/useStudentList.ts`
- `quasar-frontend/src/pages/StudentsPage.vue`
- `quasar-frontend/src/pages/StudentInformationPage.vue`
- `quasar-frontend/src/pages/StudentSelfPage.vue`
- `quasar-frontend/src/components/students/**`

หมายเหตุ:

- ชุดนี้ครอบ `Wave B + Wave C` ฝั่ง frontend เป็นหลัก

4. `refactor(frontend): separate attendance and dashboard flows`

ไฟล์หลัก:

- `quasar-frontend/src/composables/useAttendanceHistory.ts`
- `quasar-frontend/src/composables/useAttendanceSubmission.ts`
- `quasar-frontend/src/composables/useAttendanceDashboardData.ts`
- `quasar-frontend/src/composables/useCaseDashboardData.ts`
- `quasar-frontend/src/composables/useOverviewDashboardData.ts`
- `quasar-frontend/src/composables/useCaseTaskDetail.ts`
- `quasar-frontend/src/composables/useTaskLinkAdminDialog.ts`
- `quasar-frontend/src/pages/AttendancePage.vue`
- `quasar-frontend/src/pages/AttendanceDashboardPage.vue`
- `quasar-frontend/src/pages/IndexPage.vue`
- `quasar-frontend/src/pages/MainPage.vue`
- `quasar-frontend/src/pages/TaskDetailPage.vue`
- `quasar-frontend/src/layouts/MainLayout.vue`
- `quasar-frontend/src/components/attendance/**`
- `quasar-frontend/src/components/dashboard/**`
- `quasar-frontend/src/components/task/TaskLinkAdminDialog.vue`
- `quasar-frontend/src/css/app.scss`

หมายเหตุ:

- ชุดนี้ครอบ `Wave D + Wave F`
- ถ้าอยากแยกละเอียดขึ้น สามารถ split เป็น `attendance` กับ `dashboard/case` สอง commits ได้

5. `refactor(frontend): extract task creation, access, and login-link flows`

ไฟล์หลัก:

- `quasar-frontend/src/composables/useTaskFormFlow.ts`
- `quasar-frontend/src/composables/useMagicTaskSession.ts`
- `quasar-frontend/src/composables/useLoginTaskForm.ts`
- `quasar-frontend/src/composables/useLoginLinkDialogs.ts`
- `quasar-frontend/src/pages/CreateTaskPage.vue`
- `quasar-frontend/src/pages/LoginLinksPage.vue`
- `quasar-frontend/src/pages/TaskGuestPage.vue`
- `quasar-frontend/src/pages/DelegatePage.vue`
- `quasar-frontend/src/pages/MagicLoginPage.vue`
- `quasar-frontend/src/pages/ReportPage.vue`
- `quasar-frontend/src/components/task/**`

หมายเหตุ:

- ชุดนี้ตรงกับ `Wave E`

6. `refactor(frontend): modularize user, role, settings, import, and status pages`

ไฟล์หลัก:

- `quasar-frontend/src/composables/useManageUsersPage.ts`
- `quasar-frontend/src/composables/useUserScopeForm.ts`
- `quasar-frontend/src/composables/useRoleGroupsPage.ts`
- `quasar-frontend/src/composables/useSystemSettingsPage.ts`
- `quasar-frontend/src/composables/useImportDataPage.ts`
- `quasar-frontend/src/pages/ManageUserPage.vue`
- `quasar-frontend/src/pages/RoleGroupsPage.vue`
- `quasar-frontend/src/pages/SystemSettingsPage.vue`
- `quasar-frontend/src/pages/ImportDataPage.vue`
- `quasar-frontend/src/pages/SuccessPage.vue`
- `quasar-frontend/src/pages/ExpiredPage.vue`
- `quasar-frontend/src/pages/LockedPage.vue`
- `quasar-frontend/src/pages/ForbiddenPage.vue`
- `quasar-frontend/src/pages/ErrorNotFound.vue`
- `quasar-frontend/src/components/users/**`
- `quasar-frontend/src/components/status/**`
- `quasar-frontend/src/router/routes.ts`

หมายเหตุ:

- ชุดนี้ครอบ `Wave G + Wave H + Wave I`

7. `feat(frontend): add Mock ThaID login and unify student self route`

ไฟล์หลัก:

- `quasar-frontend/src/pages/AdminAccessPage.vue`
- `quasar-frontend/src/pages/StudentInformationPage.vue`
- `quasar-frontend/src/router/index.ts`
- `quasar-frontend/src/router/routes.ts`
- `quasar-frontend/src/boot/axios.ts`
- `quasar-frontend/quasar.config.ts`
- `quasar-frontend/src/types/auth.ts`
- `quasar-frontend/src/services/authService.ts`

หมายเหตุ:

- ชุดนี้เป็น feature หลังจบ waves หลัก ไม่ควรปนกับ refactor waves เดิม

8. `feat(frontend): introduce Pinia for shared session and cache state`

ไฟล์หลัก:

- `quasar-frontend/src/boot/pinia.ts`
- `quasar-frontend/src/stores/**`
- `quasar-frontend/src/composables/useAuthSession.ts`
- `quasar-frontend/src/composables/authSessionState.ts`
- `quasar-frontend/src/composables/useCaseNotifications.ts`
- `quasar-frontend/src/composables/caseNotificationState.ts`
- `quasar-frontend/src/composables/useAttendanceFilters.ts`
- `quasar-frontend/src/composables/useUserStore.ts`
- `quasar-frontend/package.json`
- `quasar-frontend/package-lock.json`

หมายเหตุ:

- ชุดนี้ควรอยู่ commit แยก เพราะเป็น state-management pass ที่มีผลกว้าง

9. `chore(frontend): add verification scripts and refactor gate checks`

ไฟล์หลัก:

- `quasar-frontend/scripts/**`
- `quasar-frontend/docs/frontend-verification-gate.md`
- ถ้าจำเป็นรวม `quasar-frontend/package.json` และ `quasar-frontend/package-lock.json` ด้วยเมื่อมี script ใหม่

หมายเหตุ:

- ถ้า `package.json` ถูกใช้ทั้งใน commit Pinia และ commit scripts ให้ตัดสินใจเลือก commit ที่สะท้อน dependency/script change เด่นที่สุด แล้วปล่อยอีก commit เป็น code-only

10. `refactor(backend): add platform foundation and TypeORM baseline`

ไฟล์หลัก:

- `nest-backend/src/main.ts`
- `nest-backend/src/app.module.ts`
- `nest-backend/src/config/**`
- `nest-backend/src/common/filters/**`
- `nest-backend/src/common/validation/**`
- `nest-backend/src/common/utils/request-url.ts`
- `nest-backend/src/database/bootstrap-sql.ts`
- `nest-backend/src/database/entities/**`
- `nest-backend/src/database/migrations/**`
- `nest-backend/src/database/legacy.naming-strategy.ts`
- `nest-backend/src/database/sql-query.ts`
- `nest-backend/src/database/typeorm.config.ts`
- `nest-backend/src/database/typeorm.datasource.ts`
- `nest-backend/src/scripts/verify_bootstrap_parity.ts`
- `nest-backend/package.json`
- `nest-backend/package-lock.json`

หมายเหตุ:

- ชุดนี้คือ foundation + migration-first direction

11. `refactor(backend): split task domain into repository and focused services`

ไฟล์หลัก:

- `nest-backend/src/task/**`
- `nest-backend/src/auth/permissions.constants.ts`
- `nest-backend/src/auth/permissions.decorator.ts`
- `nest-backend/src/common/utils/authorization.ts`

หมายเหตุ:

- ชุดนี้ตรงกับ `Wave A`
- ถ้า admin task-link behavior ใน `/dashboard` ถูกแก้ภายหลังในรอบเดียวกัน ให้อยู่ commit นี้

12. `refactor(backend): separate users and auth concerns`

ไฟล์หลัก:

- `nest-backend/src/users/**`
- `nest-backend/src/auth/auth.guard.ts`
- `nest-backend/src/auth/auth.module.ts`
- `nest-backend/src/auth/index.ts`
- `nest-backend/src/auth/auth-actor.service.ts`
- `nest-backend/src/auth/auth.controller.ts`
- `nest-backend/src/auth/auth.types.ts`
- `nest-backend/src/auth/current-user.decorator.ts`
- `nest-backend/src/auth/dto/**`
- `nest-backend/src/auth/password.service.ts`

หมายเหตุ:

- ชุดนี้ตรงกับ `Wave B`

13. `refactor(backend): modularize attendance and supporting modules`

ไฟล์หลัก:

- `nest-backend/src/attendance/**`
- `nest-backend/src/settings/**`
- `nest-backend/src/master-data/**`
- `nest-backend/src/imports/**`
- `nest-backend/src/automation/**`
- `nest-backend/src/common/interceptors/file-upload.interceptor.ts`

หมายเหตุ:

- ชุดนี้ครอบ `Wave C + Wave D`

14. `refactor(backend): remove legacy database runtime and clean up students module`

ไฟล์หลัก:

- `nest-backend/src/students/**`
- `nest-backend/src/database/database.module.ts`
- `nest-backend/src/database/database.service.ts`
- ทุกไฟล์ที่เปลี่ยนจาก `DatabaseService` ไป `DataSource`
- `nest-backend/src/auth/auth-actor.service.ts` ถ้าแตะจากการ cutover data loading

หมายเหตุ:

- ชุดนี้ครอบ `Legacy Removal` และ `students cleanup`

15. `feat(auth): add Mock ThaID virtual student session`

ไฟล์หลัก:

- `nest-backend/src/auth/student-auth.service.ts`
- `nest-backend/src/auth/auth.controller.ts`
- `nest-backend/src/auth/auth-actor.service.ts`
- `nest-backend/src/auth/auth.types.ts`
- `nest-backend/src/auth/auth.module.ts`
- `nest-backend/src/auth/dto/**`
- `nest-backend/src/students/students.controller.ts`
- `nest-backend/src/students/students.service.ts`
- `nest-backend/src/auth/auth-actor.service.spec.ts`

หมายเหตุ:

- commit นี้ควรจับคู่กับ frontend Mock ThaID commit หรือแยกเป็น backend/frontend คนละ commit ก็ได้ถ้าต้องการ review ง่ายขึ้น

### ลำดับ Commit แบบ Practical ที่แนะนำ

ถ้าต้องการจำนวน commit ไม่เยอะเกินไป ให้ใช้ลำดับนี้:

1. docs plan/readmes
2. frontend shared foundation
3. frontend student + attendance lookup
4. frontend attendance + dashboard
5. frontend task/access
6. frontend admin/settings/import/status
7. frontend Mock ThaID
8. frontend Pinia + verification scripts
9. backend foundation + TypeORM
10. backend task
11. backend users/auth
12. backend attendance + supporting modules
13. backend legacy removal + students cleanup
14. backend Mock ThaID

### คำสั่ง Stage ตัวอย่าง

ตัวอย่างเชิงรูปแบบ:

- `git add REFACTOR_PLAN.md README.md quasar-frontend/README.md nest-backend/README.md quasar-frontend/docs nest-backend/docs`
- `git add quasar-frontend/src/types quasar-frontend/src/services quasar-frontend/src/utils quasar-frontend/src/constants/permissions.ts`
- `git add quasar-frontend/src/stores quasar-frontend/src/boot/pinia.ts quasar-frontend/src/composables/useAuthSession.ts quasar-frontend/src/composables/authSessionState.ts quasar-frontend/src/composables/useCaseNotifications.ts quasar-frontend/src/composables/caseNotificationState.ts quasar-frontend/src/composables/useAttendanceFilters.ts quasar-frontend/src/composables/useUserStore.ts quasar-frontend/package.json quasar-frontend/package-lock.json`
- `git add nest-backend/src/database nest-backend/src/config nest-backend/src/common/filters nest-backend/src/common/validation nest-backend/src/main.ts nest-backend/src/app.module.ts nest-backend/package.json nest-backend/package-lock.json`

ถ้าจะตรวจว่ามีไฟล์หลุดจากชุดหรือไม่ ให้ใช้:

- `git diff --cached --name-only`
- `git status --short`

แล้ว commit เฉพาะเมื่อชุดนั้นอ่านแล้ว “เล่าเรื่องเดียว” ได้ชัด

### Validation Checklist ต่อ Commit

หลักการ:

- ไม่จำเป็นต้องรันทุกอย่างหลังทุก commit
- ให้รันเฉพาะชุดที่สัมพันธ์กับ scope ของ commit นั้น
- ถ้า commit ไหนแตะทั้ง frontend และ backend ให้รันแยกสองฝั่ง

#### Commit 0: docs plan/readmes

หลัง commit นี้:

- ตรวจว่า `git status --short` ไม่เหลือไฟล์ docs ที่ควรอยู่ชุดเดียวกัน
- ไม่จำเป็นต้องรัน `lint/build`

#### Commit FE-1: shared types/services/utils

หลัง commit นี้ให้รัน:

- `cd quasar-frontend && npm run lint`
- `cd quasar-frontend && npm run build`
- ถ้ามีเวลาให้รัน `cd quasar-frontend && npm run verify:refactor-boundaries`

เช็ก manual สั้น ๆ:

- เปิด `/students`
- เปิด `/attendance`
- เปิด `/create`

#### Commit FE-2: auth/session + student self access

หลัง commit นี้ให้รัน:

- `cd quasar-frontend && npm run lint`
- `cd quasar-frontend && npm run build`
- `cd quasar-frontend && npm run verify:routes`

เช็ก manual สั้น ๆ:

- normal login
- logout
- session restore หลัง refresh
- `/my-attendance`
- magic login route ว่ายังเปิดได้

#### Commit FE-3: students + attendance lookup + attendance flow

หลัง commit นี้ให้รัน:

- `cd quasar-frontend && npm run lint`
- `cd quasar-frontend && npm run build`

เช็ก manual สั้น ๆ:

- `/students` list/filter/search
- student detail
- `/attendance` load students
- `/attendance` save attendance
- `/attendance-dashboard` summary/list

#### Commit FE-4: task/dashboard/admin feature pages

หลัง commit นี้ให้รัน:

- `cd quasar-frontend && npm run lint`
- `cd quasar-frontend && npm run build`

เช็ก manual สั้น ๆ:

- `/dashboard`
- `/task-detail/:id`
- `/create`
- `/login-links`
- `/task/:token`
- `/delegate`
- `/manage-role-groups`
- `/manage-users`
- `/settings`

#### Commit FE-5: import/status pages + Pinia + verification scripts

หลัง commit นี้ให้รัน:

- `cd quasar-frontend && npm run lint`
- `cd quasar-frontend && npm run build`
- `cd quasar-frontend && npm run verify:frontend-gate`
- `cd quasar-frontend && npm run verify:pinia-migration`

เช็ก manual สั้น ๆ:

- `/import-data`
- `/task/:token/success`
- `/task/:token/expired`
- `/task/:token/locked?reason=test`
- `/forbidden`
- 404 route
- notification dropdown
- login แล้ว refresh session

#### Commit BE-1: backend platform foundation

หลัง commit นี้ให้รัน:

- `cd nest-backend && npm run build`
- ถ้ามี script lint ใช้ได้ในเวลานั้นให้รัน `cd nest-backend && npm run lint`

เช็ก manual/API smoke สั้น ๆ:

- normal login
- users endpoint ที่แตะ validation
- settings save 1 รอบ

#### Commit BE-2: TypeORM foundation + migration baseline

หลัง commit นี้ให้รัน:

- `cd nest-backend && npm run build`
- `cd nest-backend && npm run bootstrap:verify-parity`
- `cd nest-backend && npm run migration:show`

ถ้าจะเช็ก runtime ต่อ:

- `cd nest-backend && npm run migration:run`

#### Commit BE-3: task domain

หลัง commit นี้ให้รัน:

- `cd nest-backend && npm run build`
- ถ้ามี targeted lint ให้รัน `cd nest-backend && ./node_modules/.bin/eslint src/task/**/*.ts`

เช็ก manual/API smoke สั้น ๆ:

- create task
- verify token
- OTP flow
- delegate
- report submit
- admin lock/unlock link

#### Commit BE-4: users/auth + Mock ThaID

หลัง commit นี้ให้รัน:

- `cd nest-backend && npm run build`
- `cd nest-backend && npm test -- --runTestsByPath src/auth/auth-actor.service.spec.ts`

เช็ก manual/API smoke สั้น ๆ:

- normal login
- role groups CRUD
- users CRUD
- Mock ThaID login
- `/my-attendance`
- magic login regression

#### Commit BE-5: attendance + supporting modules

หลัง commit นี้ให้รัน:

- `cd nest-backend && npm run build`
- ถ้ามี targeted lint ให้รัน `cd nest-backend && ./node_modules/.bin/eslint src/attendance/**/*.ts src/settings/**/*.ts src/master-data/**/*.ts src/imports/**/*.ts src/automation/**/*.ts`

เช็ก manual/API smoke สั้น ๆ:

- attendance save/history
- attendance dashboard list
- settings CRUD
- master-data CRUD
- import flow
- automation immediate trigger

#### Commit BE-6: legacy removal + students cleanup

หลัง commit นี้ให้รัน:

- `cd nest-backend && npm run build`
- `cd nest-backend && npm run bootstrap:verify-parity`

เช็ก manual/API smoke สั้น ๆ:

- `/students`
- student detail
- `/my-attendance`
- login
- settings
- import

#### Commit Optional: .gitignore

หลัง commit นี้:

- ตรวจว่า `git status --short` ไม่มีไฟล์ refactor ที่ควรถูก ignore โดยผิดพลาด

### กฎตัดสินใจว่าพร้อม commit หรือยัง

commit ใดพร้อมปิดเมื่อ:

- `git diff --cached --name-only` อ่านแล้วเป็น concern เดียว
- ไม่มีไฟล์ artifacts ปน
- command ขั้นต่ำของ commit นั้นผ่าน
- smoke test ขั้นต่ำของ commit นั้นผ่านหรืออย่างน้อยถูกบันทึกว่าเช็กแล้ว
