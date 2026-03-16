# STS Use Case Baseline v4.1 (Consolidated)

อ้างอิงจากเอกสารต่อไปนี้
- `Software Requirements Specification (SRS).docx` (v3.0 วันที่ 12 มีนาคม 2569)
- `Usecase Description V2.docx` (UC01-UC20)
- `SBP_RTM_UML.xlsx` (ชีต `RTMT` เป็นแหล่ง traceability หลักของ STS)
- `main_srs.md` (ทิศทางระบบ/วิสัยทัศน์)

เอกสารนี้ปรับเป็น baseline แบบ consolidated เพื่อรวม use case ที่ intent ซ้อนกัน และลดความซ้ำใน RTM/UAT

## 0) หลักการ Consolidation

1. ใช้รหัส UC ตัวแรกเป็น `Canonical UC ID`  
2. รหัสเดิมที่ถูกรวมให้เป็น `Deprecated Alias` ชั่วคราว (เพื่อ migrate RTM/Test Case)  
3. หลังแก้ RTM เสร็จ ให้ยุบ alias ออกจากแผนผังหลัก

ตาราง Consolidation หลักรอบนี้

| Deprecated Alias | Canonical UC | แนวทางรวม |
|---|---|---|
| UC13 | UC12 | รวม action ตัดสินใจเคส (ปิดเคส/ส่งต่อหน่วยงาน) |
| UC15 | UC14 | รวมมุมมองนักเรียนเป็นโปรไฟล์ส่วนตัวเดียว (การศึกษา/สุขภาพ/สถานะติดตาม) |
| UC18 | UC17 | รวมเป็น subflow ในการติดตามภาคสนาม (อัปเดตที่อยู่/พิกัด) |
| UC19 | UC10 | รวมการส่งต่องานเป็น action ใน lifecycle ของ Assignment Link |

## 1) System-Level Use Case (Big Picture)

```mermaid
flowchart LR
  Admin([ผู้ดูแลระบบ Admin])
  Executive([ผู้บริหารระดับเขตหรือจังหวัด Executive])
  Director([ผู้อำนวยการ Director])
  Teacher([ครู Teacher])
  Volunteer([ผู้ติดตามภายนอก Volunteer])
  Student([นักเรียน Student])
  Parent([ผู้ปกครอง Parent])
  ThaiID([ThaiID])
  OBEC([ระบบภายนอก OBEC/API])
  AutoSys([System Scheduler])

  subgraph STS["STS Platform"]
    UC01["UC01 เข้าสู่ระบบ"]
    UC02["UC02 แก้ไขโปรไฟล์และเปลี่ยนรหัสผ่าน"]
    UC03["UC03 ดูศูนย์แจ้งเตือน"]
    UC04["UC04 ดู Dashboard และรายงาน"]
    UC05["UC05 นำเข้าข้อมูลนักเรียน"]
    UC06["UC06 ส่งออกข้อมูลนักเรียน"]
    UC07["UC07 จัดการบัญชีผู้ใช้งาน"]
    UC08["UC08 จัดการสิทธิ์เมนูและระดับข้อมูล"]
    UC09["UC09 ตรวจสอบ Audit Logs"]
    UC10["UC10 จัดการ Assignment Link และส่งต่องาน"]
    UC11["UC11 ดูโปรไฟล์ผู้เรียน"]
    UC12["UC12 พิจารณาผลติดตามและตัดสินใจเคส"]
    UC14["UC14 นักเรียนดูประวัติส่วนตัว"]
    UC16["UC16 บันทึกและประมวลผล SDQ-DQ"]
    UC17["UC17 บันทึกการติดตามและอัปเดตที่อยู่/พิกัด"]
    UC20["UC20 บันทึกการเช็คชื่อ"]
    UC21["UC21 จัดการ Master Data"]
    UC22["UC22 จัดการเชื่อมโยง API"]
    UC23["UC23 สร้าง Alert เด็กกลุ่มเสี่ยงอัตโนมัติ"]
    UC24["UC24 ยืนยันตัวตนผ่าน ThaiID จากลิงก์"]
    UC25["UC25 ขึ้นทะเบียนเด็กนอกระบบหรือไม่เคยเข้าเรียน"]
  end

  Admin --> UC01
  Admin --> UC02
  Admin --> UC04
  Admin --> UC05
  Admin --> UC06
  Admin --> UC07
  Admin --> UC08
  Admin --> UC09
  Admin --> UC21
  Admin --> UC22

  Executive --> UC01
  Executive --> UC03
  Executive --> UC04
  Executive --> UC11

  Director --> UC01
  Director --> UC03
  Director --> UC04
  Director --> UC10
  Director --> UC11
  Director --> UC12
  Director --> UC25

  Teacher --> UC01
  Teacher --> UC02
  Teacher --> UC03
  Teacher --> UC10
  Teacher --> UC11
  Teacher --> UC16
  Teacher --> UC17
  Teacher --> UC20

  Volunteer --> UC24
  Volunteer --> UC17

  Student --> UC01
  Student --> UC14
  Student --> UC16

  Parent --> UC16
  ThaiID --> UC24
  OBEC --> UC22
  AutoSys --> UC23

  UC10 -. include .-> UC24
  UC17 -. include .-> UC24
  UC12 -. include .-> UC11
  UC20 -. extend .-> UC23
  UC16 -. extend .-> UC23
```

