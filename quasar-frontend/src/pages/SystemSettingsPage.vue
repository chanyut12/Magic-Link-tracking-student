<template>
  <q-page class="system-settings-page q-pa-lg">
    <div class="page-container">
      
      <!-- Header -->
      <div class="row align-center q-mb-md">
        <div class="text-h5 text-weight-bold text-grey-9">
          ตั้งค่าระบบและข้อมูลพื้นฐาน (Master Data)
        </div>
      </div>

      <!-- Navigation Tabs -->
      <q-card class="settings-card shadow-2" style="border-radius: 20px;">
        <q-tabs
          v-model="activeTab"
          dense
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
          no-caps
        >
          <q-tab name="settings" label="การตั้งค่าระบบ" icon="settings" />
          <q-tab name="risk_factors" label="ปัจจัยเสี่ยง" icon="warning" />
          <q-tab name="dropout_reasons" label="สาเหตุการหลุดระบบ" icon="logout" />
          <q-tab name="assistance_measures" label="มาตรการความช่วยเหลือ" icon="health_and_safety" />
          <q-tab name="related_agencies" label="หน่วยงานส่งต่อ" icon="business" />
          <q-tab name="schools" label="สถานศึกษา" icon="school" />
          <q-tab name="educational_areas" label="เขตพื้นที่การศึกษา" icon="map" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated class="q-pa-md">
          
          <!-- System Settings Tab -->
          <q-tab-panel name="settings">
            <div class="text-h6 text-weight-medium q-mb-md">การตั้งค่าตัวแปรระบบ</div>
            
            <div v-if="loadingSettings" class="row justify-center q-pa-xl">
              <q-spinner-dots color="primary" size="40px" />
            </div>
            <div v-else class="q-gutter-y-md" style="max-width: 600px;">
              <template v-for="setting in sortedSettings" :key="setting.setting_key">
                <div 
                  v-if="!(setting.setting_key === 'ALERT_SCHEDULE_TIME' && currentTriggerType === 'IMMEDIATE')" 
                  class="bg-grey-1 q-pa-md rounded-borders"
                >
                  <div class="text-weight-bold q-mb-xs">{{ setting.setting_key }}</div>
                  <div class="text-caption text-grey-6 q-mb-sm">{{ setting.description || 'ไม่มีคำอธิบาย' }}</div>
                  <div class="row items-center q-gutter-x-sm">
                    <!-- Custom Input for ALERT_TRIGGER_TYPE -->
                    <q-select
                      v-if="setting.setting_key === 'ALERT_TRIGGER_TYPE'"
                      v-model="setting.setting_value"
                      :options="['SCHEDULED', 'IMMEDIATE']"
                      outlined
                      dense
                      bg-color="white"
                      class="col"
                      emit-value
                      map-options
                    />

                    <!-- Custom Input for ALERT_SCHEDULE_TIME -->
                    <q-input
                      v-else-if="setting.setting_key === 'ALERT_SCHEDULE_TIME'"
                      v-model="setting.setting_value"
                      outlined
                      dense
                      bg-color="white"
                      class="col"
                      type="time"
                    />

                    <!-- Default Input -->
                    <q-input 
                      v-else
                      v-model="setting.setting_value" 
                      outlined 
                      dense 
                      bg-color="white" 
                      class="col"
                    />
                    
                    <q-btn 
                      color="primary" 
                      label="บันทึก" 
                      unelevated 
                      no-caps 
                      @click="saveSetting(setting)"
                    />
                  </div>
                </div>
              </template>
            </div>
          </q-tab-panel>

          <!-- Dynamic Master Data Tabs -->
          <q-tab-panel v-for="table in masterTables" :key="table.id" :name="table.id">
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6 text-weight-medium">{{ table.title }}</div>
              <q-btn 
                color="blue-1" 
                text-color="primary" 
                unelevated 
                no-caps 
                icon="add" 
                :label="`เพิ่มข้อมูล`"
                @click="openAddDialog(table.id)"
              />
            </div>

            <div v-if="loadingMaster" class="row justify-center q-pa-xl">
              <q-spinner-dots color="primary" size="40px" />
            </div>

            <div v-else>
              <q-list separator bordered class="rounded-borders bg-white">
                <q-item v-for="(item, index) in masterData[table.id] || []" :key="item.id" class="q-py-md">
                  <q-item-section avatar>
                    <q-avatar color="primary" text-color="white" size="sm">{{ index + 1 }}</q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium text-body1">
                       {{ ['related_agencies', 'schools', 'educational_areas'].includes(table.id) ? item.name : item.label }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="row q-gutter-x-sm">
                      <q-btn flat round color="primary" icon="edit" size="sm" @click="openEditDialog(table.id, item)" />
                      <q-btn flat round color="negative" icon="delete" size="sm" @click="confirmDelete(table.id, item.id)" />
                    </div>
                  </q-item-section>
                </q-item>
                
                <q-item v-if="!masterData[table.id] || masterData[table.id]?.length === 0">
                  <q-item-section class="text-center text-grey-6 q-py-lg">
                    ไม่พบข้อมูล
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-tab-panel>

        </q-tab-panels>
      </q-card>

      <!-- Master Data Add/Edit Dialog -->
      <q-dialog v-model="showMasterDialog" persistent>
        <q-card style="width: 400px; border-radius: 15px;">
          <q-card-section class="row items-center">
            <div class="text-h6 text-weight-bold">{{ isEditMode ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่' }}</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <q-input
              v-model="masterForm.value"
              outlined
              dense
              :label="activeTableDetails?.fieldLabel || 'ชื่อข้อมูล'"
              autofocus
              @keyup.enter="saveMasterData"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn flat label="ยกเลิก" color="grey-7" v-close-popup no-caps />
            <q-btn unelevated label="บันทึก" color="primary" @click="saveMasterData" no-caps class="rounded-borders" />
          </q-card-actions>
        </q-card>
      </q-dialog>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';

const $q = useQuasar();

// Types
interface SystemSetting {
  setting_key: string;
  setting_value: string;
  description?: string;
}

interface MasterDataItem {
  id: number;
  label?: string;
  name?: string;
}

// State
const activeTab = ref('settings');
const loadingSettings = ref(false);
const loadingMaster = ref(false);

const systemSettings = ref<SystemSetting[]>([]);
const masterData = ref<Record<string, MasterDataItem[]>>({});

const showMasterDialog = ref(false);
const isEditMode = ref(false);
const masterForm = ref({
  id: null as number | null,
  table: '',
  value: ''
});

// Computed trigger type to control UI
const currentTriggerType = computed(() => {
  const triggerSetting = systemSettings.value.find(s => s.setting_key === 'ALERT_TRIGGER_TYPE');
  return triggerSetting ? triggerSetting.setting_value : 'SCHEDULED';
});

// Computed property to sort settings so TRIGGER configs remain on top
const sortedSettings = computed(() => {
  const order = ['ALERT_TRIGGER_TYPE', 'ALERT_SCHEDULE_TIME', 'ABSENT_THRESHOLD_DAYS'];
  return [...systemSettings.value].sort((a, b) => {
    const indexA = order.indexOf(a.setting_key);
    const indexB = order.indexOf(b.setting_key);
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.setting_key.localeCompare(b.setting_key);
  });
});

// Definitions
const masterTables = [
  { id: 'risk_factors', title: 'รายการข้อมูลปัจจัยเสี่ยง', fieldLabel: 'ชื่อปัจจัยเสี่ยง' },
  { id: 'dropout_reasons', title: 'รายการข้อมูลสาเหตุการหลุดระบบ', fieldLabel: 'สาเหตุการหลุด' },
  { id: 'assistance_measures', title: 'รายการข้อมูลมาตรการให้ความช่วยเหลือ', fieldLabel: 'มาตรการรักษา/ช่วยเหลือ' },
  { id: 'related_agencies', title: 'รายการหน่วยงานเป้าหมาย', fieldLabel: 'ชื่อหน่วยงาน' },
  { id: 'schools', title: 'รายการสถานศึกษา', fieldLabel: 'ชื่อสถานศึกษา' },
  { id: 'educational_areas', title: 'รายการเขตพื้นที่การศึกษา', fieldLabel: 'ชื่อเขตพื้นที่การศึกษา' }
];

const activeTableDetails = computed(() => {
  return masterTables.find(t => t.id === activeTab.value) || null;
});

// Watch tab changes to lazy load data
watch(activeTab, (newTab) => {
  if (newTab === 'settings') {
    void fetchSettings();
  } else {
    void fetchMasterData(newTab);
  }
});

// Initialization
onMounted(() => {
  void fetchSettings();
});

// API Calls - Settings
const fetchSettings = async () => {
  loadingSettings.value = true;
  try {
    const res = await api.get('/api/settings');
    systemSettings.value = res.data;
  } catch (err) {
    console.error('Failed to load settings:', err);
    $q.notify({ color: 'negative', message: 'ไม่สามารถโหลดข้อมูลการตั้งค่าได้' });
  } finally {
    loadingSettings.value = false;
  }
};

const saveSetting = async (setting: SystemSetting) => {
  try {
    await api.put(`/api/settings/${setting.setting_key}`, {
      value: setting.setting_value,
      description: setting.description
    });
    $q.notify({ color: 'positive', message: 'บันทึกการตั้งค่าสำเร็จ' });
  } catch (err) {
    console.error('Failed to save setting:', err);
    $q.notify({ color: 'negative', message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' });
  }
};

// API Calls - Master Data
const fetchMasterData = async (table: string) => {
  loadingMaster.value = true;
  try {
    const res = await api.get(`/api/master-data/${table}`);
    masterData.value[table] = res.data;
  } catch (err) {
    console.error(`Failed to load ${table}:`, err);
  } finally {
    loadingMaster.value = false;
  }
};

const openAddDialog = (table: string) => {
  isEditMode.value = false;
  masterForm.value = { id: null, table, value: '' };
  showMasterDialog.value = true;
};

const openEditDialog = (table: string, item: MasterDataItem) => {
  isEditMode.value = true;
  const val = ['related_agencies', 'schools', 'educational_areas'].includes(table) ? (item.name || '') : (item.label || '');
  masterForm.value = { id: item.id, table, value: val };
  showMasterDialog.value = true;
};

const saveMasterData = async () => {
  if (!masterForm.value.value.trim()) {
    $q.notify({ color: 'warning', message: 'กรุณากรอกข้อมูล' });
    return;
  }

  const { table, id, value } = masterForm.value;
  const payloadKey = ['related_agencies', 'schools', 'educational_areas'].includes(table) ? 'name' : 'label';
  const payload = { [payloadKey]: value };

  try {
    if (isEditMode.value && id) {
      await api.put(`/api/master-data/${table}/${id}`, payload);
      $q.notify({ color: 'positive', message: 'อัปเดตข้อมูลสำเร็จ' });
    } else {
      await api.post(`/api/master-data/${table}`, payload);
      $q.notify({ color: 'positive', message: 'เพิ่มข้อมูลสำเร็จ' });
    }
    showMasterDialog.value = false;
    void fetchMasterData(table); // Refresh data
  } catch (err) {
    console.error(`Failed to save ${table}:`, err);
    $q.notify({ color: 'negative', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
};

const confirmDelete = (table: string, id: number) => {
  $q.dialog({
    title: 'ยืนยันการลบ',
    message: 'คุณต้องการลบข้อมูลนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
    persistent: true,
    ok: {
      color: 'negative',
      label: 'ลบ',
      unelevated: true
    },
    cancel: {
      color: 'grey-7',
      flat: true,
      label: 'ยกเลิก'
    }
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/api/master-data/${table}/${id}`);
        $q.notify({ color: 'positive', message: 'ลบข้อมูลสำเร็จ' });
        void fetchMasterData(table); // Refresh data
      } catch (err) {
        console.error(`Failed to delete from ${table}:`, err);
        $q.notify({ color: 'negative', message: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
      }
    })();
  });
};
</script>

<style lang="scss" scoped>
.system-settings-page {
  background: #f1f5f9;
  min-height: 100vh;
  font-family: 'Prompt', 'Inter', sans-serif;
}
.page-container {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
