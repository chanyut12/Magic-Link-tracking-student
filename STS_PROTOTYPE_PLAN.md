# STS Task Delegation Chain — Prototype (PoC) Plan

> **เป้าหมาย:** พิสูจน์ว่าระบบ "ส่งต่อภารกิจลงพื้นที่เป็นทอดๆ" ทำงานได้จริง  
> **แนวทาง:** Low-tech, ใช้ HTML + CSS + JavaScript ล้วน (Vanilla), ไม่พึ่ง Framework หนัก  
> **Responsive:** รองรับหน้าจอโทรศัพท์มือถือเป็นหลัก (Mobile-first)

---

## 1. สรุปความเข้าใจ (Project Understanding)

### ปัญหาที่ต้องแก้
เด็กที่หลุดจากระบบการศึกษา (ขาดเรียนต่อเนื่อง) ต้องถูกติดตามโดยบุคลากรหลายระดับ เช่น ครู → ผู้ใหญ่บ้าน → อสม. แต่คนเหล่านี้ **ไม่มี Account ในระบบ** และ **ไม่สะดวกลงแอป** ดังนั้นจึงต้องใช้ **Magic Link** ส่งผ่าน LINE ให้เปิดบน Browser ได้เลย

### Core Concept: Task Delegation Chain
```
ผอ. สร้างภารกิจ
  └─ ส่ง Magic Link ให้ ผู้ใหญ่บ้าน A
       ├─ [ทางเลือก 1] ผู้ใหญ่บ้าน A ลงพื้นที่เอง → ส่งรายงาน → จบ
       └─ [ทางเลือก 2] ผู้ใหญ่บ้าน A ไม่ว่าง → กด "ส่งต่อ"
            └─ ระบบสร้าง Link ใหม่ → ส่งให้ อสม. B
                 └─ อสม. B ลงพื้นที่ → ถ่ายรูป + GPS → ส่งรายงาน → จบ
```

### สิ่งที่ ผอ. เห็นบน Dashboard (Audit Trail)
```
📍 ผอ. มอบหมายให้ → ผู้ใหญ่บ้าน A (10:00 น.)
🔄 ผู้ใหญ่บ้าน A ส่งต่อให้ → อสม. B (11:30 น.)
✅ อสม. B ลงพื้นที่สำเร็จ (14:00 น.) — พร้อมรูปถ่าย + พิกัด
```

---

## 2. Technology Stack (PoC — Low-Tech)

| Layer | Technology | เหตุผล |
|-------|-----------|--------|
| **Frontend** | HTML + CSS + Vanilla JavaScript | ง่าย, ไม่ต้อง build, เปิดได้ทุก browser |
| **Responsive** | CSS Media Queries / Flexbox / Grid | Mobile-first, ไม่ต้องพึ่ง framework |
| **Backend** | Node.js + Express.js | เรียบง่าย, มี ecosystem ใหญ่ |
| **Database** | SQLite (via better-sqlite3) | ไม่ต้องติดตั้ง server แยก, ไฟล์เดียวจบ |
| **Token** | crypto.randomBytes(32) | สร้าง token ที่เดาไม่ได้ |
| **File Upload** | เก็บลง local folder (`/uploads`) | ไม่ต้องพึ่ง cloud storage |
| **Map** | Leaflet.js + OpenStreetMap | ฟรี, ไม่ต้อง API key |
| **GPS** | HTML5 Geolocation API | built-in ใน browser |
| **QR Code** | qrcode (npm library, server-side render) | สร้าง QR ได้ง่าย |

---

## 3. Database Schema (SQLite Version)

