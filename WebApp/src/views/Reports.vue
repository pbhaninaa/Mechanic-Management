<template>
  <PageContainer>
    <v-card-title>Reports</v-card-title>
    <v-card-text>
      <p>System reports and analytics for Admin.</p>

      <!-- Demo Reports Table -->
      <v-data-table
        :headers="headers"
        :items="reports"
        class="elevation-1"
        :items-per-page="5"
      >
        <template #item.status="{ item }">
          <v-chip :color="item.status === 'Completed' ? 'green' : 'orange'" dark>
            {{ item.status }}
          </v-chip>
        </template>
      </v-data-table>

      <div v-if="reports.length === 0" class="mt-3">
        No reports available.
      </div>
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from "vue";
import PageContainer from "@/components/PageContainer.vue";

interface Report {
  id: number;
  title: string;
  generatedOn: string;
  status: string;
}

// Demo reports (replace with API call later)
const reports = ref<Report[]>([
  { id: 1, title: "Monthly Earnings", generatedOn: "2025-09-01", status: "Completed" },
  { id: 2, title: "Job Requests Overview", generatedOn: "2025-09-05", status: "In Progress" },
  { id: 3, title: "Client Activity", generatedOn: "2025-09-10", status: "Completed" },
]);

const headers = [
  { text: "Title", value: "title" },
  { text: "Generated On", value: "generatedOn" },
  { text: "Status", value: "status" },
];

// Uncomment for API integration later
// const loadReports = async () => {
//   try {
//     const res = await apiService.getReports();
//     reports.value = res.data;
//   } catch (err: any) {
//     console.error("Failed to load reports:", err);
//   }
// };
</script>

<style scoped>
.mt-3 {
  margin-top: 1rem;
}
</style>
