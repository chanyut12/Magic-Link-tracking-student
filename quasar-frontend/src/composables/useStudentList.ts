import { computed, ref, watch } from 'vue';
import { useAsyncState } from './useAsyncState';
import { usePaginationState } from './usePaginationState';
import { useSearchFilterState } from './useSearchFilterState';
import { studentService } from '../services/studentService';
import type {
  StudentListFilters,
  StudentListItem,
  StudentListPagination,
} from '../types/student';

const rowsPerPageOptions = [10, 20, 50] as const;

export function useStudentList() {
  const students = ref<StudentListItem[]>([]);
  const { loading, run } = useAsyncState();
  const {
    searchQuery,
    normalizedSearchQuery,
    filters,
  } = useSearchFilterState<StudentListFilters>({
    schoolId: '',
    grade: 'ALL',
    room: 'ALL',
  });

  const filteredStudents = computed(() => {
    let list = [...students.value];
    const normalizedSearch = normalizedSearchQuery.value;

    if (normalizedSearch) {
      list = list.filter((student) => (
        student.name.toLowerCase().includes(normalizedSearch)
        || String(student.id).includes(normalizedSearch)
      ));
    }

    return list.sort((left, right) => (
      left.name.localeCompare(right.name, 'th', { sensitivity: 'base' })
    ));
  });
  const {
    pagination,
    totalPages,
    paginatedItems: paginatedStudents,
    paginationStart,
    paginationEnd,
    resetPage,
  } = usePaginationState<StudentListItem, StudentListPagination>(filteredStudents, {
    page: 1,
    rowsPerPage: 20,
    sortBy: 'name',
    descending: false,
  });

  async function fetchStudentsList() {
    const nextStudents = await run(
      () => studentService.getStudents({
        schoolId: filters.schoolId || undefined,
        grade: filters.grade,
        room: filters.room,
      }),
      {
        onError: (err) => {
          console.error('Fetch students error:', err);
        },
      },
    );

    if (nextStudents) {
      students.value = nextStudents;
    } else {
      students.value = [];
    }
  }

  watch(
    [searchQuery, () => filters.schoolId, () => filters.grade, () => filters.room],
    resetPage,
  );

  return {
    students,
    searchQuery,
    loading,
    filters,
    rowsPerPageOptions,
    pagination,
    filteredStudents,
    paginatedStudents,
    paginationStart,
    paginationEnd,
    totalPages,
    fetchStudentsList,
  };
}