```sql
-- เคสเด็กที่ต้องติดตาม
CREATE TABLE cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    student_school TEXT,
    student_address TEXT,
    student_lat REAL,
    student_lng REAL,
    reason_flagged TEXT,
    status TEXT DEFAULT 'OPEN',  -- OPEN, IN_PROGRESS, RESOLVED
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ภารกิจลงพื้นที่
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,  -- UUID
    case_id INTEGER REFERENCES cases(id),
    status TEXT DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, COMPLETED
    max_delegation_depth INTEGER DEFAULT 3,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ลิงก์ชั่วคราว (หัวใจของ Delegation Chain)
CREATE TABLE task_links (
    id TEXT PRIMARY KEY,  -- UUID
    task_id TEXT REFERENCES tasks(id),
    parent_link_id TEXT REFERENCES task_links(id),  -- NULL = ลิงก์แรก
    token TEXT NOT NULL UNIQUE,
    delegation_depth INTEGER DEFAULT 0,
    assigned_to_name TEXT,
    assigned_to_phone TEXT,
    status TEXT DEFAULT 'ACTIVE',  -- ACTIVE, DELEGATED, COMPLETED, EXPIRED
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- รายงานจากการลงพื้นที่
CREATE TABLE task_submissions (
    id TEXT PRIMARY KEY,  -- UUID
    task_link_id TEXT REFERENCES task_links(id),
    visit_lat REAL,
    visit_lng REAL,
    cause_category TEXT,  -- POVERTY, ILLNESS, FAMILY_ISSUE, TRANSPORTATION, OTHER
    cause_detail TEXT,
    photo_paths TEXT,     -- JSON array ของ paths
    recommendation TEXT,
    submitted_at TEXT DEFAULT (datetime('now','localtime'))
);
```

---

## 4. หน้าจอทั้งหมด (Page Map)

| # | หน้า | URL | ผู้ใช้ | คำอธิบาย |
|---|------|-----|--------|----------|
| 1 | **Dashboard** | `/` | ผอ./ครู | ดูรายการเคสทั้งหมด + สถานะ + กรองตามวันที่/โรงเรียน/สถานะลิงก์ |
| 2 | **สร้างภารกิจ** | `/create` | ผอ./ครู | สร้างเคส + ภารกิจ → ได้ Magic Link + QR |
| 3 | **ดูภารกิจ** | `/task/:token` | ผู้รับลิงก์ | ดูข้อมูลเด็ก + แผนที่ + เลือก "ทำเอง" หรือ "ส่งต่อ" |
| 4 | **ส่งต่อภารกิจ** | `/task/:token/delegate` | ผู้รับลิงก์ | กรอกชื่อคนรับงานใหม่ → ได้ลิงก์ใหม่ |
| 5 | **ส่งรายงาน** | `/task/:token/report` | ผู้ลงพื้นที่ | กรอกข้อมูล + แนบรูป + GPS |
| 6 | **สำเร็จ** | `/task/:token/success` | ผู้ลงพื้นที่ | ยืนยันส่งงานเรียบร้อย |
| 7 | **Audit Trail** | `/task-detail/:taskId` | ผอ./ครู | ดู Delegation Chain + ข้อมูลรายงาน |
| 8 | **Link หมดอายุ** | `/expired` | ใครก็ตาม | แจ้งว่า link หมดอายุแล้ว |

---

## 5. API Endpoints

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| `GET` | `/` | หน้า Dashboard |
| `GET` | `/create` | หน้าสร้างภารกิจ |
| `POST` | `/api/tasks` | สร้างภารกิจ + ลิงก์แรก |
| `GET` | `/api/tasks/:token` | ดึงข้อมูลภารกิจจาก token |
| `POST` | `/api/tasks/:token/delegate` | ส่งต่อภารกิจ |
| `POST` | `/api/tasks/:token/submit` | ส่งรายงาน + อัปโหลดรูป |
| `POST` | `/api/cases/:caseId/review` | ผอ./ผู้ดูแลบันทึกผลประเมิน (ASSIST/FORWARD/CLOSE) |
| `GET` | `/api/cases/:caseId/reviews` | ดูประวัติการประเมินเคส |
| `GET` | `/api/tasks/:taskId/chain` | ดึง Delegation Chain |
| `GET` | `/api/cases` | ดึงรายการเคสทั้งหมด (Dashboard) |

---

## 6. Core Flows (สิ่งที่ต้อง Proof)

### Flow A: สร้างภารกิจ + ส่งลิงก์
1. ผอ. เข้าหน้า Dashboard → กด "สร้างภารกิจ"
2. กรอกข้อมูลเด็ก + ชื่อผู้รับงาน
3. ระบบสร้าง token → แสดง Magic Link + QR Code
4. ผอ. copy link ไปส่งทาง LINE

### Flow B: รับลิงก์ + เลือกลงพื้นที่เอง
1. ผู้รับกดลิงก์ → เปิดหน้า Task View บน browser มือถือ
2. เห็นข้อมูลเด็ก + แผนที่ตำแหน่งบ้าน
3. กด "ลงพื้นที่เอง" → เปิดหน้า Report Form
4. กรอกสาเหตุ + ถ่ายรูป + ระบบดึง GPS
5. กด "ส่งรายงาน" → เคสเข้า `PENDING_REVIEW` เพื่อรอ ผอ.ประเมิน

