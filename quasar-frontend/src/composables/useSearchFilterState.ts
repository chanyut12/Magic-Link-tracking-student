import { computed, reactive, ref } from 'vue';

export function useSearchFilterState<TFilters extends object>(
  initialFilters: TFilters,
) {
  const searchQuery = ref('');
  const filters = reactive({ ...initialFilters }) as TFilters;

  const normalizedSearchQuery = computed(() => searchQuery.value.trim().toLowerCase());

  function resetSearch(): void {
    searchQuery.value = '';
  }

  function resetFilters(nextFilters: Partial<TFilters> = {}): void {
    Object.assign(filters, { ...initialFilters, ...nextFilters });
  }

  return {
    searchQuery,
    normalizedSearchQuery,
    filters,
    resetSearch,
    resetFilters,
  };
}
