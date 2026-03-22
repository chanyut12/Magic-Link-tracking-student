<template>
  <q-page class="q-pa-lg bg-grey-1">
    <div style="max-width: 1200px; margin: 0 auto; width: 100%">
      <div class="row justify-between items-end q-mb-xl">
        <div>
          <h1 class="text-h3 text-weight-bolder q-mb-sm q-mt-none">Import Data</h1>
          <div class="text-subtitle1 text-grey-7" v-if="!importStore.hasFile">
            Upload your file to get started. We support CSV formats up to 50MB.
          </div>
          <div class="text-subtitle1 text-grey-7" v-else>
            Please align your file's column headers with the system fields. We've attempted to
            auto-match similar names for you.
          </div>
        </div>
        <div v-if="importStore.hasFile">
          <q-btn
            color="negative"
            label="Cancel Upload"
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
              <q-icon name="upload_file" size="sm" class="q-mr-sm" /> File Upload
            </div>
            <a
              href="https://drive.google.com/file/d/1RoreCPrfgQDHBHoXNmoH4azNHqmS-cpM/view"
              target="_blank"
              class="text-primary text-subtitle2 text-weight-bold flex items-center"
              style="text-decoration: none"
            >
              <q-icon name="download" class="q-mr-xs" size="xs" /> Download Template
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
              Drag and drop your data file here
            </div>
            <div class="text-body2 text-grey-6 q-mb-lg z-top text-center">
              Supports .CSV (Max 50MB)
            </div>

            <q-btn
              color="white"
              text-color="primary"
              outline
              label="Browse Files"
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
              <div class="col-5">Require Column</div>
              <div class="col-7">System Field Mapping</div>
            </div>
            <q-separator />
            <div style="max-height: 500px; overflow-y: auto">
              <q-list separator>
                <q-item v-for="field in columns" :key="field" class="q-py-md items-center">
                  <q-item-section class="col-5">
                    <q-item-label class="text-weight-bold text-dark text-body1">{{
                      field
                    }}</q-item-label>
                    <q-item-label caption>Sample data...</q-item-label>
                  </q-item-section>
                  <q-item-section class="col-7 row items-center no-wrap flex-row">
                    <q-select
                      v-model="mappedFields[field]"
                      :options="importStore.fileHeaders"
                      outlined
                      dense
                      class="col-grow q-mr-md"
                      :bg-color="mappedFields[field] ? 'green-1' : 'yellow-1'"
                      :label="mappedFields[field] ? '' : 'Select target field...'"
                    />
                    <q-chip
                      v-if="mappedFields[field]"
                      color="positive"
                      text-color="white"
                      icon="check_circle"
                      size="sm"
                      class="text-weight-bold"
                      dense
                      >Mapped</q-chip
                    >
                    <q-chip
                      v-else
                      color="warning"
                      text-color="dark"
                      icon="warning"
                      size="sm"
                      class="text-weight-bold"
                      dense
                      >Unmapped</q-chip
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
                <q-icon name="info" class="q-mr-sm" size="sm" /> Import Summary
              </div>
              <div class="row justify-between q-mb-md text-body1">
                <span class="text-grey-7">Total Rows:</span>
                <span class="text-weight-bold text-dark">
                  <template v-if="importStore.isParsing">กำลังโหลด...</template>
                  <template v-else>{{ importStore.totalRows.toLocaleString() }}</template>
                </span>
              </div>
              <div class="row justify-between q-mb-md text-body1">
                <span class="text-grey-7">Columns Detected:</span>
                <span class="text-weight-bold text-dark">
                  <template v-if="importStore.isParsing">-</template>
                  <template v-else>{{ importStore.fileHeaders.length }}</template>
                </span>
              </div>
              <div class="row justify-between q-mb-lg text-body1">
                <span class="text-grey-7">Target Database:</span>
                <span class="text-weight-bold text-primary">
                  {{ importMode === 'student_term' ? 'Student Term' : 'Student Dropouts' }}
                </span>
              </div>
              <div class="row justify-between q-mb-lg text-body1">
                <span class="text-grey-7">Auto-matches:</span>
                <span class="text-weight-bold text-positive"
                  >{{ autoMatchCount }}/{{ columns.length }}</span
                >
              </div>

              <q-separator color="grey-4" class="q-my-md" />

              <div
                class="text-caption text-grey-6 text-uppercase text-weight-bold q-mb-sm tracking-wide"
              >
                Selected File
              </div>
              <q-card flat class="bg-white q-pa-md" style="border-radius: 8px">
                <div class="row items-center no-wrap">
                  <q-icon name="description" color="primary" size="lg" class="q-mr-md" />
                  <div class="col overflow-hidden">
                    <div class="text-weight-bold text-body2 ellipsis">
                      {{ importStore.fileName }}
                    </div>
                    <div class="text-caption text-grey-5">Ready to process</div>
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
          <q-icon name="visibility" class="q-mr-sm" color="primary" /> Data Preview
          <span class="text-body1 text-grey-6 q-ml-sm">(Top 5 Rows)</span>
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
              Please map more than 50% of the columns to continue
            </div>
            <q-btn
              color="primary"
              size="lg"
              icon="save"
              unelevated
              :loading="importStore.isImporting"
              :disable="importStore.isImporting || autoMatchCount <= columns.length / 2"
              label="Confirm and Start Import"
              @click="handleStartImport"
              style="border-radius: 8px"
              class="text-weight-bold q-px-xl"
            />
          </div>
        </q-card>
      </div>

      <div class="text-center text-grey-5 q-mt-xl q-mb-md text-caption">
        © 2026 Student tracking system. All rights reserved.
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
import { ref, computed, watch, reactive } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const importMode = ref('student_term');