### Flow C: รับลิงก์ + ส่งต่อให้คนอื่น
1. ผู้รับกดลิงก์ → เปิดหน้า Task View
2. กด "มอบหมายให้ผู้อื่น"
3. กรอกชื่อคนรับงานใหม่
4. ระบบ: ปิดลิงก์เดิม (DELEGATED) + สร้างลิงก์ใหม่
5. แสดงลิงก์ใหม่ + QR Code ให้ copy ส่งต่อ

### Flow D: ผอ. ดู Audit Trail
1. ผอ. เปิด Dashboard → เห็นสถานะเคสอัปเดต
2. คลิกดูรายละเอียด → เห็น Delegation Chain (Timeline)
3. เห็นว่าใครส่งต่อให้ใคร + ข้อมูลรายงาน + รูปถ่าย + พิกัด

### Flow E: ผอ. ประเมินผลหลังลงพื้นที่
1. เคสที่มีรายงานแล้วจะขึ้นสถานะ `PENDING_REVIEW`
2. ผอ. เปิดหน้า Task Detail แล้วเลือกผลประเมิน
3. เลือกได้ 3 ทาง: `ASSIST` / `FORWARD` / `CLOSE`
4. บันทึกหมายเหตุการประเมิน
5. ถ้าเลือก `CLOSE` เคสเป็น `RESOLVED`, หากเลือกอื่นเคสกลับไป `IN_PROGRESS`

---

## 7. Checklist ติดตามความก้าวหน้า

### Phase 1: Setup โปรเจค + Database
- [x] สร้างโครงสร้างโปรเจค (folders: `public/`, `views/`, `routes/`, `db/`)
- [x] ตั้งค่า `package.json` + ติดตั้ง dependencies (`express`, `better-sqlite3`, `uuid`, `multer`, `qrcode`)
- [x] สร้างไฟล์ `db/init.js` — สร้างตาราง SQLite ตาม schema
- [x] สร้างไฟล์ `server.js` — Express server พื้นฐาน
- [x] ทดสอบ: รัน server ได้, เปิดหน้าเว็บได้

### Phase 2: หน้า Dashboard + สร้างภารกิจ
- [x] สร้างหน้า Dashboard (`/`) — แสดงรายการเคสทั้งหมด (ตาราง)
- [x] สร้างหน้า Create Task (`/create`) — ฟอร์มกรอกข้อมูลเด็ก + ผู้รับงาน
- [x] สร้าง API `POST /api/tasks` — สร้าง case + task + task_link + token
- [x] แสดง Magic Link + QR Code หลังสร้างภารกิจสำเร็จ
- [x] ปุ่ม "คัดลอกลิงก์" (Copy to clipboard)
- [x] สร้าง API `GET /api/cases` — ดึงรายการเคสสำหรับ Dashboard
- [x] Responsive: Dashboard + Create Form ใช้งานได้ดีบนมือถือ

### Phase 3: หน้า Task View (เปิดจาก Magic Link)
- [x] สร้างหน้า Task View (`/task/:token`) — แสดงข้อมูลเด็ก (masked ตาม PDPA)
- [x] แสดงแผนที่ตำแหน่งบ้านเด็ก (Leaflet.js + OpenStreetMap)
- [x] ปุ่ม "เปิดใน Google Maps" สำหรับนำทาง
- [x] สร้าง API `GET /api/tasks/:token` — validate token + ดึงข้อมูล
- [x] จัดการกรณี: token หมดอายุ → redirect ไปหน้า `/expired`
- [x] จัดการกรณี: token ถูกใช้แล้ว → แสดงสถานะว่าเสร็จสิ้น/ถูกส่งต่อแล้ว
- [x] แสดงปุ่ม "ลงพื้นที่เอง" + "มอบหมายให้ผู้อื่น"
- [x] ซ่อนปุ่ม "มอบหมาย" หาก delegation_depth ถึง max แล้ว
- [x] Responsive: หน้า Task View ใช้ได้ดีบนมือถือ

### Phase 4: Delegation Flow (ส่งต่อภารกิจ)
- [x] สร้างหน้า Delegate Form (`/task/:token/delegate`) — กรอกชื่อ + เบอร์โทร
- [x] สร้าง API `POST /api/tasks/:token/delegate`
  - [x] Validate token (active, not expired)
  - [x] ตรวจสอบ delegation_depth < max_delegation_depth
  - [x] เปลี่ยนสถานะลิงก์เดิมเป็น DELEGATED
  - [x] สร้างลิงก์ใหม่ (parent_link_id ชี้กลับลิงก์เก่า, depth +1)
