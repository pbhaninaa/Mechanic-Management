<template>
  <PageContainer>
    <v-card-title>Earnings</v-card-title>
    <v-card-text>
      <!-- Earnings Table -->
 
<v-data-table
          :headers="headers"
          :items="earnings"
          class="elevation-1"
          :items-per-page="5"
          :loading="loading"
        >

        <template #item.amount="{ item }">
          R {{ item.amount }}
        </template>

        <template #item.paidAt="{ item }">
          {{ item.paidAt }}
        </template>

        <template #item.status="{ item }">
          <v-chip :color="item.status === JOB_STATUS.PAID ? 'green' : 'orange'" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <template #no-data>
          No earnings found.
        </template>
      </v-data-table>

      <!-- Feedback -->
      <v-alert
        v-if="message && messageType === 'error'"
        type="error"
        class="mt-3"
        closable
        @click:close="message = ''"
      >
        {{ message }}
      </v-alert>
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import PageContainer from "../components/PageContainer.vue";
import apiService from "@/api/apiService";
import { format } from "date-fns";
import { JOB_STATUS } from "@/utils/constants";

// Table headers
const headers = [
  { text: "Job Description", value: "jobDescription" },
  { text: "Date", value: "paidAt" },
  { text: "Amount", value: "amount" },
  { text: "Status", value: "status" },
];

// State
const earnings = ref([]);
const loading = ref(false);
const message = ref("");
const messageType = ref("success");

// Logged in user
const loggedInUser = JSON.parse(localStorage.getItem("userProfile") || "{}");

// Fetch earnings depending on role
const fetchEarnings = async () => {
  loading.value = true;
  message.value = "";

  try {
    let response;
    const role = loggedInUser.roles?.[0];

    if (role === "MECHANIC") {
      response = await apiService.getPaymentsByMechanic(loggedInUser.id);
    } else if (role === "CARWASH") {
      response = await apiService.getPaymentsByCarWash(loggedInUser.id);
    } else {
      throw new Error("Invalid user role for earnings");
    }

    // Map backend data to table-friendly format
    earnings.value = (response.data || []).map((p) => ({
      id: p.id,
      jobDescription: p.jobDescription || `Job #${p.jobId}`,
      paidAt: format(new Date(p.paidAt), "dd MMM yyyy, HH:mm"),
      amount: Number(p.amount).toFixed(2),
      status: "Paid",
    }));
  } catch (err: any) {
    console.error("Error fetching earnings:", err);
    message.value = err.message || "Failed to load earnings";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
};

// Hide success message automatically when loading finishes
watch(loading, (newVal) => {
  if (!newVal && messageType.value === "success") {
    message.value = "";
  }
});

// Auto-fetch on mount
onMounted(fetchEarnings);
</script>

<style scoped>
.v-data-table th {
  font-weight: 600;
}
</style>
