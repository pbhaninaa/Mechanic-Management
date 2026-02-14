<template>
  <PageContainer>
    <v-card-text>
      <!-- Earnings Table -->
      <TableComponent title="Earnings" :headers="headers" :items="earnings" class="elevation-1" :items-per-page="5"
        :loading="loading">

        <template #item.amount="{ item }">
          R {{ item.amount }}
        </template>

        <template #item.paidAt="{ item }">
          {{ item.paidAt }}
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <template #no-data>
          No earnings found.
        </template>
      </TableComponent>


      <!-- Feedback -->
      <v-alert v-if="message && messageType === 'error'" type="error" class="mt-3" closable @click:close="message = ''">
        {{ message }}
      </v-alert>
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";
import { format } from "date-fns";
import { getStatusColor } from "@/utils/helper";
import { USER_ROLES } from "@/utils/constants";
import TableComponent from "@/components/TableComponent.vue";

// Logged in user
const loggedInUser = JSON.parse(localStorage.getItem("userProfile") || "{}");
const role = loggedInUser.roles?.[0];
// Table headers
const headers = [
  { title: "Job Description", value: "jobDescription" },
  { title: "Date", value: "paidAt" },
  { title: "Amount", value: "amount" },
  ...(role === USER_ROLES.ADMIN
    ? [{ title: "Platform Fee", value: "platformFee" }]
    : []),
  { title: "Status", value: "status" },
];


// State
const earnings = ref([]);
const loading = ref(false);
const message = ref("");
const messageType = ref("success");


// Fetch earnings depending on role
const fetchEarnings = async () => {
  loading.value = true;
  message.value = "";

  try {
    let response;
    if (role === USER_ROLES.MECHANIC) {
      response = await apiService.getPaymentsByMechanic(loggedInUser.id);
    } else if (role === USER_ROLES.CAR_WASH) {
      response = await apiService.getPaymentsByCarWash(loggedInUser.id);
    } else if (role === USER_ROLES.ADMIN) {
      response = await apiService.getPaymentsByClients();
    } else {
      throw new Error("Invalid user role for earnings");
    }

    // Map backend data to table-friendly format
    earnings.value = (response.data || []).map((p) => ({
      id: p.id,
      jobDescription: p.jobDescription || `Job #${p.jobId}`,
      paidAt: format(new Date(p.paidAt), "dd MMM yyyy, HH:mm"),
      amount: Number(p.amount + (p.platformFee || 0)).toFixed(2),
      platformFee: role === USER_ROLES.ADMIN ? Number(p.platformFee).toFixed(2) : undefined,
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

</style>
