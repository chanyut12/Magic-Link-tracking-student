<template>
  <q-page class="q-pa-lg bg-grey-1">
    <div style="max-width: 1200px; margin: 0 auto; width: 100%;">
      <div class="row justify-between items-end q-mb-xl">
        <div>
          <h1 class="text-h3 text-weight-bolder q-mb-sm q-mt-none">Import Data</h1>
          <div class="text-subtitle1 text-grey-7" v-if="!importStore.hasFile">
            Upload your file to get started. We support CSV and XLSX formats up to 50MB.
          </div>
          <div class="text-subtitle1 text-grey-7" v-else>
            Please align your file's column headers with the system fields. We've attempted to auto-match similar names for you.
          </div>
        </div>
        <div v-if="importStore.hasFile">
          <q-btn color="negative" label="Cancel Upload" @click="cancelUpload" unelevated style="border-radius: 8px;" class="q-px-md q-py-sm text-weight-bold" />
        </div>
      </div>

      <!-- UPLOAD VIEW -->
      <div v-if="!importStore.hasFile" class="q-mx-auto" style="max-width: 800px;">
        <q-card flat bordered class="q-pa-xl" style="border-radius: 16px;">
          <div class="row items-center justify-between q-mb-lg">
            <div class="text-h6 text-primary flex items-center text-weight-bold">
              <q-icon name="upload_file" size="sm" class="q-mr-sm" /> File Upload
            </div>
            <a href="https://drive.google.com/file/d/1RoreCPrfgQDHBHoXNmoH4azNHqmS-cpM/view" target="_blank" class="text-primary text-subtitle2 text-weight-bold flex items-center" style="text-decoration: none;">
              <q-icon name="download" class="q-mr-xs" size="xs" /> Download Template
            </a>
          </div>

          <div 
            class="cursor-pointer bg-grey-1 column items-center justify-center upload-area relative-position q-pa-lg" 
            style="border: 2px dashed var(--q-primary); border-radius: 16px; min-height: 300px; transition: all 0.3s ease;"
            v-ripple
            @click="triggerFileInput"
          >
            <q-avatar size="80px" color="primary" text-color="white" class="q-mb-md" style="opacity: 0.1; position: absolute; transform: scale(3); z-index: 0" icon="cloud_upload" />
            <q-avatar size="72px" class="bg-blue-1 text-primary q-mb-md z-top" icon="cloud_upload" />
            <div class="text-h6 text-weight-bold text-dark q-mb-sm z-top text-center">Drag and drop your data file here</div>
            <div class="text-body2 text-grey-6 q-mb-lg z-top text-center">Supports .CSV, .XLSX (Max 50MB)</div>
            
            <q-btn color="white" text-color="primary" outline label="Browse Files" class="z-top text-weight-bold bg-white" @click.stop="triggerFileInput" />
            <input type="file" ref="fileInput" class="hidden" accept=".csv,.xlsx" @change="handleFileUpload" style="display: none;" />
          </div>
        </q-card>
      </div>

      <!-- MAPPING VIEW -->
      <div v-else class="row q-col-gutter-lg q-mb-xl">
        <!-- Left Side: Columns -->
        <div class="col-12 col-md-8">
          <q-card flat bordered style="border-radius: 12px; overflow: hidden;">
            <div class="bg-blue-grey-1 q-pa-md row items-center text-weight-bold text-grey-7 text-uppercase" style="font-size: 13px; letter-spacing: 0.5px;">
              <div class="col-5">Require Column</div>
              <div class="col-7">System Field Mapping</div>
            </div>
            <q-separator />
            <div style="max-height: 500px; overflow-y: auto;">
              <q-list separator>
                <q-item v-for="field in columns" :key="field" class="q-py-md items-center">
                  <q-item-section class="col-5">
                    <q-item-label class="text-weight-bold text-dark text-body1">{{ field }}</q-item-label>
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
                    <q-chip v-if="mappedFields[field]" color="positive" text-color="white" icon="check_circle" size="sm" class="text-weight-bold" dense>Mapped</q-chip>
                    <q-chip v-else color="warning" text-color="dark" icon="warning" size="sm" class="text-weight-bold" dense>Unmapped</q-chip>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card>
        </div>

        <!-- Right Side: Summary -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="bg-blue-grey-1" style="border-radius: 12px;">
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
                <span class="text-grey-7">Auto-matches:</span>
                <span class="text-weight-bold text-positive">{{ autoMatchCount }}/{{ columns.length }}</span>
              </div>
              
              <q-separator color="grey-4" class="q-my-md" />
              
              <div class="text-caption text-grey-6 text-uppercase text-weight-bold q-mb-sm tracking-wide">Selected File</div>
              <q-card flat class="bg-white q-pa-md" style="border-radius: 8px;">
                <div class="row items-center no-wrap">
                  <q-icon name="description" color="primary" size="lg" class="q-mr-md" />
                  <div class="col overflow-hidden">
                    <div class="text-weight-bold text-body2 ellipsis">{{ importStore.fileName }}</div>
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
          <q-icon name="visibility" class="q-mr-sm" color="primary" /> Data Preview <span class="text-body1 text-grey-6 q-ml-sm">(Top 5 Rows)</span>
        </div>
        <q-markup-table flat bordered class="bg-white" style="border-radius: 12px; max-height: 400px; overflow: auto;">
          <thead class="bg-blue-grey-1">
            <tr>
              <th class="text-left text-weight-bold text-uppercase text-grey-7" v-for="(col, idx) in importStore.fileHeaders" :key="'header-' + idx">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="importStore.isParsing">
              <td :colspan="importStore.fileHeaders.length || 1" class="text-center text-grey-6 q-pa-xl">
                <q-spinner color="primary" size="2em" class="q-mb-md" /><br/>
                กำลังอ่านไฟล์...
              </td>
            </tr>
            <tr v-else v-for="(row, i) in importStore.filePreviewData" :key="'row-' + i">
              <td class="text-left text-body2" v-for="(cell, j) in row" :key="'cell-' + i + '-' + j">
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </q-markup-table>
        
        <q-card flat bordered class="bg-white q-mt-lg q-pa-md shadow-2" style="border-radius: 12px;">
          <div class="row justify-end items-center">
            <div class="text-grey-6 q-mr-md" v-if="autoMatchCount < columns.length">Please map all columns to continue</div>
            <q-btn 
              color="primary" 
              size="lg" 
              icon="save" 
              unelevated
              :loading="importStore.isImporting" 
              :disable="importStore.isImporting || autoMatchCount < columns.length" 
              label="Confirm and Start Import" 
              @click="handleStartImport" 
              style="border-radius: 8px;"
              class="text-weight-bold q-px-xl"
            />
          </div>
        </q-card>
      </div>

      <div class="text-center text-grey-5 q-mt-xl q-mb-md text-caption">
        © 2026 Student tracking system. All rights reserved.
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';

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
  async submitImport(mapping: Record<string, string>) {
    if (!this.uploadedFile) return false;

    this.isImporting = true;
    try {
      // Simulating API call for POC
      console.log('Submitting file:', this.uploadedFile.name);
      console.log('With mapping:', mapping);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return true;
    } catch (e) {
      console.error('Error importing data:', e);
      return false;
    } finally {
      this.isImporting = false;
    }
  },
});