## 2) Feature-Level Use Case

### 2.1 Identity, Access, and Security

```mermaid
flowchart LR
  Admin([Admin])
  User([All Users])
  Assignee([Teacher or Volunteer])
  ThaiID([ThaiID])

  subgraph IAM["Identity and Access"]
    A1["UC01 Login and Logout"]
    A2["UC02 Edit Profile and Change Password"]
    A3["UC07 Manage User Accounts"]
    A4["UC08 Manage Role Menu and Data Scope"]
    A5["UC10 Manage Assignment Link and Forward Chain"]
    A6["UC24 ThaiID Verification from Link"]
    A7["UC09 View Audit Logs"]
  end

  User --> A1
  User --> A2
  Admin --> A3
  Admin --> A4
  Admin --> A5
  Admin --> A7
  Assignee --> A6
  ThaiID --> A6

  A5 -. include .-> A6
```

### 2.2 Student Information, Attendance, and Risk Screening

```mermaid
flowchart LR
  Admin([Admin])
  Executive([Executive])
  Director([Director])
  Teacher([Teacher])
  Student([Student])
  Parent([Parent])
  AutoSys([System])

  subgraph SIW["Student Info and Early Warning"]
    S1["UC05 Import Student Data"]
    S2["UC06 Export Student Data"]
    S3["UC11 View Student Profile"]
    S4["UC20 Attendance Tracking"]
    S5["UC16 SDQ or DQ Screening"]
    S6["UC23 Auto Alert for Risk"]
    S7["UC14 Student Personal History"]
    S8["UC25 Register Never Enrolled Child"]
  end

  Admin --> S1
  Admin --> S2
  Executive --> S3
  Director --> S3
  Teacher --> S3
  Teacher --> S4
  Teacher --> S5
  Student --> S5
  Parent --> S5
  Student --> S7
  Director --> S8
  AutoSys --> S6

  S4 -. extend .-> S6
  S5 -. extend .-> S6
```

### 2.3 Tracking, Intervention, and Case Closure

```mermaid
flowchart LR
  Director([Director])
  Teacher([Teacher])
  Volunteer([Volunteer])
  ThaiID([ThaiID])

  subgraph TRK["Tracking and Intervention Workflow"]
    T1["UC10 Create or Forward Assignment Link"]
    T2["UC24 Verify with ThaiID"]
    T3["UC17 Record Follow-up and Update Address/GPS"]
    T4["UC12 Review Case Decision (Close or Refer)"]
  end

  Director --> T1
  Director --> T4
  Teacher --> T2
  Teacher --> T3
  Volunteer --> T2
  Volunteer --> T3
  ThaiID --> T2

  T1 -. include .-> T2
  T3 -. include .-> T2
```

