import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { masterDataService } from '../services/masterDataService';
import { settingsService } from '../services/settingsService';
import type {
  MasterDataItem,
  MasterDataTableId,
  MasterTableDefinition,
  SystemSetting,
} from '../types/settings';

interface TabMeta {
  id: string;
  tabLabel: string;
  title: string;
  icon: string;
  helper: string;
}

export function useSystemSettingsPage() {
  const $q = useQuasar();

  const activeTab = ref('settings');
  const loadingSettings = ref(false);
  const loadingMaster = ref(false);
  const systemSettings = ref<SystemSetting[]>([]);
  const masterData = ref<Record<string, MasterDataItem[]>>({});
  const showMasterDialog = ref(false);
  const isEditMode = ref(false);
  const masterForm = ref({
    id: null as number | null,
    table: '' as MasterDataTableId | '',
    value: '',
  });

  const currentTriggerType = computed(() => {
    const triggerSetting = systemSettings.value.find((setting) => setting.setting_key === 'ALERT_TRIGGER_TYPE');
    return triggerSetting ? triggerSetting.setting_value : 'SCHEDULED';
  });

  function isSettingVisible(setting: SystemSetting): boolean {
    return !(setting.setting_key === 'ALERT_SCHEDULE_TIME' && currentTriggerType.value === 'IMMEDIATE');
  }

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

  const visibleSettingCount = computed(() => (
    sortedSettings.value.filter(isSettingVisible).length
  ));

  const settingsTab: TabMeta = {
    id: 'settings',
    tabLabel: 'การตั้งค่าระบบ',
    title: 'การตั้งค่าตัวแปรระบบ',
    icon: 'settings_suggest',
    helper: 'กำหนดพฤติกรรมการแจ้งเตือนและพารามิเตอร์หลักที่ส่งผลต่อระบบโดยรวม',
  };

  const masterTables: MasterTableDefinition[] = [
    {
      id: 'risk_factors',
      title: 'รายการข้อมูลปัจจัยเสี่ยง',
      tabLabel: 'ปัจจัยเสี่ยง',
      fieldLabel: 'ชื่อปัจจัยเสี่ยง',
      icon: 'warning_amber',
      helper: 'แยกรายการปัจจัยเสี่ยงที่ต้องติดตาม เพื่อใช้ในรายงานและการแจ้งเตือน',
      accent: '#f59e0b',
      soft: '#fff8eb',
    },
    {
      id: 'dropout_reasons',
      title: 'รายการข้อมูลสาเหตุการหลุดระบบ',
      tabLabel: 'สาเหตุหลุดระบบ',
      fieldLabel: 'สาเหตุการหลุด',
      icon: 'logout',
      helper: 'เก็บสาเหตุที่เกี่ยวข้องกับการหลุดระบบ เพื่อวิเคราะห์แนวโน้มและป้องกันล่วงหน้า',
      accent: '#e11d48',
      soft: '#fff1f4',
    },
    {
      id: 'assistance_measures',
      title: 'รายการข้อมูลมาตรการให้ความช่วยเหลือ',
      tabLabel: 'มาตรการช่วยเหลือ',
      fieldLabel: 'มาตรการรักษา/ช่วยเหลือ',
      icon: 'health_and_safety',
      helper: 'กำหนดรูปแบบความช่วยเหลือที่หน่วยงานสามารถเลือกใช้กับแต่ละกรณี',
      accent: '#0d9488',
      soft: '#ecfdf8',
    },
    {
      id: 'related_agencies',
      title: 'รายการหน่วยงานเป้าหมาย',
      tabLabel: 'หน่วยงานส่งต่อ',
      fieldLabel: 'ชื่อหน่วยงาน',
      icon: 'business',
      helper: 'จัดการรายชื่อหน่วยงานที่เกี่ยวข้องกับการส่งต่อและการประสานงาน',
      accent: '#0ea5e9',
      soft: '#edf9ff',
    },
    {
      id: 'schools',
      title: 'รายการสถานศึกษา',
      tabLabel: 'สถานศึกษา',
      fieldLabel: 'ชื่อสถานศึกษา',
      icon: 'school',
      helper: 'เก็บข้อมูลสถานศึกษาที่อยู่ในระบบเพื่อความถูกต้องของการบันทึกเคส',
      accent: '#2563eb',
      soft: '#eef4ff',
    },
    {
      id: 'educational_areas',
      title: 'รายการเขตพื้นที่การศึกษา',
      tabLabel: 'เขตพื้นที่การศึกษา',
      fieldLabel: 'ชื่อเขตพื้นที่การศึกษา',
      icon: 'map',
      helper: 'กำหนดเขตพื้นที่การศึกษาเพื่อใช้ในงานอ้างอิง การกรอง และรายงานผล',
      accent: '#7c3aed',
      soft: '#f6f2ff',
    },
  ];

  const tabItems = computed<TabMeta[]>(() => {
    const masterTabs = masterTables.map(({ id, tabLabel, title, icon, helper }) => ({
      id,
      tabLabel,
      title,
      icon,
      helper,
    }));

    return [settingsTab, ...masterTabs];
  });

  const activeTabMeta = computed(() => (
    tabItems.value.find((tab) => tab.id === activeTab.value) || settingsTab
  ));

  const activeTableDetails = computed(() => (
    masterTables.find((table) => table.id === activeTab.value) || null
  ));

  async function fetchSettings(): Promise<void> {
    loadingSettings.value = true;
    try {
      systemSettings.value = await settingsService.getSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      $q.notify({ color: 'negative', message: 'ไม่สามารถโหลดข้อมูลการตั้งค่าได้' });
    } finally {
      loadingSettings.value = false;
    }
  }

  async function saveSetting(setting: SystemSetting): Promise<void> {
    try {
      await settingsService.updateSetting(setting.setting_key, {
        value: setting.setting_value,
        description: setting.description,
      });
      $q.notify({ color: 'positive', message: 'บันทึกการตั้งค่าสำเร็จ' });
    } catch (error) {
      console.error('Failed to save setting:', error);
      $q.notify({ color: 'negative', message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' });
    }
  }

  async function fetchMasterData(table: MasterDataTableId): Promise<void> {
    loadingMaster.value = true;
    try {
      masterData.value[table] = await masterDataService.getMasterData(table);
    } catch (error) {
      console.error(`Failed to load ${table}:`, error);
    } finally {
      loadingMaster.value = false;
    }
  }

  function openAddDialog(table: MasterDataTableId): void {
    isEditMode.value = false;
    masterForm.value = { id: null, table, value: '' };
    showMasterDialog.value = true;
  }

  function openEditDialog(table: MasterDataTableId, item: MasterDataItem): void {
    isEditMode.value = true;
    const value = ['related_agencies', 'schools', 'educational_areas'].includes(table)
      ? (item.name || '')
      : (item.label || '');
    masterForm.value = { id: item.id, table, value };
    showMasterDialog.value = true;
  }

  async function saveMasterData(): Promise<void> {
    if (!masterForm.value.value.trim() || !masterForm.value.table) {
      $q.notify({ color: 'warning', message: 'กรุณากรอกข้อมูล' });
      return;
    }

    const { table, id, value } = masterForm.value;
    const payloadKey = ['related_agencies', 'schools', 'educational_areas'].includes(table) ? 'name' : 'label';
    const payload = { [payloadKey]: value };

    try {
      if (isEditMode.value && id) {
        await masterDataService.updateMasterData(table, id, payload);
        $q.notify({ color: 'positive', message: 'อัปเดตข้อมูลสำเร็จ' });
      } else {
        await masterDataService.createMasterData(table, payload);
        $q.notify({ color: 'positive', message: 'เพิ่มข้อมูลสำเร็จ' });
      }

      showMasterDialog.value = false;
      await fetchMasterData(table);
    } catch (error) {
      console.error(`Failed to save ${table}:`, error);
      $q.notify({ color: 'negative', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
  }

  function confirmDelete(table: MasterDataTableId, id: number): void {
    $q.dialog({
      title: 'ยืนยันการลบ',
      message: 'คุณต้องการลบข้อมูลนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
      persistent: true,
      ok: {
        color: 'negative',
        label: 'ลบ',
        unelevated: true,
      },
      cancel: {
        color: 'grey-7',
        flat: true,
        label: 'ยกเลิก',
      },
    }).onOk(() => {
      void (async () => {
        try {
          await masterDataService.deleteMasterData(table, id);
          $q.notify({ color: 'positive', message: 'ลบข้อมูลสำเร็จ' });
          await fetchMasterData(table);
        } catch (error) {
          console.error(`Failed to delete from ${table}:`, error);
          $q.notify({ color: 'negative', message: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
        }
      })();
    });
  }

  watch(activeTab, (nextTab) => {
    if (nextTab === 'settings') {
      void fetchSettings();
      return;
    }

    void fetchMasterData(nextTab as MasterDataTableId);
  });

  onMounted(() => {
    void fetchSettings();
  });

  return {
    activeTab,
    loadingSettings,
    loadingMaster,
    systemSettings,
    masterData,
    showMasterDialog,
    isEditMode,
    masterForm,
    sortedSettings,
    visibleSettingCount,
    masterTables,
    tabItems,
    activeTabMeta,
    activeTableDetails,
    isSettingVisible,
    fetchSettings,
    saveSetting,
    fetchMasterData,
    openAddDialog,
    openEditDialog,
    saveMasterData,
    confirmDelete,
  };
}

