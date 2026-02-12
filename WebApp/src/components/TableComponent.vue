<template>
  <PageContainer>
    <v-card-title>{{ title }}</v-card-title>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <!-- Table -->
    <v-data-table
      v-else
      :headers="headers"
      v-bind="$attrs"
      loading-text="Fetching data..."
      :items-per-page="itemsPerPage"
      :items="items"
      :loading="loading"
      class="elevation-1"
    >
      <!-- Scoped slots for custom columns -->
      <template v-for="(slotFn, key) in scopedSlots" v-slot:[`item.${key}`]="slotProps">
        <component :is="slotFn" v-bind="slotProps" />
      </template>

      <slot />
    </v-data-table>

    <!-- Empty state -->
    <NoDataMessage :message="noDataMessage" :itemsLength="items.length" :loading="loading" />
  </PageContainer>
</template>

<script setup lang="ts">
import { defineProps, watch } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import NoDataMessage from "@/components/NoDataMessage.vue";

interface TableHeader {
  title: string;
  value: string;
  sortable?: boolean;
}

const props = defineProps<{
  title: string;
  headers: TableHeader[];
  items: any[];
  loading?: boolean;
  itemsPerPage?: number;
  scopedSlots?: Record<string, any>;
  noDataMessage?: string;
}>();

// Props defaults
const loading = props.loading ?? false;
const itemsPerPage = props.itemsPerPage ?? 5;
const scopedSlots = props.scopedSlots ?? {};
const noDataMessage = props.noDataMessage ?? "No items found.";

// ✅ Watch incoming items and log
watch(
  () => props.items,
  (newItems) => {
    console.log("Incoming table items:", newItems);
  },
  { immediate: true }
);

// ✅ Optional: log headers too
console.log("Table headers:", props.headers);
</script>

<style scoped>
.mt-3 {
  margin-top: 1rem;
}

.text-center {
  text-align: center;
}
</style>