### 2.4 Governance, Integration, Notification, and Reporting

```mermaid
flowchart LR
  Admin([Admin])
  Executive([Executive])
  Director([Director])
  OBEC([External API])
  AutoSys([System])

  subgraph GOV["Governance and Reporting"]
    G1["UC21 Manage Master Data"]
    G2["UC22 Manage API Integration"]
    G3["UC09 Review Audit Logs"]
    G4["UC03 Notification Center"]
    G5["UC04 Executive Dashboard"]
  end

  Admin --> G1
  Admin --> G2
  Admin --> G3
  Admin --> G4
  Admin --> G5
  Executive --> G4
  Executive --> G5
  Director --> G4
  Director --> G5
  OBEC --> G2
  AutoSys --> G4
```

## 3) End-to-End Flow (Alert -> Assign -> Follow-up -> Review)

```mermaid
flowchart LR
  A[Attendance or SDQ data updated] --> B[UC23 Auto Alert]
  B --> C[UC03 Director receives notification]
  C --> D[UC10 Create assignment link]
  D --> E[Assignee opens link]
  E --> F[UC24 ThaiID verification]
  F --> G[UC17 Fill follow-up form and evidence]
  G --> H[Status = Pending Review]
  H --> I{Director decision}
  I -->|Approve| J[UC12 Close case]
  I -->|Need agency support| K[UC12 Refer to agency]
  I -->|Rework or Forward| L[UC10 Forward assignment]
  L --> E
```

```mermaid
stateDiagram-v2
  [*] --> Open
  Open --> Assigned : UC10
  Assigned --> InProgress : UC24 + UC17
  InProgress --> PendingReview : Submit
  PendingReview --> Closed : UC12 (Close)
  PendingReview --> Referred : UC12 (Refer)
  PendingReview --> InProgress : UC10 (Rework or Forward)
```

## 4) Use Case Catalog (Canonical หลัง Consolidation)

| Use Case | ชื่อ Use Case | Actor หลัก | FR/NFR ที่ครอบคลุม |
|---|---|---|---|
| UC01 | เข้าสู่ระบบ (Login) | All Users | FR-AUTH-01, FR-LOG-01, NFR-SEC-04 |
| UC02 | แก้ไขข้อมูลส่วนตัว/เปลี่ยนรหัสผ่าน | All Users | FR-AUTH-05, NFR-SEC-04 |
| UC03 | ดูรายการแจ้งเตือน | All Users | FR-NOT-01, FR-TRK-01 |
| UC04 | ดูรายงานภาพรวม | Admin, Executive, Director | FR-RPT-01 |
| UC05 | นำเข้าข้อมูลนักเรียน | Admin | FR-STD-04 |
| UC06 | ส่งออกข้อมูลนักเรียน | Admin | FR-STD-04 |
| UC07 | จัดการบัญชีผู้ใช้งาน | Admin | FR-AUTH-02, FR-LOG-03 |
| UC08 | จัดการสิทธิ์เมนู/บทบาท/ระดับข้อมูล | Admin | FR-AUTH-03, FR-AUTH-04, NFR-SEC-01 |
| UC09 | ตรวจสอบประวัติระบบ (Audit Logs) | Admin | FR-LOG-01, FR-LOG-02, FR-LOG-03 |
| UC10 | จัดการลิงก์มอบหมายงานและส่งต่องาน | Director, Teacher, Admin | FR-AUTH-06, FR-TRK-02 |
| UC11 | ดูโปรไฟล์ผู้เรียน | Executive, Director, Teacher | FR-STD-01, FR-STD-02 |
| UC12 | พิจารณาผลติดตามและตัดสินใจเคส (ปิดเคส/ส่งต่อหน่วยงาน) | Director | FR-TRK-05, FR-TRK-06 |
| UC14 | นักเรียนดูประวัติส่วนตัว (การศึกษา/สุขภาพ/สถานะติดตาม) | Student | FR-STD-07 |
| UC16 | บันทึกแบบประเมิน SDQ/DQ | Teacher, Student, Parent | FR-STD-06 |
| UC17 | บันทึกการติดตามภาคสนามและอัปเดตที่อยู่/พิกัด | Teacher, Volunteer | FR-TRK-03, FR-TRK-04, FR-STD-03 |
| UC20 | บันทึกการเช็คชื่อ | Teacher | FR-STD-05 |
| UC21 | จัดการข้อมูลพื้นฐาน (Master Data) | Admin | FR-MST-01, FR-MST-02, FR-MST-03 |
| UC22 | จัดการเชื่อมโยงข้อมูลผ่าน API | Admin, System | FR-INT-01, FR-INT-02, FR-INT-03, FR-INT-04 |
| UC23 | สร้าง Alert อัตโนมัติ | System | FR-TRK-01 |
| UC24 | ยืนยันตัวตนผ่าน ThaiID จาก Assignment Link | Teacher, Volunteer | FR-AUTH-07 |
| UC25 | ขึ้นทะเบียนเด็กไม่เคยเข้าเรียน/นอกระบบ | Director, Teacher | ส่วนขยายจาก `main_srs.md` (ควรเพิ่มเป็น FR ใหม่ใน SRS) |

