<template>
  <PageContainer>
    <v-card-title>Earnings</v-card-title>
    <v-card-text>
      <!-- Earnings Table -->
      <v-data-table
        :headers="headers"
        :items="earnings"
        :loading="loading"
        class="elevation-1"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>Your Earnings</v-toolbar-title>
            <v-spacer></v-spacer>
            <Button label="Refresh" color="primary" :loading="loading" @click="fetchEarnings" />
          </v-toolbar>
        </template>

        <template v-slot:item.amount="{ item }">
          R {{ item.amount.toFixed(2) }}
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip :color="item.status === 'Paid' ? 'green' : 'orange'" dark>
            {{ item.status }}
          </v-chip>
        </template>
      </v-data-table>

      <!-- Feedback -->
      <v-alert
        v-if="message"
        :type="messageType"
        class="mt-3"
        closable
        @click:close="message = ''"
      >
        {{ message }}
      </v-alert>
    </v-card-text>
  </PageContainer>
</template>

<script setup>
import { ref, onMounted } from "vue";
import apiService from "../api/apiService";
import Button from "../components/Button.vue";
import PageContainer from "../components/PageContainer.vue";

// Table headers
const headers = [
  { text: "Job ID", value: "jobId" },
  { text: "Date", value: "date" },
  { text: "Amount", value: "amount" },
  { text: "Status", value: "status" },
];

// Default data (mock)
const earnings = ref([
  { jobId: "JOB123", date: "2025-09-01", amount: 1200, status: "Paid" },
  { jobId: "JOB124", date: "2025-09-05", amount: 850, status: "Pending" },
  { jobId: "JOB125", date: "2025-09-10", amount: 600, status: "Paid" },
]);

// Loading and feedback
const loading = ref(false);
const message = ref("");
const messageType = ref("success");

// Fetch earnings (API simulation)
const fetchEarnings = async () => {
  loading.value = true;
  message.value = "";
  try {
    // Replace with API call when ready
    // const response = await apiService.getEarnings();
    // earnings.value = response.data;

    message.value = "Earnings updated successfully!";
    messageType.value = "success";
  } catch (err) {
    console.error("Error fetching earnings:", err);
    message.value = err.message || "Failed to load earnings";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
};

// Auto-fetch on mount
onMounted(fetchEarnings);
</script>