const importStore = reactive({
  uploadedFile: null as File | null,
  fileHeaders: [] as string[],
  filePreviewData: [] as string[][],
  totalRows: 0,
  isParsing: false,
  isImporting: false,

  // getters
  get hasFile() {
    return this.uploadedFile !== null;
  },
  get fileName() {
    return this.uploadedFile?.name || '';
  },
  get fileSize() {
    return this.uploadedFile?.size || 0;
  },

  // actions
  async setFile(file: File) {
    this.uploadedFile = file;
    await this.parseFile(file);
  },
  clearFile() {
    this.uploadedFile = null;
    this.fileHeaders = [];
    this.filePreviewData = [];
    this.totalRows = 0;
  },
  async parseFile(file: File) {
    this.isParsing = true;
    try {
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
        if (lines.length > 0) {
          const parseLine = (line: string) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') inQuotes = !inQuotes;
              else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
              } else current += char;
            }
            result.push(current.trim().replace(/^"|"$/g, ''));
            return result;
          };

          this.fileHeaders = parseLine(lines[0]!);
          this.totalRows = lines.length - 1;

          const previewLines = lines.slice(1, 6);
          this.filePreviewData = previewLines.map((line) => parseLine(line));
        }
      }
    } catch (e) {
      console.error('Error parsing file:', e);
    } finally {
      this.isParsing = false;
    }
  },
  async submitImport(
    mapping: Record<string, string>,
    mode: string,
    schools: Array<{ id: number; name: string; province?: string; district?: string; sub_district?: string }> = [],
  ) {
    if (!this.uploadedFile) return false;

    this.isImporting = true;
    try {
      const formData = new FormData();
      formData.append('file', this.uploadedFile);
      formData.append('target', mode);
      formData.append('mapping', JSON.stringify(mapping));
      if (schools.length > 0) {
        formData.append('schools', JSON.stringify(schools));
      }

      const response = await fetch('http://localhost:3000/api/imports/bulk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }

      const data = await response.json();
      console.log(`Successfully imported ${this.uploadedFile.name} to ${mode}`);
      return data;
    } catch (e) {
      console.error('Error importing data:', e);
      return false;
    } finally {
      this.isImporting = false;
    }
  },
});

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const mappedFields = ref<Record<string, string>>({});
const showSchoolDialog = ref(false);
const isCheckingSchools = ref(false);
const schoolFormData = ref<Array<{ id: number; name: string; province: string; district: string; sub_district: string }>>([]);
const autoMatchCount = computed(() => {
  return Object.values(mappedFields.value).filter((val) => val !== '').length;
});

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      await importStore.setFile(file);
    } else {
      $q.notify({
        type: 'negative',
        message: 'โปรดอัปโหลดไฟล์นามสกุล .csv เท่านั้น',
        position: 'top',
      });
    }
  }
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file) {
      await importStore.setFile(file);
    }
  }
};