const fileInput = ref<HTMLInputElement | null>(null);
const mappedFields = ref<Record<string, string>>({});
const autoMatchCount = computed(() => {
  return Object.values(mappedFields.value).filter((val) => val !== '').length;
});

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
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
  if (autoMatchCount.value === 0) {
    alert('Please map at least one column before importing.');
    return;
  }

  const success = await importStore.submitImport(mappedFields.value);
  if (success) {
    alert('Import initiated successfully!');
    cancelUpload();
  } else {
    alert('Import failed. Please try again.');
  }
};

const columns = ref([
  'SCHOOLID',
  'STUDENTID',
  'PERSONID',
  'PASSPORTNUMBER',
  'PREFIXID',
  'FIRSTNAME',
  'MIDDLENAME',
  'LASTNAME',
  'GENDERID',
  'BIRTHDATE',
  'NATIONALITYID',
  'DISABILITYID',
  'DISADVANTAGEEDUCATIONID',
  'HOUSEID',
  'HOUSENUMBER',
  'VILLAGENUMBER',
  'STREET',
  'SOI',
  'TROK',
  'SUBDISTRICTID',
  'SCHOOLADMISSIONYEAR',
  'EDUCATIONLEVELID',
  'GRADELEVELID',
  'CURRICULUMID',
  'MAJORID',
  'PROGRAMID',
  'OCCUPATIONGROUPID',
  'COURSEID',
  'GPAX',
  'PARTNERSCHOOLCODE',
  'STUDENTSTATUSID',
  'STUDENTWEIGHT',
  'STUDENTHIGHT',
  'SUBVENTIONID',
  'SCOUTTYPEID',
  'SCOUTSID',
  'MEMBERREDCROSSYOUTHID',
]);

watch(
  () => importStore.fileHeaders,
  (headers) => {
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