## 5) Deprecated Alias Mapping (สำหรับแก้ Usecase Description และ RTM)

| Deprecated UC | Canonical UC | การ migrate เนื้อหา Use Case Description |
|---|---|---|
| UC13 ส่งต่อเคสไปยังหน่วยงาน | UC12 | ย้าย Normal Flow ของ "ส่งต่อไปยังหน่วยงาน" เป็น Alternate Flow/Decision branch ของ UC12 |
| UC15 ดูข้อมูลสุขภาพของตนเอง | UC14 | ย้ายเนื้อหา "ข้อมูลสุขภาพ/สถานะติดตาม" ไปเป็น tab/section ใน UC14 |
| UC18 แก้ไขที่อยู่ปัจจุบัน | UC17 | ย้ายขั้นตอนแก้ที่อยู่และ GPS เป็น include/subflow ใน UC17 |
| UC19 มอบหมายงานต่อ | UC10 | ย้าย flow ส่งต่องานและ chain of custody ไปเป็น Alternate Flow ของ UC10 |

## 6) Traceability Alignment Notes (RTM)

1. ระยะเปลี่ยนผ่านให้เก็บทั้ง `Deprecated UC` และ `Canonical UC` ใน RTM ชั่วคราว 1 รอบรีวิว  
2. จากนั้น migrate ให้ FR ผูกกับ Canonical UC เท่านั้น
3. mapping FR ที่ควรอัปเดตทันที
- `FR-TRK-05`, `FR-TRK-06` -> `UC12`
- `FR-STD-07` -> `UC14`
- `FR-TRK-03`, `FR-TRK-04`, `FR-STD-03` -> `UC17`
- `FR-AUTH-06`, `FR-TRK-02` -> `UC10`
4. mismatch เดิมใน RTM ที่ควรแก้พร้อมกัน
- `FR-AUTH-02/03/04` ไม่ควรชี้ `UC06` เพราะ `UC06` คือ Export Student Data

## 7) สรุปการใช้งานเอกสารฉบับนี้

1. ใช้ภาพในหัวข้อ 1 สำหรับสื่อสาร stakeholder ระดับภาพใหญ่  
2. ใช้หัวข้อ 2-3 สำหรับทำ sequence/activity และออกแบบหน้าจอ  
3. ใช้หัวข้อ 4 เป็น baseline เชื่อม `FR/NFR -> UC -> Test Case (SIT/UAT)`  
4. ใช้หัวข้อ 5-6 เป็น checklist migration สำหรับ `Usecase Description` และ `RTM`
