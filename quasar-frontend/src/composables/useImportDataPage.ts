import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { importService } from '../services/importService';
import type { ImportMode, ImportResult, ManualSchoolRecord } from '../types/import';
import { getImportColumns, buildAutoMappedFields } from '../utils/importColumns';
import { parseImportFile } from '../utils/importFileParser';
import { notifyError } from '../utils/notify';

interface ImportState {
  uploadedFile: File | null;
  fileHeaders: string[];
  filePreviewData: string[][];
  totalRows: number;
  isParsing: boolean;
  isImporting: boolean;
  readonly hasFile: boolean;
  readonly fileName: string;
  readonly fileSize: number;
}

interface SchoolFormRecord extends ManualSchoolRecord {
  province: string;
  district: string;
  sub_district: string;
}

function isCsvFile(file: File | null | undefined): file is File {
  return Boolean(file && file.name.toLowerCase().endsWith('.csv'));
}

export function useImportDataPage() {
  const $q = useQuasar();

  const importMode = ref<ImportMode>('student_term');
  const fileInput = ref<HTMLInputElement | null>(null);
  const isDragging = ref(false);
  const mappedFields = ref<Record<string, string>>({});
  const showSchoolDialog = ref(false);
  const isCheckingSchools = ref(false);
  const schoolFormData = ref<SchoolFormRecord[]>([]);

  const importState = reactive<ImportState>({
    uploadedFile: null,
    fileHeaders: [],
    filePreviewData: [],
    totalRows: 0,
    isParsing: false,
    isImporting: false,
    get hasFile() {
      return this.uploadedFile !== null;
    },
    get fileName() {
      return this.uploadedFile?.name || '';
    },
    get fileSize() {
      return this.uploadedFile?.size || 0;
    },
  });

  const columns = computed(() => getImportColumns(importMode.value));
  const autoMatchCount = computed(() => (
    Object.values(mappedFields.value).filter((value) => value !== '').length
  ));
  const canStartImport = computed(() => (
    !importState.isImporting && autoMatchCount.value > columns.value.length / 2
  ));

  async function setFile(file: File): Promise<void> {
    importState.uploadedFile = file;
    importState.isParsing = true;

    try {
      const preview = await parseImportFile(file);
      importState.fileHeaders = preview.fileHeaders;
      importState.filePreviewData = preview.filePreviewData;
      importState.totalRows = preview.totalRows;
    } catch (error) {
      console.error('Error parsing file:', error);
      clearFile();
      $q.notify({
        type: 'negative',
        message: 'ไม่สามารถอ่านไฟล์ได้ โปรดตรวจสอบรูปแบบไฟล์ CSV แล้วลองใหม่อีกครั้ง',
        position: 'top',
      });
    } finally {
      importState.isParsing = false;
    }
  }

  function clearFile(): void {
    importState.uploadedFile = null;
    importState.fileHeaders = [];
    importState.filePreviewData = [];
    importState.totalRows = 0;
    showSchoolDialog.value = false;
    schoolFormData.value = [];
  }

  function triggerFileInput(): void {
    fileInput.value?.click();
  }

  async function acceptFile(file: File | null | undefined): Promise<void> {
    if (!isCsvFile(file)) {
      $q.notify({
        type: 'negative',
        message: 'โปรดอัปโหลดไฟล์นามสกุล .csv เท่านั้น',
        position: 'top',
      });
      return;
    }

    await setFile(file);
  }

  async function handleDrop(event: DragEvent): Promise<void> {
    isDragging.value = false;
    await acceptFile(event.dataTransfer?.files?.[0] || null);
  }

  async function handleFileUpload(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    await acceptFile(target.files?.[0] || null);
  }

  function cancelUpload(): void {
    clearFile();
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }

  async function submitImport(schools: ManualSchoolRecord[]): Promise<ImportResult | null> {
    if (!importState.uploadedFile) {
      return null;
    }

    importState.isImporting = true;
    try {
      return await importService.submitImport({
        file: importState.uploadedFile,
        target: importMode.value,
        mapping: mappedFields.value,
        schools,
      });
    } catch (error) {
      console.error('Error importing data:', error);
      notifyError($q, error, 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล โปรดลองอีกครั้ง', {
        type: 'negative',
      });
      return null;
    } finally {
      importState.isImporting = false;
    }
  }

  async function doImport(schools: SchoolFormRecord[]): Promise<void> {
    const response = await submitImport(schools);

    if (!response?.success) {
      return;
    }

    if (response.rowsInserted === 0) {
      $q.notify({
        type: 'warning',
        message: `ไม่มีข้อมูลเข้าสู่ระบบเลย (สำเร็จ 0 แถว ข้าม ${response.rowsSkipped} แถว). ตรวจสอบว่าได้ Map ข้อมูลคอลัมน์ชื่อ 'PersonID_Onec' (รหัสประชาชน) หรือไม่`,
        position: 'top',
        timeout: 5000,
      });
      return;
    }

    $q.notify({
      type: 'positive',
      message: `นำเข้าข้อมูลลงฐาน ${importMode.value === 'student_term' ? 'Student Term' : 'Student Dropouts'} สำเร็จแล้ว (${response.rowsInserted} แถว)!`,
      position: 'top',
    });
    cancelUpload();
  }

  async function handleStartImport(): Promise<void> {
    if (!canStartImport.value) {
      $q.notify({
        type: 'warning',
        message: 'โปรด Map ข้อมูลให้ตรงกันเกิน 50% ก่อนทำการนำเข้าข้อมูล',
        position: 'top',
      });
      return;
    }

    if (!importState.uploadedFile) {
      return;
    }

    if (importMode.value === 'student_term') {
      isCheckingSchools.value = true;

      try {
        const missingSchools = await importService.checkMissingSchools({
          file: importState.uploadedFile,
          mapping: mappedFields.value,
        });

        if (missingSchools.length > 0) {
          schoolFormData.value = missingSchools.map((school) => ({
            id: school.id,
            name: '',
            province: '',
            district: '',
            sub_district: '',
          }));
          showSchoolDialog.value = true;
          return;
        }
      } catch (error) {
        console.error('Error checking schools:', error);
        notifyError($q, error, 'ไม่สามารถตรวจสอบข้อมูลโรงเรียนได้', {
          type: 'negative',
        });
        return;
      } finally {
        isCheckingSchools.value = false;
      }
    }

    await doImport([]);
  }

  async function submitWithSchools(): Promise<void> {
    showSchoolDialog.value = false;
    await doImport(schoolFormData.value);
  }

  watch(
    [() => importState.fileHeaders, importMode],
    ([headers]) => {
      mappedFields.value = headers.length > 0
        ? buildAutoMappedFields(headers, columns.value)
        : {};
    },
    { immediate: true },
  );

  return {
    importMode,
    importState,
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
  };
}
