import {
  computed,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue';

interface PaginationModel {
  page: number;
  rowsPerPage: number;
}

interface UsePaginationStateResult<TItem, TPagination extends PaginationModel> {
  pagination: Ref<TPagination>;
  totalPages: ComputedRef<number>;
  paginatedItems: ComputedRef<TItem[]>;
  paginationStart: ComputedRef<number>;
  paginationEnd: ComputedRef<number>;
  resetPage: () => void;
}

export function usePaginationState<TItem, TPagination extends PaginationModel>(
  items: MaybeRefOrGetter<TItem[]>,
  initialPagination: TPagination,
): UsePaginationStateResult<TItem, TPagination> {
  const pagination = ref({ ...initialPagination }) as Ref<TPagination>;

  const totalPages = computed(() => {
    const rows = toValue(items);
    return Math.max(1, Math.ceil(rows.length / pagination.value.rowsPerPage));
  });

  const paginatedItems = computed(() => {
    const rows = toValue(items);
    const start = (pagination.value.page - 1) * pagination.value.rowsPerPage;
    return rows.slice(start, start + pagination.value.rowsPerPage);
  });

  const paginationStart = computed(() => {
    const rows = toValue(items);
    if (rows.length === 0) {
      return 0;
    }

    return (pagination.value.page - 1) * pagination.value.rowsPerPage + 1;
  });

  const paginationEnd = computed(() => {
    const rows = toValue(items);
    if (rows.length === 0) {
      return 0;
    }

    return Math.min(pagination.value.page * pagination.value.rowsPerPage, rows.length);
  });

  function resetPage(): void {
    pagination.value.page = 1;
  }

  watch(() => pagination.value.rowsPerPage, resetPage);

  watch(
    () => toValue(items).length,
    () => {
      if (pagination.value.page > totalPages.value) {
        pagination.value.page = totalPages.value;
      }
    },
  );

  return {
    pagination,
    totalPages,
    paginatedItems,
    paginationStart,
    paginationEnd,
    resetPage,
  };
}
