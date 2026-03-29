<template>
  <q-page class="q-pa-lg bg-grey-1">
    <div style="max-width: 1200px; margin: 0 auto; width: 100%">
      <div class="row justify-between items-end q-mb-xl">
        <div>
          <h1 class="text-h3 text-weight-bolder q-mb-sm q-mt-none">นำเข้าข้อมูล</h1>
          <div class="text-subtitle1 text-grey-7" v-if="!importStore.hasFile">
            อัปโหลดไฟล์เพื่อเริ่มต้น รองรับไฟล์ CSV ขนาดไม่เกิน 50MB
          </div>
          <div class="text-subtitle1 text-grey-7" v-else>
            กรุณาจับคู่หัวคอลัมน์ของไฟล์กับฟิลด์ในระบบ ระบบได้จับคู่ชื่อที่คล้ายกันให้อัตโนมัติแล้ว
          </div>
        </div>
        <div v-if="importStore.hasFile">
          <q-btn
            color="negative"
            label="ยกเลิกอัปโหลด"
            @click="cancelUpload"
            unelevated
            style="border-radius: 8px"
            class="q-px-md q-py-sm text-weight-bold"
          />
        </div>
      </div>

      <!-- UPLOAD VIEW -->
      <div v-if="!importStore.hasFile" class="q-mx-auto" style="max-width: 800px">
        <q-card flat bordered class="q-pa-xl" style="border-radius: 16px">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6 text-primary flex items-center text-weight-bold">
              <q-icon name="upload_file" size="sm" class="q-mr-sm" /> อัปโหลดไฟล์
            </div>
            <a
              href="https://drive.google.com/file/d/1RoreCPrfgQDHBHoXNmoH4azNHqmS-cpM/view"
              target="_blank"
              class="text-primary text-subtitle2 text-weight-bold flex items-center"
              style="text-decoration: none"
            >
              <q-icon name="download" class="q-mr-xs" size="xs" /> ดาวน์โหลดเทมเพลต
            </a>
          </div>

          <div class="q-mb-lg">
            <q-btn-toggle
              v-model="importMode"
              spread
              no-caps
              rounded
              unelevated
              toggle-color="primary"
              color="grey-2"
              text-color="grey-8"
              class="text-weight-bold"
              :options="[
                { label: 'ข้อมูลเด็กในระบบ', value: 'student_term' },
                { label: 'ข้อมูลเด็กหลุดจากระบบ', value: 'student_dropouts' },
              ]"
            />
          </div>

          <div
            class="cursor-pointer bg-grey-1 column items-center justify-center upload-area relative-position q-pa-lg"
            :class="{ 'bg-blue-1': isDragging }"
            style="
              border: 2px dashed var(--q-primary);
              border-radius: 16px;
              min-height: 300px;
              transition: all 0.3s ease;
            "
            v-ripple
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragenter.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <q-avatar
              size="80px"
              color="primary"
              text-color="white"
              class="q-mb-md"
              style="opacity: 0.1; position: absolute; transform: scale(3); z-index: 0"
              icon="cloud_upload"
            />
            <q-avatar
              size="72px"
              class="bg-blue-1 text-primary q-mb-md z-top"
              icon="cloud_upload"
            />
            <div class="text-h6 text-weight-bold text-dark q-mb-sm z-top text-center">
              ลากและวางไฟล์ข้อมูลที่นี่
            </div>
            <div class="text-body2 text-grey-6 q-mb-lg z-top text-center">
              รองรับ .CSV (สูงสุด 50MB)
            </div>

            <q-btn
              color="white"
              text-color="primary"
              outline
              label="เลือกไฟล์"
              class="z-top text-weight-bold bg-white"
              @click.stop="triggerFileInput"
            />
            <input
              type="file"
              ref="fileInput"
              class="hidden"
              accept=".csv"
              @change="handleFileUpload"
              style="display: none"
            />
          </div>
        </q-card>
      </div>

      <!-- MAPPING VIEW -->
      <div v-else class="row q-col-gutter-lg q-mb-xl">
        <!-- Left Side: Columns -->
        <div class="col-12 col-md-8">
          <q-card flat bordered style="border-radius: 12px; overflow: hidden">
            <div
              class="bg-blue-grey-1 q-pa-md row items-center text-weight-bold text-grey-7 text-uppercase"
              style="font-size: 13px; letter-spacing: 0.5px"
            >
              <div class="col-5">คอลัมน์ที่ต้องการ</div>
              <div class="col-7">แมปฟิลด์ระบบ</div>
            </div>
            <q-separator />
            <div style="max-height: 500px; overflow-y: auto">
              <q-list separator>
                <q-item v-for="field in columns" :key="field" class="q-py-md items-center">
                  <q-item-section class="col-5">
                    <q-item-label class="text-weight-bold text-dark text-body1">{{
                      field
                    }}</q-item-label>
                    <q-item-label caption>ตัวอย่างข้อมูล...</q-item-label>
                  </q-item-section>
                  <q-item-section class="col-7 row items-center no-wrap flex-row">
                    <q-select
                      v-model="mappedFields[field]"
                      :options="importStore.fileHeaders"
                      outlined
                      dense
                      class="col-grow q-mr-md"
                      :bg-color="mappedFields[field] ? 'green-1' : 'yellow-1'"
                      :label="mappedFields[field] ? '' : 'เลือกฟิลด์เป้าหมาย...'"
                    />
                    <q-chip
                      v-if="mappedFields[field]"
                      color="positive"
                      text-color="white"
                      icon="check_circle"
                      size="sm"
                      class="text-weight-bold"
                      dense
                      >แมปแล้ว</q-chip
                    >
                    <q-chip
                      v-else
                      color="warning"
                      text-color="dark"
                      icon="warning"
                      size="sm"
                      class="text-weight-bold"
                      dense
                      >ยังไม่แมป</q-chip
                    >
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card>
        </div>

        <!-- Right Side: Summary -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="bg-blue-grey-1" style="border-radius: 12px">
            <q-card-section>
              <div class="text-subtitle1 text-primary text-weight-bold q-mb-lg flex items-center">
                <q-icon name="info" class="q-mr-sm" size="sm" /> สรุปการนำเข้า
              </div>
              <div class="row justify-between q-mb-md text-body1">
                <span class="text-grey-7">จำนวนแถวทั้งหมด:</span>
                <span class="text-weight-bold text-dark">
                  <template v-if="importStore.isParsing">กำลังโหลด...</template>
                  <template v-else>{{ importStore.totalRows.toLocaleString() }}</template>
                </span>
              </div>
              <div class="row justify-between q-mb-md text-body1">
                <span class="text-grey-7">คอลัมน์ที่ตรวจพบ:</span>
                <span class="text-weight-bold text-dark">
                  <template v-if="importStore.isParsing">-</template>
                  <template v-else>{{ importStore.fileHeaders.length }}</template>
                </span>
              </div>
              <div class="row justify-between q-mb-lg text-body1">
                <span class="text-grey-7">ฐานข้อมูลเป้าหมาย:</span>
                <span class="text-weight-bold text-primary">
                  {{ importMode === 'student_term' ? 'เด็กในระบบ' : 'เด็กหลุดจากระบบ' }}
                </span>
              </div>
              <div class="row justify-between q-mb-lg text-body1">
                <span class="text-grey-7">จับคู่อัตโนมัติ:</span>
                <span class="text-weight-bold text-positive"
                  >{{ autoMatchCount }}/{{ columns.length }}</span
                >
              </div>

              <q-separator color="grey-4" class="q-my-md" />

              <div
                class="text-caption text-grey-6 text-uppercase text-weight-bold q-mb-sm tracking-wide"
              >
                ไฟล์ที่เลือก
              </div>
              <q-card flat class="bg-white q-pa-md" style="border-radius: 8px">
                <div class="row items-center no-wrap">
                  <q-icon name="description" color="primary" size="lg" class="q-mr-md" />
                  <div class="col overflow-hidden">
                    <div class="text-weight-bold text-body2 ellipsis">
                      {{ importStore.fileName }}
                    </div>
                    <div class="text-caption text-grey-5">พร้อมดำเนินการ</div>
                  </div>
                </div>
              </q-card>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Data Preview Table -->
      <div class="q-mb-xl" v-if="importStore.hasFile">
        <div class="text-h5 text-weight-bold q-mb-md flex items-center text-dark">
          <q-icon name="visibility" class="q-mr-sm" color="primary" /> ตัวอย่างข้อมูล
          <span class="text-body1 text-grey-6 q-ml-sm">(5 แถวแรก)</span>
        </div>
        <q-markup-table
          flat
          bordered
          class="bg-white"
          style="border-radius: 12px; max-height: 400px; overflow: auto"
        >
          <thead class="bg-blue-grey-1">
            <tr>
              <th
                class="text-left text-weight-bold text-uppercase text-grey-7"
                v-for="(col, idx) in importStore.fileHeaders"
                :key="'header-' + idx"
              >
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="importStore.isParsing">
              <td
                :colspan="importStore.fileHeaders.length || 1"
                class="text-center text-grey-6 q-pa-xl"
              >
                <q-spinner color="primary" size="2em" class="q-mb-md" /><br />
                กำลังอ่านไฟล์...
              </td>
            </tr>
            <tr v-else v-for="(row, i) in importStore.filePreviewData" :key="'row-' + i">
              <td
                class="text-left text-body2"
                v-for="(cell, j) in row"
                :key="'cell-' + i + '-' + j"
              >
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </q-markup-table>

        <q-card flat bordered class="bg-white q-mt-lg q-pa-md shadow-2" style="border-radius: 12px">
          <div class="row justify-end items-center">
            <div class="text-grey-6 q-mr-md" v-if="autoMatchCount <= columns.length / 2">
              กรุณาแมปคอลัมน์มากกว่า 50% เพื่อดำเนินการต่อ
            </div>
            <q-btn
              color="primary"
              size="lg"
              icon="save"
              unelevated
              :loading="importStore.isImporting || isCheckingSchools"
              :disable="!canStartImport || isCheckingSchools"
              label="ยืนยันและเริ่มนำเข้า"
              @click="handleStartImport"
              style="border-radius: 8px"
              class="text-weight-bold q-px-xl"
            />
          </div>
        </q-card>
      </div>

      <div class="text-center text-grey-5 q-mt-xl q-mb-md text-caption">
        © 2026 ระบบติดตามนักเรียน สงวนลิขสิทธิ์
      </div>
    </div>

    <!-- Missing Schools Dialog -->
    <q-dialog v-model="showSchoolDialog" persistent>
      <q-card style="min-width: 500px; max-width: 700px; border-radius: 16px; width: 90vw">
        <q-card-section class="bg-primary text-white q-pa-lg">
          <div class="text-h6 text-weight-bold">กรอกข้อมูลโรงเรียนที่ยังไม่มีในระบบ</div>
          <div class="text-caption q-mt-xs opacity-80">
            พบ {{ schoolFormData.length }} โรงเรียนที่ยังไม่มีในระบบ กรุณากรอกข้อมูลก่อนนำเข้า
          </div>
        </q-card-section>

        <q-card-section class="q-pa-lg" style="max-height: 60vh; overflow-y: auto">
          <div v-for="(school, idx) in schoolFormData" :key="school.id">
            <div class="text-subtitle2 text-weight-bold q-mb-sm text-grey-8">
              <q-icon name="school" class="q-mr-xs" /> รหัสโรงเรียน: {{ school.id }}
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model="school.name"
                  label="ชื่อโรงเรียน *"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'กรุณากรอกชื่อโรงเรียน']"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="school.province" label="จังหวัด" outlined dense />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="school.district" label="อำเภอ" outlined dense />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="school.sub_district" label="ตำบล" outlined dense />
              </div>
            </div>
            <q-separator v-if="idx < schoolFormData.length - 1" class="q-my-lg" />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-gutter-sm">
          <q-btn flat label="ยกเลิก" @click="showSchoolDialog = false" />
          <q-btn
            color="primary"
            label="ยืนยันและนำเข้าข้อมูล"
            unelevated
            icon="save"
            :loading="importStore.isImporting"
            :disable="schoolFormData.some((s) => !s.name)"
            @click="submitWithSchools"
            style="border-radius: 8px"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { useImportDataPage } from '../composables/useImportDataPage';

const {
  importMode,
  importState: importStore,
  fileInput,
  isDragging,
  mappedFields,
  showSchoolDialog,
  isCheckingSchools,
  schoolFormData,
  autoMatchCount,
  canStartImport,
  columns,
  triggerFileInput,
  handleDrop,
  handleFileUpload,
  cancelUpload,
  handleStartImport,
  submitWithSchools,
} = useImportDataPage();
</script>

<style scoped>
.upload-area:hover {
  background-color: #f0f4f8 !important;
  border-color: var(--q-primary) !important;
}
</style>
