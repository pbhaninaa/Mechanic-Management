<template>
    <v-card-title>{{ title }}</v-card-title>

    <!-- Loading -->
    <div v-show="loading" class="text-center my-4">
      <v-progress-circular indeterminate color="primary" />
    </div>

  <v-data-table
  v-show="!loading"
  :headers="headers"
  :items="items"
  :items-per-page="itemsPerPage"
  :loading="loading"
  class="elevation-1"
>
  <template v-slot:item="{ item }">
    <tr>
      <td
        v-for="header in headers"
        :key="header.value"
      >
        <!-- Check if a slot exists for this column -->
        <slot
          :name="`item.${header.value}`"
          :item="item"
        >
          <!-- fallback to formatter or raw value -->
          {{ header.formatter ? header.formatter(item) : item?.[header.value] ?? "-" }}
        </slot>
      </td>
    </tr>
  </template>

  <template v-slot:no-data>
    <NoDataMessage
      :message="noDataMessage"
      :itemsLength="items.length"
      :loading="loading"
    />
  </template>
</v-data-table>

</template>

<script setup lang="ts">
import { withDefaults, defineProps, toRefs } from "vue";
import NoDataMessage from "@/components/NoDataMessage.vue";

interface TableHeader {
  text: string;  
  value: string;
  sortable?: boolean;
  formatter?: (item: any) => string;
}

const props = withDefaults(
  defineProps<{
    title: string;
    headers: TableHeader[];
    items: any[];
    loading?: boolean;
    itemsPerPage?: number;
    noDataMessage?: string;
  }>(),
  {
    loading: false,
    itemsPerPage: 5,
    noDataMessage: "No items found.",
  }
);

const { title, headers, items, loading, itemsPerPage, noDataMessage } =
  toRefs(props);
</script>