- [x] แสดง Magic Link ใหม่ + QR Code ให้ copy ส่งต่อ
- [x] Responsive: Delegate Form ใช้ได้ดีบนมือถือ

### Phase 5: Submit Report (ส่งรายงานลงพื้นที่)
- [x] สร้างหน้า Submit Report (`/task/:token/report`)
  - [x] ฟอร์มเลือกสาเหตุ (POVERTY, ILLNESS, FAMILY_ISSUE, TRANSPORTATION, OTHER)
  - [x] ช่องกรอกรายละเอียด
  - [x] ปุ่มถ่ายรูป / เลือกรูปจาก gallery (รองรับหลายรูป)
  - [x] ดึง GPS อัตโนมัติ (HTML5 Geolocation API)
  - [x] ช่องกรอกข้อเสนอแนะ
- [x] สร้าง API `POST /api/tasks/:token/submit`
  - [x] รับไฟล์รูป (multer) → เก็บลง `/uploads`
  - [x] บันทึกข้อมูลลง `task_submissions`
  - [x] เปลี่ยนสถานะ link → COMPLETED, task → COMPLETED
- [x] หน้า Success (`/task/:token/success`) — ยืนยันส่งงานเรียบร้อย
- [x] Responsive: Report Form + Success ใช้ได้ดีบนมือถือ

### Phase 6: Audit Trail (ผอ. ดูประวัติ)
- [x] สร้าง API `GET /api/tasks/:taskId/chain` — ดึง Delegation Chain (recursive query)
- [x] สร้างหน้า Task Detail (`/task-detail/:taskId`)
  - [x] แสดง Timeline ของ Delegation Chain (ใคร → ส่งต่อให้ใคร → เมื่อไหร่)
  - [x] แสดงข้อมูลรายงาน (สาเหตุ, รายละเอียด, ข้อเสนอแนะ)
  - [x] แสดงรูปถ่าย
  - [x] แสดงพิกัดที่ลงพื้นที่บนแผนที่
- [x] Dashboard แสดงสถานะเคสที่อัปเดตแล้ว (badge สี: pending/in_progress/completed)
- [x] Responsive: Audit Trail ใช้ได้ดีบนมือถือ

### Phase 7: Security + Edge Cases (เสริมความแข็งแกร่ง)
- [x] Token hashing (SHA-256) — เก็บเฉพาะ hash ใน DB
- [x] Data masking — ชื่อเด็กแสดงเป็น "ด.ช. สม****" สำหรับ Magic Link
- [x] Token expiry check — ลิงก์หมดอายุ (default 24 ชม.)
- [x] หน้า `/expired` — แสดงข้อความลิงก์หมดอายุสวยงาม
- [x] ป้องกัน double submit (ถ้า token COMPLETED แล้ว ไม่ให้ submit อีก)
- [x] Depth limit — ถ้าถึง max แล้วซ่อนปุ่มส่งต่อ + API reject
- [x] Input validation — ตรวจสอบ input ทุก field ทั้ง frontend + backend

### Phase 8: Polish + ทดสอบ End-to-End
- [x] ทดสอบ Flow A: สร้างภารกิจ → ได้ลิงก์ + QR
- [x] ทดสอบ Flow B: เปิดลิงก์ → ลงพื้นที่เอง → ส่งรายงาน → Dashboard อัปเดต
- [x] ทดสอบ Flow C: เปิดลิงก์ → ส่งต่อ → คนใหม่เปิดลิงก์ใหม่ → ส่งรายงาน → Dashboard อัปเดต
- [x] ทดสอบ Flow D: ดู Audit Trail → เห็น chain ครบถ้วน
- [x] ทดสอบ Edge: ลิงก์หมดอายุ → แสดงหน้า expired
- [x] ทดสอบ Edge: ส่งต่อเกิน max depth → ระบบปฏิเสธ
- [x] ทดสอบ Edge: เปิดลิงก์ที่ถูกใช้แล้ว → แสดงสถานะเหมาะสม
- [x] ทดสอบบนมือถือจริง (หรือ Chrome DevTools mobile mode)
- [x] UI สวยงาม อ่านง่าย ใช้สีและ icon สื่อความหมาย

