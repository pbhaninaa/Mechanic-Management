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
    <NoDataMessage
      :message="noDataMessage"
      :itemsLength="items.length"
      :loading="loading"
    />
  </template>
</v-data-table>

</template>

<script setup lang="ts">
import { toRefs } from "vue";
import NoDataMessage from "@/components/NoDataMessage.vue";
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
  }>(),
  {
    loading: false,
    itemsPerPage: 10,
    itemsPerPageOptions: () => [5, 10, 15, 20, 25],
    noDataMessage: "No items found.",
  }
);

const { title, headers, items, loading, itemsPerPage, itemsPerPageOptions, noDataMessage } =
  toRefs(props);
</script>

<style scoped>
.table-cell {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
