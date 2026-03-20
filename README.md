# STS Link Generate (Prototype)

Student Tracking System (STS) แบบ Prototype สำหรับงานติดตามนักเรียนผ่าน **Magic Link** และ **Task Delegation Chain**  
ออกแบบให้ใช้งานง่ายบนมือถือด้วย stack แบบ low-tech (HTML/CSS/Vanilla JS + Node.js + SQLite)

## What this project does

- ผู้ดูแลสร้างภารกิจติดตามนักเรียน และได้ลิงก์ + QR สำหรับส่งต่อ
- ผู้รับงานเปิดลิงก์บนมือถือ แล้วเลือก:
  - ลงพื้นที่เอง
  - ส่งต่อให้ผู้เกี่ยวข้องคนอื่น
- ผู้ลงพื้นที่ส่งรายงาน พร้อมสาเหตุ, รูปภาพ, พิกัด
- หลังส่งรายงาน เคสจะเข้า `PENDING_REVIEW`
- ผอ./ผู้ดูแลประเมินผลต่อได้ 3 ทาง:
  - `ASSIST` ให้ความช่วยเหลือ
  - `FORWARD` ส่งต่อหน่วยงาน/ผู้เกี่ยวข้อง
  - `CLOSE` ปิดเคส
- ผู้ดูแลสามารถ `lock/unlock` ลิงก์ได้ทันที พร้อมเหตุผล
- Dashboard กรองเคสตามวันที่ / โรงเรียน / สถานะลิงก์ + โหมดผู้บริหาร

## Tech stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js + Express
- Database: SQLite (`better-sqlite3`)
- Upload: `multer` (เก็บรูปในโฟลเดอร์ `uploads`)
- Map: Leaflet + OpenStreetMap
- QR: `qrcode`

## Quick start

```bash
npm install
npm run init-db
# ตั้งรหัสผู้บริหารแบบง่าย (จำเป็น ถ้าเข้าผ่าน dashboard)
# macOS/Linux:
export ADMIN_ACCESS_KEY="your-strong-key"
npm start
```

## Docker (PostgreSQL + Auto Restore)

ระบบจะ restore จากไฟล์ `sts_backup.sql` อัตโนมัติเมื่อเริ่ม `db` ครั้งแรก (ตอนที่ volume ยังว่าง):

```bash
docker compose up -d db
```

ครั้งถัดไปให้ใช้แค่ `docker compose down` และ `docker compose up -d db` ได้เลย (จะไม่ restore ซ้ำเพราะใช้ volume เดิม)

ถ้าต้องการให้ restore ใหม่อีกครั้ง ให้ลบ volume เก่าก่อน:

```bash
docker compose down -v
docker compose up -d db
```

เปิดเว็บที่:

- บนเครื่องที่รันเซิร์ฟเวอร์: `http://localhost:3000`
- บนอุปกรณ์อื่นใน Wi-Fi เดียวกัน (เช่น โทรศัพท์): `http://<YOUR_LOCAL_IP>:3000`
  - ตัวอย่าง: `http://192.168.0.108:3000`
  - หมายเหตุ: `localhost` กับ `192.168.x.x` คือเซิร์ฟเวอร์เดียวกัน แต่คนละชื่อเข้าถึง

## Scripts

- `npm start` - รันเซิร์ฟเวอร์
- `npm run init-db` - สร้าง/อัปเดต schema ใน SQLite
- `npm run smoke:check` - ตรวจ endpoint หลักหลัง deploy (`/healthz`, `/expired`, `/`)

## Deploy on Render (recommended now)

สำหรับงาน prototype ที่อยาก deploy เร็วและ setup น้อย แนะนำ Render แบบ web service เดียว

### 1) Create Web Service
- ไปที่ Render Dashboard แล้วเลือก **New + > Blueprint**
- ชี้มาที่ repo นี้ (มีไฟล์ `render.yaml` แล้ว)
- กด deploy ได้เลย

### 2) Environment Variables
- ใน `render.yaml` ตั้งไว้แล้ว:
  - `NODE_ENV=production`
  - `TRUST_PROXY=true`
  - `STS_DATA_DIR=/var/data`
- ต้องใส่ค่าเองใน Dashboard:
  - `ADMIN_ACCESS_KEY=<strong-random-key>`