### Phase 9: Director Review Workflow (ผอ.ประเมินหลังรายงาน)
- [x] เพิ่มสถานะเคส `PENDING_REVIEW`
- [x] ปรับ submit flow: ส่งรายงานแล้วเข้ารอประเมิน (ไม่ปิดเคสทันที)
- [x] เพิ่มตาราง `case_reviews` เก็บผลประเมิน + หมายเหตุ + ผู้ประเมิน + เวลา
- [x] เพิ่ม API `POST /api/cases/:caseId/review` (ASSIST/FORWARD/CLOSE)
- [x] เพิ่ม API `GET /api/cases/:caseId/reviews`
- [x] เพิ่ม UI หน้า Task Detail ให้ผอ.เลือกผลประเมินและดูประวัติ
- [x] อัปเดต Dashboard badge/stats รองรับเคสรอประเมิน
- [x] ทดสอบ e2e flow ใหม่ร่วมกับ flow เดิม

### Phase 10: Dashboard Filter Enhancements
- [x] เพิ่ม filter ช่วงวันที่ (date range)
- [x] เพิ่ม filter โรงเรียน (dropdown สร้างจากข้อมูลจริง)
- [x] เพิ่ม filter สถานะลิงก์ (Active / ถูกล็อก / ไม่มีลิงก์)
- [x] เพิ่มปุ่ม "ล้างตัวกรอง" สำหรับ reset ทุก filter
- [x] แก้ไข `isExecutiveCase()` ให้โหมดผู้บริหารแสดงเฉพาะเคสที่ต้องดำเนินการ
- [x] Responsive: filter ใหม่ใช้ได้ดีบนมือถือ

---

## 8. โครงสร้างโฟลเดอร์ (Proposed)

```
STS_LINK_GENERATE/
├── server.js                 # Express server หลัก
├── package.json
├── db/
│   ├── init.js               # สร้างตาราง SQLite
│   └── sts.db                # ไฟล์ SQLite database (auto-generated)
├── routes/
│   ├── pages.js              # Routes สำหรับ serve หน้า HTML
│   └── api.js                # Routes สำหรับ API endpoints
├── public/
│   ├── css/
│   │   └── style.css         # CSS หลัก (responsive)
│   ├── js/
│   │   ├── dashboard.js      # Logic หน้า Dashboard
│   │   ├── create-task.js    # Logic หน้าสร้างภารกิจ
│   │   ├── task-view.js      # Logic หน้า Task View
│   │   ├── delegate.js       # Logic หน้า Delegate
│   │   ├── report.js         # Logic หน้า Submit Report
│   │   └── task-detail.js    # Logic หน้า Audit Trail
│   └── img/                  # Static images (icons, etc.)
├── views/
│   ├── dashboard.html
│   ├── create-task.html
│   ├── task-view.html
│   ├── delegate.html
│   ├── report.html
│   ├── success.html
│   ├── expired.html
│   └── task-detail.html
├── uploads/                  # รูปภาพที่อัปโหลด (auto-created)
└── STS_PROTOTYPE_PLAN.md     # ไฟล์นี้
```

---

## 9. วิธีรัน (Quick Start)

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. สร้าง database (ครั้งแรก)
node db/init.js

# 3. รัน server
node server.js

# 4. เปิด browser
# http://localhost:3000
```

---

## 10. หมายเหตุ (PoC Limitations)

สิ่งที่ **ยังไม่ทำ** ใน Prototype นี้ (ทำภายหลังถ้า concept ผ่าน):

- **ระบบ Login จริง** — PoC นี้ไม่มีระบบ auth, Dashboard เปิดได้เลย
- **Real-time update** — PoC ใช้การ refresh หน้าแทน (ไม่มี WebSocket)
- **Cloud Storage** — รูปเก็บ local ไม่ได้ขึ้น cloud
- **LINE Integration (ขั้นสูง)** — PoC มีปุ่ม "ส่งผ่าน LINE" (Share URL scheme) แต่ยังไม่มี Bot/Messaging API/LIFF
- **Data masking แบบสมบูรณ์** — PoC ทำแค่ mask ชื่อเด็กเบื้องต้น
- **Rate Limiting** — PoC ยังไม่มี Redis
- **Production deployment** — รันบน localhost เท่านั้น
- **Offline support (PWA)** — ไม่ทำใน PoC

---

*Last updated: March 1, 2026 (Dashboard filter enhancements + executive filter fix)*
