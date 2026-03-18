# Implementation Plan: Phase 2 (Master Data) & Phase 3 (Automation)

อ้างอิงจากบทสนทนา เราจะข้าม Phase 1 ไปก่อน และมาเริ่มต้นที่ **Phase 2 (Master Data)** และ **Phase 3 (ระบบติดตามอัตโนมัติ)** โดยปรับให้ **"จำนวนวันขาดเรียนสะสม"** สามารถตั้งค่าได้ (ไม่ฟิกซ์ 3 วัน) พร้อมตรวจสอบการเชื่อมต่อ Database

## 🗄 1. Database Schema Updates (ปรับปรุงโครงสร้าง DB)
*แก้ไขในไฟล์ `nest-backend/src/database/database.service.ts` เพื่อรันคำสั่ง Migration เพิ่มเติม*
- [ ] **[NEW] `system_settings` Table:** สำหรับให้ Admin ตั้งค่าตัวแปรของระบบ เช่น `ABSENT_THRESHOLD_DAYS` (จำนวนวันขาดเรียนก่อนเตือน)
- [ ] **[NEW] Master Data Tables:**
  - `risk_factors` (ปัจจัยเสี่ยง)
  - `dropout_reasons` (สาเหตุการหลุดจากระบบ)
  - `assistance_measures` (มาตรการให้ความช่วยเหลือ)
  - `related_agencies` (หน่วยงานเป้าหมายสำหรับส่งต่อเคส)

## ⚙️ 2. Backend Modules (สร้าง API สำหรับ Phase 2)
### Master Data Module
- [ ] **[NEW] `master-data.module.ts`, `master-data.service.ts`, `master-data.controller.ts`**
  - สร้าง API แบบ CRUD (Create, Read, Update, Delete) สำหรับตารางต่างๆ ใน Master Data (FR-MST-01 ถึง 03)
### System Settings Module
- [ ] **[NEW] `settings.module.ts`, `settings.service.ts`, `settings.controller.ts`**
  - สร้าง API ให้อ่านและอัปเดตการตั้งค่าระบบ (`GET /settings/absent-threshold`, `PUT /settings/absent-threshold`)

## 🤖 3. Automation Layer (สร้างระบบแจ้งเตือนขาดเรียนอัตโนมัติ - Phase 3)
- [ ] **Install `@nestjs/schedule`:** นำเข้าไลบรารีเพื่อรองรับการทำ Cron Jobs
- [ ] **[NEW] `automation.module.ts` & `automation.service.ts`:**
  - เพิ่มเมธอดแบบ Job Scheduler (เช่น ตั้งเวลาทำงานทุก ๆ 18:00 น. ของทุกวัน)
  - **Logic:**
    1. ดึงข้อมูล `ABSENT_THRESHOLD_DAYS` จากตาราง `system_settings`
    2. รัน SQL / Query ข้อมูลจากตาราง `attendance` เช็ครายชื่อนักเรียนที่มีสถานะขาดเรียนติดต่อกันครบหรือเกินกำหนด
    3. สร้างรายการแจ้งเตือน (Alert/Notification) ล็อกเข้าตารางแจ้งเตือนใหม่ 
    4. *(ถ้าต้องการ)* สามารถผูกลอจิกให้สั่งเปิด **Case** ให้อัตโนมัติ (ลงตาราง `cases`) เพื่อให้ผู้อำนวยการอนุมัติส่งตัวครูลงพื้นที่ต่อ

## User Review Required

> [!IMPORTANT]
> **Plan นี้ครอบคลุมตามที่คุณต้องการไหมครับ?**
> - **การเชื่อมต่อ DB:** ระบบนี้ใช้ `pg` query Raw SQL เข้า PostgreSQL ตรงๆ ผ่าน `DatabaseService` อยู่แล้วครับ ซึ่งสมบูรณ์ดี และเดี๋ยวผมจะเพิ่ม Table ต่างๆ ลงไปที่การตั้งค่าตรงนี้เลยครับ
> - **เกี่ยวกับแจ้งเตือนขาดเรียน:** ถ้าให้ระบบมันวิ่งหาเด็กที่ขาดเรียนครบกำหนดแล้ว สร้างเป็นเคส (Case) ให้อัตโนมัติเลย (รอแค่ ผอ. มอบหมาย/อนุมัติ) ลอจิกแบบนี้คุณโอเคไหมครับ หรือว่าแค่ต้องการแสตมป์แจ้งเตือนไว้ในระบบเฉยๆ?
>
> หากยืนยันแล้ว ผมจะเริ่มลงมือเขียน Migration สร้างตาราง Database ก่อนเลยครับ
