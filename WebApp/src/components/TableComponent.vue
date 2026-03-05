<template>
    <div class="d-flex flex-wrap align-center justify-space-between gap-2 mb-3">
      <v-card-title class="pa-0">{{ title }}</v-card-title>
      <v-text-field
        v-if="showSearch"
        v-model="searchInput"
        :placeholder="searchPlaceholder"
        density="compact"
        hide-details
        clearable
        variant="outlined"
        class="table-search"
        style="max-width: 280px; min-width: 200px;"
        prepend-inner-icon="mdi-magnify"
      />
    </div>

    <!-- Loading: circle loader for all backend calls -->
    <div v-show="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" width="3" />
    </div>

  <v-data-table
  v-show="!loading"
  :headers="headers"
  :items="items"
  :items-per-page="itemsPerPage"
  :items-per-page-options="itemsPerPageOptions"
  :loading="loading"
  class="elevation-1 table-truncate"
>
  <template v-slot:item="{ item }">
    <tr>
      <td
        v-for="header in headers"
        :key="header.value"
        class="table-cell"
      >
        <!-- Check if a slot exists for this column -->
        <slot
          :name="`item.${header.value}`"
          :item="item"
        >
          <!-- fallback: truncate long text, show full on hover -->
          <TooltipText
            :text="getCellText(item, header)"
            :max-length="50"
          />
        </slot>
      </td>
    </tr>
  </template>

  <template v-slot:no-data>
    <tr>
      <td :colspan="(headers?.length ?? 0) || 1" class="text-center text-medium-emphasis py-6">
        {{ noDataMessage }}
      </td>
    </tr>
  </template>
</v-data-table>

</template>

<script setup lang="ts">
import { toRefs, ref, watch } from "vue";
import TooltipText from "@/components/TooltipText.vue";

interface TableHeader {
  title: string;
  value: string;
  sortable?: boolean;
  formatter?: (item: any) => string;
}

const getCellText = (item: any, header: TableHeader) => {
  const val = header.formatter ? header.formatter(item) : item?.[header.value] ?? "-";
  return val != null ? String(val) : "-";
};

const props = withDefaults(
  defineProps<{
    title: string;
    headers: TableHeader[];
    items: any[];
    loading?: boolean;
    itemsPerPage?: number;
    itemsPerPageOptions?: number[];
    noDataMessage?: string;
    showSearch?: boolean;
    searchPlaceholder?: string;
  }>(),
  {
    loading: false,
    itemsPerPage: 10,
    itemsPerPageOptions: () => [5, 10, 15, 20, 25],
    noDataMessage: "No data.",
    showSearch: false,
    searchPlaceholder: "Search...",
  }
);

const emit = defineEmits<{ (e: "update:searchValue", value: string): void }>();

const { title, headers, items, loading, itemsPerPage, itemsPerPageOptions, noDataMessage, showSearch, searchPlaceholder } =
  toRefs(props);

const searchInput = ref("");
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchInput, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    emit("update:searchValue", val ?? "");
    debounceTimer = null;
  }, 300);
});
</script>

<style scoped>
.table-cell {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.table-search :deep(.v-field__input) {
  padding-top: 0;
  padding-bottom: 0;
}
</style>