const cancelUpload = () => {
  importStore.clearFile();
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const handleStartImport = async () => {
  if (autoMatchCount.value <= columns.value.length / 2) {
    $q.notify({
      type: 'warning',
      message: 'โปรด Map ข้อมูลให้ตรงกันเกิน 50% ก่อนทำการนำเข้าข้อมูล',
      position: 'top',
    });
    return;
  }

  // Check for missing schools (student_term only)
  if (importMode.value === 'student_term') {
    isCheckingSchools.value = true;
    try {
      const checkForm = new FormData();
      checkForm.append('file', importStore.uploadedFile!);
      checkForm.append('mapping', JSON.stringify(mappedFields.value));
      const res = await fetch('http://localhost:3000/api/imports/check-schools', {
        method: 'POST',
        body: checkForm,
      });
      if (res.ok) {
        const { missingSchools } = await res.json() as { missingSchools: { id: number }[] };
        if (missingSchools.length > 0) {
          schoolFormData.value = missingSchools.map((s) => ({
            id: s.id,
            name: '',
            province: '',
            district: '',
            sub_district: '',
          }));
          showSchoolDialog.value = true;
          return;
        }
      }
    } catch (e) {
      console.error('Error checking schools:', e);
    } finally {
      isCheckingSchools.value = false;
    }
  }

  await doImport([]);
};

const submitWithSchools = async () => {
  showSchoolDialog.value = false;
  await doImport(schoolFormData.value);
};

const doImport = async (schools: typeof schoolFormData.value) => {
  const response = await importStore.submitImport(mappedFields.value, importMode.value, schools);
  if (response && response.success) {
    if (response.rowsInserted === 0) {
      $q.notify({
        type: 'warning',
        message: `ไม่มีข้อมูลเข้าสู่ระบบเลย (สำเร็จ 0 แถว ข้าม ${response.rowsSkipped} แถว). ตรวจสอบว่าได้ Map ข้อมูลคอลัมน์ชื่อ 'PersonID_Onec' (รหัสประชาชน) หรือไม่`,
        position: 'top',
        timeout: 5000,
      });
    } else {
      $q.notify({
        type: 'positive',
        message: `นำเข้าข้อมูลลงฐาน ${importMode.value === 'student_term' ? 'Student Term' : 'Student Dropouts'} สำเร็จแล้ว (${response.rowsInserted} แถว)!`,
        position: 'top',
      });
      cancelUpload();
    }
  } else {
    $q.notify({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล โปรดลองอีกครั้ง',
      position: 'top',
    });
  }
};

const studentTermColumns = [
  'AcademicYear_Onec',
  'Semester_Onec',
  'DepartmentID_Onec',
  'SchoolID_Onec',
  'PersonID_Onec',
  'PassportNumber_Onec',
  'PrefixID_Onec',
  'FirstName_Onec',
  'MiddleName_Onec',
  'LastName_Onec',
  'GenderID_Onec',
  'NationalityID_Onec',
  'DisabilityID_Onec',
  'DisadvantageEducationID_Onec',
  'VillageNumber_Onec',
  'Street_Onec',
  'Soi_Onec',
  'Trok_Onec',
  'SubDistrictID_Onec',
  'SchoolAdmissionYear_Onec',
  'GradeLevelID_Onec',
  'RoomID_Onec',
  'GPAX_Onec',
  'StudentStatusID_Onec',
  'ProvinceNameThai_Onec',
  'DistrictNameThai_Onec',
  'SubDistrictNameThai_Onec',
];

const studentDropoutsColumns = [
  'ProvinceNameThai_Onec',
  'DistrictNameThai_Onec',
  'SubDistrictNameThai_Onec',
  'PersonID_Onec',
  'Fullname_Onec',
  'Gender_Onec',
  'NationalityName_Onec',
  'BirthDate_Onec',
  'HouseNumber_Onec',
  'VillageNumber_Onec',
  'Street_Onec',
  'Soi_Onec',
  'Trok_Onec',
  'StatusCodeCause_Onec',
  'Remark_Onec',
  'SchoolName_Onec',
  'GradeLevelID_Onec',
  'AcademicYearPresent_Onec',
  'DropoutTransferID_Onec',
  'ACADYEAR',
  'RoomID_Onec',
  'SchoolID_Onec',
  'GenderID_Onec',
  'GPAX_Onec',
];

const columns = computed(() => {
  return importMode.value === 'student_term' ? studentTermColumns : studentDropoutsColumns;
});

watch(
  [() => importStore.fileHeaders, importMode],
  ([headers]) => {
    if (headers && headers.length > 0) {
      const newMappings: Record<string, string> = {};
      columns.value.forEach((sysCol) => {
        newMappings[sysCol] = '';
      });
      columns.value.forEach((sysCol) => {
        const matchedHeader = headers.find((h) => h.trim().toLowerCase() === sysCol.toLowerCase());
        if (matchedHeader) {
          newMappings[sysCol] = matchedHeader;
        }
      });
      mappedFields.value = newMappings;
    } else {
      mappedFields.value = {};
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.upload-area:hover {
  background-color: #f0f4f8 !important;
  border-color: var(--q-primary) !important;
}
</style>