### 3) Persistent Disk
- ใน `render.yaml` กำหนดไว้แล้ว:
  - mount path: `/var/data`
  - แอปจะเก็บ:
    - SQLite: `/var/data/sts.db`
    - Uploads: `/var/data/uploads`

ถ้าไม่ตั้ง `STS_DATA_DIR` ระบบจะใช้ค่า default:
- DB: `db/sts.db`
- uploads: `uploads/`

### 4) Health Check
- endpoint: `GET /healthz`
- ต้องได้ `200` พร้อม JSON status

### 5) Smoke test หลัง deploy
- รันจาก local machine:
  - `SMOKE_BASE_URL=https://<your-render-domain> npm run smoke:check`
- ทดสอบ flow ธุรกิจ:
  - admin access (`/admin-access`)
  - create task
  - open magic link
  - submit report with image
  - review/close case

## Backup and restore (baseline)

### Backup
- SQLite: สำรองไฟล์ `sts.db` (จาก data dir เดียวกับที่ mount)
- Uploads: สำรองโฟลเดอร์ `uploads/`
- ความถี่แนะนำ: อย่างน้อยวันละครั้ง

### Restore
1. หยุด service
2. กู้คืน `sts.db` และโฟลเดอร์ `uploads/` ไปยัง data dir เดิม
3. start service ใหม่
4. รัน smoke check เพื่อยืนยัน

## Main routes

### Pages

- `/admin-access` หน้าใส่รหัสผู้บริหาร
- `/` Dashboard (admin only)
- `/create` สร้างภารกิจ (admin only)
- `/task/:token` ดูภารกิจจากลิงก์
- `/task/:token/delegate` ส่งต่อภารกิจ
- `/task/:token/report` ส่งรายงานลงพื้นที่
- `/task/:token/success` หน้าสำเร็จ
- `/task-detail/:taskId` ดู Audit Trail + ข้อมูลรายงาน + ประเมินผล (admin only)
- `/expired` ลิงก์หมดอายุ

### APIs (สำคัญ)

- `POST /api/tasks` (admin only)
- `GET /api/tasks/:token`
- `POST /api/tasks/:token/delegate`
- `POST /api/tasks/:token/submit`
- `GET /api/tasks/:taskId/chain` (admin only)
- `GET /api/cases` (admin only)
- `GET /api/stats` (admin only)
- `POST /api/task-links/:linkId/admin-lock` (admin only)
- `POST /api/cases/:caseId/review` (admin only)
- `GET /api/cases/:caseId/reviews` (admin only)

## Project structure

```text
STS_LINK_GENERATE/
├── server.js
├── config/
│   └── constants.js          # ค่าคงที่รวมศูนย์ (file limits, expiry, categories)
├── controllers/
│   ├── admin.controller.js
│   ├── case.controller.js
│   ├── delegation.controller.js
│   ├── stats.controller.js
│   ├── submission.controller.js
│   └── task.controller.js
├── routes/
│   ├── api.js                # Routing layer (ชี้ไป controllers)
│   └── pages.js
├── db/
│   ├── database.js
│   ├── init.js
│   ├── migrations.js         # Schema migration runner
│   └── sts.db
├── utils/
│   ├── admin-auth.js         # Cookie-based HMAC session
│   ├── helpers.js            # hashToken, maskName, sanitize, getBaseUrl
│   └── storage-paths.js
├── scripts/
│   └── smoke-check.js
├── views/
├── public/
│   ├── css/style.css
│   └── js/
└── uploads/
```

## Notes for mobile/LAN usage

- ถ้าจะให้โทรศัพท์เครื่องอื่นสแกน QR ได้ ต้องเปิดเว็บผ่าน IP เครื่องแม่ข่าย เช่น `http://192.168.x.x:3000`
- ถ้าเข้าผ่าน HTTP + IP:
  - บาง browser จะจำกัด GPS/clipboard
  - ระบบมี fallback ให้ใช้งานได้ แต่แนะนำ HTTPS หากนำไปใช้จริง

## Related docs

- แผนงาน prototype: `STS_PROTOTYPE_PLAN.md`
- สรุป spec + flow + diagram: `STS_SYSTEM_SPEC_AND_FLOW.md`
