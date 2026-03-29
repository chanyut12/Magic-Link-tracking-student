<template>
  <q-page class="system-settings-page q-pa-md q-pa-lg-md">
    <div class="page-container">
      <section class="settings-hero q-mb-lg">
        <div class="hero-copy">
          <p class="hero-eyebrow text-subtitle2 text-weight-medium">System Control Center</p>
          <h1 class="hero-title text-h5 text-weight-bold">ตั้งค่าระบบและข้อมูลพื้นฐาน</h1>
          <p class="hero-subtitle text-subtitle2">
            ปรับค่าการทำงานของระบบและจัดการ Master Data ให้อ่านง่าย ค้นหาเร็ว และบำรุงรักษาง่ายขึ้น
          </p>
        </div>

        <div class="hero-metrics">
          <div class="hero-metric hero-metric--blue">
            <q-icon name="tune" size="18px" />
            <div>
              <div class="hero-metric__label">ตัวแปรระบบ</div>
              <div class="hero-metric__value">{{ visibleSettingCount }} รายการ</div>
            </div>
          </div>
          <div class="hero-metric hero-metric--teal">
            <q-icon name="layers" size="18px" />
            <div>
              <div class="hero-metric__label">หมวด Master Data</div>
              <div class="hero-metric__value">{{ masterTables.length }} หมวด</div>
            </div>
          </div>
        </div>
      </section>

      <q-card class="settings-shell">
        <div class="tabs-wrap">
          <q-tabs
            v-model="activeTab"
            class="settings-tabs"
            align="left"
            dense
            no-caps
            inline-label
            mobile-arrows
            outside-arrows
            active-color="primary"
            indicator-color="transparent"
          >
            <q-tab
              v-for="tab in tabItems"
              :key="tab.id"
              :name="tab.id"
              :icon="tab.icon"
              :label="tab.tabLabel"
              class="settings-tab"
            />
          </q-tabs>
        </div>

        <q-tab-panels v-model="activeTab" animated class="settings-panels">
          <q-tab-panel name="settings" class="panel-body">
            <div class="panel-head q-mb-md">
              <div>
                <div class="panel-title">{{ activeTabMeta.title }}</div>
                <div class="panel-subtitle">{{ activeTabMeta.helper }}</div>
              </div>
              <q-badge class="panel-badge" color="blue-1" text-color="primary">
                {{ visibleSettingCount }} รายการ
              </q-badge>
            </div>

            <div v-if="loadingSettings" class="row justify-center q-pa-xl">
              <q-spinner-dots color="primary" size="40px" />
            </div>

            <div v-else class="settings-form-grid">
              <template v-for="setting in sortedSettings" :key="setting.setting_key">
                <section v-if="isSettingVisible(setting)" class="setting-card q-pa-md">
                  <div class="setting-key q-mb-xs">{{ setting.setting_key }}</div>
                  <div class="setting-desc q-mb-sm">{{ setting.description || 'ไม่มีคำอธิบาย' }}</div>
                  <div class="setting-input-row">
                    <q-select
                      v-if="setting.setting_key === 'ALERT_TRIGGER_TYPE'"
                      v-model="setting.setting_value"
                      :options="['SCHEDULED', 'IMMEDIATE']"
                      outlined
                      dense
                      class="col-grow"
                      emit-value
                      map-options
                    />

                    <q-input
                      v-else-if="setting.setting_key === 'ALERT_SCHEDULE_TIME'"
                      v-model="setting.setting_value"
                      outlined
                      dense
                      class="col-grow"
                      type="time"
                    />

                    <q-input v-else v-model="setting.setting_value" outlined dense class="col-grow" />

                    <q-btn
                      class="save-btn"
                      color="primary"
                      label="บันทึก"
                      unelevated
                      no-caps
                      @click="saveSetting(setting)"
                    />
                  </div>
                </section>
              </template>
            </div>
          </q-tab-panel>

          <q-tab-panel v-for="table in masterTables" :key="table.id" :name="table.id" class="panel-body">
            <div class="panel-head q-mb-md">
              <div>
                <div class="panel-title">{{ table.title }}</div>
                <div class="panel-subtitle">{{ table.helper }}</div>
              </div>
              <q-btn
                class="add-btn"
                unelevated
                no-caps
                icon="add"
                label="เพิ่มข้อมูล"
                @click="openAddDialog(table.id)"
              />
            </div>

            <div v-if="loadingMaster" class="row justify-center q-pa-xl">
              <q-spinner-dots color="primary" size="40px" />
            </div>

            <div v-else>
              <q-list class="master-list">
                <q-item
                  v-for="(item, index) in masterData[table.id] || []"
                  :key="item.id"
                  class="master-item q-py-md"
                  :style="{ '--item-accent': table.accent, '--item-soft': table.soft }"
                >
                  <q-item-section avatar>
                    <q-avatar text-color="white" size="sm" :style="{ background: table.accent }">
                      {{ index + 1 }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="item-label text-weight-medium text-body1">
                      {{ ['related_agencies', 'schools', 'educational_areas'].includes(table.id) ? item.name : item.label }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="row q-gutter-x-sm">
                      <q-btn
                        flat
                        round
                        class="action-btn action-btn--edit"
                        color="primary"
                        icon="edit"
                        size="sm"
                        @click="openEditDialog(table.id, item)"
                      />
                      <q-btn
                        flat
                        round
                        class="action-btn action-btn--delete"
                        color="negative"
                        icon="delete"
                        size="sm"
                        @click="confirmDelete(table.id, item.id)"
                      />
                    </div>
                  </q-item-section>
                </q-item>

                <q-item v-if="!masterData[table.id] || masterData[table.id]?.length === 0" class="empty-state">
                  <q-item-section class="text-center q-py-xl">
                    <q-icon name="inbox" size="30px" color="blue-grey-4" class="q-mb-sm" />
                    <div class="empty-label">ไม่พบข้อมูล</div>
                    <div class="empty-hint">กดปุ่ม เพิ่มข้อมูล เพื่อเริ่มรายการแรก</div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>

      <q-dialog v-model="showMasterDialog" persistent>
        <q-card class="master-dialog">
          <q-card-section class="row items-center">
            <div class="text-h6 text-weight-bold">{{ isEditMode ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่' }}</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup class="dialog-close" />
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

          <q-card-actions align="right" class="q-px-md q-pb-md dialog-actions">
            <q-btn flat label="ยกเลิก" color="grey-7" v-close-popup no-caps />
            <q-btn unelevated label="บันทึก" color="primary" @click="saveMasterData" no-caps class="dialog-save-btn" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useSystemSettingsPage } from '../composables/useSystemSettingsPage';

const {
  activeTab,
  loadingSettings,
  loadingMaster,
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
  saveSetting,
  openAddDialog,
  openEditDialog,
  saveMasterData,
  confirmDelete,
} = useSystemSettingsPage();
</script>

<style lang="scss" scoped>
.system-settings-page {
  min-height: 100vh;
  font-family: 'Prompt', 'Inter', sans-serif;
  background:
    radial-gradient(circle at 8% 0%, rgba(59, 130, 246, 0.2), transparent 42%),
    radial-gradient(circle at 92% 8%, rgba(20, 184, 166, 0.18), transparent 34%),
    linear-gradient(180deg, #eef5ff 0%, #f5f9ff 45%, #f3f8ff 100%);
}

.page-container {
  max-width: 1260px;
  margin: 0 auto;
  animation: page-fade-in 360ms ease-out;
}

.settings-hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-copy {
  max-width: 720px;
}

.hero-eyebrow {
  margin: 0 0 6px;
  color: #4f46e5;
}

.hero-title {
  margin: 0;
  line-height: 1.15;
  color: #0f172a;
}

.hero-subtitle {
  margin: 8px 0 0;
  color: #475569;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-width: 340px;
}

.hero-metric {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 14px;
  padding: 12px 14px;
  border: 1px solid transparent;
}

.hero-metric__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.hero-metric__value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.hero-metric--blue {
  background: linear-gradient(145deg, #ebf3ff, #f7fbff);
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.hero-metric--teal {
  background: linear-gradient(145deg, #e8fcf8, #f3fffd);
  border-color: #99f6e4;
  color: #0f766e;
}

.settings-shell {
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid #dce8f8;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 252, 255, 0.95));
  box-shadow: 0 20px 45px rgba(30, 64, 175, 0.08);
}

.tabs-wrap {
  padding: 12px 12px 0;
  border-bottom: 1px solid #e0e8f4;
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.72), rgba(247, 251, 255, 0.72));
}

:deep(.settings-tabs .q-tabs__content) {
  gap: 8px;
}

:deep(.settings-tabs .q-tab) {
  min-height: 44px;
  border-radius: 12px 12px 0 0;
  color: #64748b;
  padding: 0 12px;
  transition: background-color 0.18s ease, color 0.18s ease;
}

:deep(.settings-tabs .q-tab__label) {
  font-size: 0.84rem;
  font-weight: 600;
}

:deep(.settings-tabs .q-tab:hover) {
  background: #edf4ff;
  color: #2563eb;
}

:deep(.settings-tabs .q-tab--active) {
  background: linear-gradient(180deg, #ffffff, #f8fbff);
  color: #1d4ed8;
  box-shadow: inset 0 3px 0 #2563eb;
}

.settings-panels {
  background: transparent;
}

:deep(.settings-panels .q-tab-panel) {
  padding: 22px 24px 26px;
}

.panel-body {
  min-height: 420px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.panel-title {
  font-size: 1.08rem;
  font-weight: 700;
  color: #0f172a;
}

.panel-subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.85rem;
  max-width: 700px;
}

.panel-badge {
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.76rem;
}

.settings-form-grid {
  display: grid;
  gap: 12px;
  max-width: 860px;
}

.setting-card {
  position: relative;
  border-radius: 14px;
  border: 1px solid #dbe7ff;
  background: linear-gradient(180deg, #f8fbff 0%, #f2f7ff 100%);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.setting-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  border-radius: 14px 0 0 14px;
  background: linear-gradient(180deg, #2563eb 0%, #06b6d4 100%);
}

.setting-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.12);
}

.setting-key {
  color: #0f172a;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.setting-desc {
  color: #64748b;
  font-size: 0.82rem;
}

.setting-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.col-grow {
  flex: 1 1 260px;
  min-width: 220px;
}

.save-btn {
  min-width: 96px;
  border-radius: 10px;
}

:deep(.setting-card .q-field--outlined .q-field__control) {
  border-radius: 10px;
  background: #ffffff;
}

:deep(.setting-card .q-field--outlined .q-field__control::before) {
  border: 1px solid #d5e3f8;
}

:deep(.setting-card .q-field--outlined.q-field--focused .q-field__control::before) {
  border-color: #3b82f6;
}

.add-btn {
  color: #eff6ff;
  border-radius: 11px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  padding: 0 14px;
}

.master-list {
  border: 1px solid #dfe8f4;
  border-radius: 14px;
  overflow: hidden;
  background: #f8fbff;
}

.master-item {
  border-inline-start: 4px solid var(--item-accent);
  background: var(--item-soft);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.master-item + .master-item {
  border-top: 1px solid #e3ebf7;
}

.master-item:hover {
  background: #ffffff;
  transform: translateX(2px);
}

.item-label {
  color: #0f172a;
}

.action-btn {
  border-radius: 10px;
}

.action-btn--edit {
  background: rgba(37, 99, 235, 0.08);
}

.action-btn--delete {
  background: rgba(225, 29, 72, 0.08);
}

.empty-state {
  background: linear-gradient(180deg, #f8fbff, #ffffff);
}

.empty-label {
  font-weight: 700;
  color: #334155;
}

.empty-hint {
  margin-top: 4px;
  font-size: 0.8rem;
  color: #64748b;
}

.master-dialog {
  width: min(430px, 92vw);
  border-radius: 16px;
  border: 1px solid #dbe7ff;
  background: linear-gradient(180deg, #ffffff, #f8fbff);
}

.dialog-close {
  background: rgba(148, 163, 184, 0.12);
}

.dialog-actions {
  gap: 8px;
}

.dialog-save-btn {
  border-radius: 10px;
  min-width: 88px;
}

@media (max-width: 1023px) {
  .hero-metrics {
    min-width: 0;
    width: 100%;
  }

  :deep(.settings-panels .q-tab-panel) {
    padding: 18px 16px 20px;
  }
}

@media (max-width: 767px) {
  .hero-metrics {
    grid-template-columns: 1fr;
  }

  :deep(.settings-tabs .q-tab__label) {
    font-size: 0.8rem;
  }

  .setting-input-row {
    align-items: stretch;
  }

  .save-btn {
    width: 100%;
  }
}

@keyframes page-fade-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
