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
          :items="items"
          :items-per-page="itemsPerPage"
          class=""
          :loading="loading"
          v-bind="$attrs"
          loading-text="Fetching data..."
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
import { defineProps } from "vue";
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

const loading = props.loading ?? false;
const itemsPerPage = props.itemsPerPage ?? 5;
const scopedSlots = props.scopedSlots ?? {};
const noDataMessage = props.noDataMessage ?? "No items found.";
</script>

<style scoped>
.mt-3 {
  margin-top: 1rem;
}
.text-center {
  text-align: center;
}
</style>
