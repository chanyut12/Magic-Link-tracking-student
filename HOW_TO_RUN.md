# วิธีการใช้งานและติดตั้ง (Getting Started)

เนื่องจากบางไฟล์ถูกตั้งค่าไม่ให้ส่งขึ้น Git (เช่น `.env` และ `node_modules`) คุณต้องทำการตั้งค่าตามขั้นตอนดังนี้ครับ:

## 1. สิ่งที่ต้องติดตั้ง (Prerequisites)
- **Node.js**: เวอร์ชัน 20 หรือสูงกว่า
- **PostgreSQL**: สำหรับใช้เป็นฐานข้อมูลหลัก
- **Quasar CLI**: สำหรับรัน Frontend
  ```bash
  npm i -g @quasar/cli
  ```

---

## 2. การตั้งค่า Environment Variables (.env)
สร้างไฟล์ชื่อ `.env` ไว้ที่ **Root Directory** (โฟลเดอร์นอกสุด) และคัดลอกข้อความด้านล่างไปวางครับ:

```env
ADMIN_ACCESS_KEY="new"

# ตั้งค่า Email OTP (Gmail)
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="STS System <your-email@gmail.com>"

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=sts
```
> [!NOTE]
> อย่าลืมเปลี่ยน `DB_PASSWORD` และข้อมูล Email ให้เป็นของคุณเองนะครับ

---

## 3. การติดตั้งและเริ่มระบบ Backend
1. เข้าไปที่โฟลเดอร์ Backend:
   ```bash
   cd nest-backend
   ```
2. ติดตั้ง Library ต่างๆ:
   ```bash
   npm install
   ```
3. **การล้างข้อมูลและเริ่มต้นฐานข้อมูลใหม่ (สำคัญ):**
   รันสคริปต์เพื่อสร้าง Table และนำเข้าข้อมูลจาก Excel (Mockup V2):
   ```bash
   npx ts-node src/scripts/import-excel.ts
   ```
4. เริ่มรัน Server (โหมดพัฒนา):
   ```bash
   npm run start:dev
   ```

---

## 4. การติดตั้งและเริ่มระบบ Frontend
1. เปิด Terminal ใหม่แล้วเข้าไปที่โฟลเดอร์ Frontend:
   ```bash
   cd quasar-frontend
   ```
2. ติดตั้ง Library ต่างๆ:
   ```bash
   npm install
   ```
3. เริ่มรันเว็บคัดชื่อ:
   ```bash
   npm run dev
   ```

---

## 5. ตระกูลไฟล์ที่ไม่ได้ถูกส่งขึ้น Git (Gitignored)
- `node_modules/`: โฟลเดอร์เก็บ Library ทั้งหมด (ต้องรัน `npm install` เอง)
- `.env`: ไฟล์เก็บความลับ เช่น รหัสผ่านฐานข้อมูลและ Key ต่างๆ (ต้องสร้างเองตามข้อ 2)
- `db/test.db`: ไฟล์ฐานข้อมูล SQLite (ระบบปัจจุบันเปลี่ยนมาใช้ PostgreSQL แล้ว)
- `uploads/`: โฟลเดอร์เก็บรูปภาพหรือไฟล์ที่มีการอัปโหลด

หากมีคำถามเพิ่มเติมหรือติดตรงไหน สอบถามได้เลยครับ!
