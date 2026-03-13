<template>
  <q-page class="login-page flex flex-center">
    <div class="login-container">
      <!-- Top Logo Section -->
      <div class="logo-wrapper">
        <div class="logo-box">
          <i class="fas fa-graduation-cap"></i>
        </div>
      </div>

      <div class="login-card">
        <div class="text-center q-mb-xl">
          <h1 class="text-h4 text-weight-bolder text-gray-900 q-mb-sm">เข้าสู่ระบบ STS</h1>
          <div class="subtitle">ระบบดูแลช่วยเหลือนักเรียนโครงการ</div>
          <div class="subtitle">Zero Dropout เพื่อเด็กไทยทุกคน</div>
        </div>

        <q-form @submit="handleLogin" class="q-gutter-y-md">
          <div class="form-group">
            <label>ชื่อผู้ใช้งาน</label>
            <q-input 
              v-model="username" 
              outlined 
              dense 
              placeholder="กรอกชื่อผู้ใช้งาน"
              bg-color="grey-1"
              class="rounded-input"
            />
          </div>

          <div class="form-group">
            <label>รหัสผ่าน</label>
            <q-input 
              v-model="password" 
              :type="showPassword ? 'text' : 'password'"
              outlined 
              dense 
              placeholder="กรอกรหัสผ่าน"
              bg-color="grey-1"
              class="rounded-input"
            >
              <template v-slot:append>
                <q-icon 
                  :name="showPassword ? 'visibility' : 'visibility_off'" 
                  class="cursor-pointer" 
                  @click="showPassword = !showPassword" 
                />
              </template>
            </q-input>
            <div class="text-right q-mt-xs">
              <a href="#" class="forgot-link">ลืมรหัสผ่าน?</a>
            </div>
          </div>

          <q-btn 
            type="submit" 
            color="primary" 
            label="เข้าสู่ระบบ" 
            class="full-width q-py-md btn-primary" 
            unelevated
            @click="handleLogin"
          />

          <div class="divider">
            <span>หรือ</span>
          </div>

          <q-btn 
            outline 
            color="primary" 
            class="full-width q-py-md btn-thaid" 
            unelevated
          >
            <div class="row items-center no-wrap">
              <span>เข้าสู่ระบบด้วย ThaID</span>
            </div>
          </q-btn>
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const showPassword = ref(false);

const handleLogin = () => {
  // Setting admin access immediately as requested
  localStorage.setItem('admin_access', 'true');
  
  // Use direct window navigation to ensure it triggers
  window.location.href = '#/';
  
  // Also try router as fallback
  void router.push('/');
};
</script>

<style lang="scss" scoped>
.login-page {
  background: linear-gradient(180deg, #eef2ff 0%, #ffffff 100%);
  min-height: 100vh;
}

.login-container {
  width: 100%;
  max-width: 600px;
  padding: 2rem;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: -40px;
  position: relative;
  z-index: 10;
}

.logo-box {
  background: white;
  width: 140px;
  height: 140px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
  
  i {
    font-size: 4rem;
    color: #1e40af;
  }
}

.login-card {
  background: white;
  padding: 100px 60px 60px;
  border-radius: 60px;
  box-shadow: 0 10px 60px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.subtitle {
  color: #94a3b8;
  font-size: 1rem;
  max-width: 320px;
  margin: 0 auto;
  line-height: 1.5;
  font-weight: 500;
}

.form-group {
  label {
    display: block;
    font-weight: 700;
    color: #475569;
    margin-bottom: 8px;
    font-size: 0.95rem;
  }
}

.rounded-input {
  :deep(.q-field__control) {
    border-radius: 12px;
    border: 1px solid #f1f5f9;
    background-color: #f8fafc !important;
    
    &::before {
      border: none;
    }
    &::after {
      display: none;
    }
  }
}

.forgot-link {
  color: #2563eb;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
}

.btn-primary {
  background: #1e40af !important;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.1rem;
}

.btn-thaid {
  background: #1e40af !important;
  color: white !important;
  border-radius: 12px;
  font-weight: 700;
  border: none;
  font-size: 1rem;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
  margin: 1.5rem 0;
  
  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #f1f5f9;
  }
  
  span {
    padding: 0 1rem;
  }
}

@media (max-width: 600px) {
  .login-card {
    padding: 80px 30px 40px;
    border-radius: 40px;
  }
  .logo-box {
    width: 120px;
    height: 120px;
    border-radius: 30px;
    i { font-size: 3.5rem; }
  }
}
</style>
